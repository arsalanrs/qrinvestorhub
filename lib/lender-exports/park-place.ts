import 'server-only';
import ExcelJS from 'exceljs';
import path from 'node:path';
import type { InvestorApplication } from '@/types/investor-application';
import type { DocumentItem } from '@/types/investor-application';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { toNum } from '@/lib/loan-calculations';
import { PARK_PLACE_REQUIRED_DOCS } from '@/config/park-place-docs';

const BUCKET = 'lender-exports';

type UploadedDoc = Pick<DocumentItem, 'label' | 'fileName' | 'status'>;

export type ParkPlaceChecklistItem = {
  key: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  matchedDocumentName: string;
};

export type LenderExportArtifact = {
  lender: 'park_place';
  generatedAt: string;
  includeReo: boolean;
  files: Array<{ name: string; storageRef: string }>;
  preview: {
    project: Record<string, string | number | boolean>;
    budget: Record<string, string | number | boolean>;
    reo?: Record<string, string | number | boolean>;
  };
  checklist: ParkPlaceChecklistItem[];
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function hasExperience(app: InvestorApplication): boolean {
  const exp = app.experience;
  return Boolean(
    exp.completedFlips
      || exp.completedNewBuilds
      || exp.ownsRentals
      || toNum(exp.flipsLast3Years) > 0
      || toNum(exp.newBuildsLast3Years) > 0
      || toNum(exp.rentalsOwned) > 0,
  );
}

function findUploadedDocByTerms(documents: UploadedDoc[], terms: string[]): UploadedDoc | null {
  const uploaded = (documents || []).filter(d => d.status === 'uploaded');
  for (const doc of uploaded) {
    const hay = normalizeText(`${doc.label} ${doc.fileName || ''}`);
    if (terms.some(term => hay.includes(normalizeText(term)))) {
      return doc;
    }
  }
  return null;
}

export function buildParkPlaceChecklist(
  documents: UploadedDoc[],
  includeReo: boolean,
): ParkPlaceChecklistItem[] {
  return PARK_PLACE_REQUIRED_DOCS.map(item => {
    const required = item.key === 'ppf_reo' ? includeReo : item.requiredByDefault;
    const match = findUploadedDocByTerms(documents, item.matchTerms);
    return {
      key: item.key,
      label: item.label,
      required,
      uploaded: Boolean(match),
      matchedDocumentName: match?.fileName || match?.label || '',
    };
  });
}

function toDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function templatePath(fileName: string): string {
  return path.join(process.cwd(), 'templates', 'park-place', fileName);
}

async function loadTemplateWorkbook(fileName: string): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath(fileName));
  return wb;
}

function parseMonths(value?: string): number | null {
  if (!value) return null;
  const m = value.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function splitAddressParts(subjectAddress?: string): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  const raw = (subjectAddress || '').trim();
  if (!raw) return { address: '', city: '', state: '', zip: '' };
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const city = parts[parts.length - 2] || '';
    const stateZip = parts[parts.length - 1] || '';
    const match = stateZip.match(/^([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?$/);
    return {
      address: parts.slice(0, parts.length - 2).join(', '),
      city,
      state: match?.[1] || '',
      zip: match?.[2] || '',
    };
  }
  const stateZipMatch = raw.match(/,\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (stateZipMatch) {
    const prefix = raw.replace(/,\s*[A-Za-z]{2}\s+\d{5}(?:-\d{4})?$/, '');
    const prefixParts = prefix.split(',').map(p => p.trim()).filter(Boolean);
    return {
      address: prefixParts.slice(0, -1).join(', ') || prefix,
      city: prefixParts[prefixParts.length - 1] || '',
      state: stateZipMatch[1] || '',
      zip: stateZipMatch[2] || '',
    };
  }
  return { address: raw, city: '', state: '', zip: '' };
}

async function buildReoWorkbook(app: InvestorApplication): Promise<Buffer> {
  const wb = await loadTemplateWorkbook('PPF REO.xlsx');
  const sheet = wb.getWorksheet('Real Estate Owned');
  if (!sheet) throw new Error('PPF REO template missing sheet: Real Estate Owned');
  const prop = app.properties?.find(p => p.isMain) || app.properties?.[0];
  const fallbackAddr = splitAddressParts(app.loanRequest.purchaseSubjectAddress);

  // New Construction/Renovation row (row 4)
  sheet.getCell('B4').value = prop?.address || fallbackAddr.address || app.loanRequest.purchaseSubjectAddress || '';
  sheet.getCell('C4').value = prop?.unit || '';
  sheet.getCell('D4').value = prop?.city || fallbackAddr.city || '';
  sheet.getCell('E4').value = prop?.state || fallbackAddr.state || '';
  sheet.getCell('F4').value = prop?.zip || fallbackAddr.zip || '';
  sheet.getCell('G4').value = prop?.propertyType || '';
  sheet.getCell('H4').value = app.entity.entityName || `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  sheet.getCell('I4').value = app.entity.ownershipPercentage ? Number(app.entity.ownershipPercentage) / 100 : 1;
  sheet.getCell('J4').value = toNum(app.loanRequest.purchasePrice);
  sheet.getCell('K4').value = toDate(app.loanRequest.closingDate);
  sheet.getCell('L4').value = toNum(app.loanRequest.constructionBudget);
  sheet.getCell('M4').value = app.constructionGoal?.isGroundUp ? 'Ground-Up Construction' : 'Heavy Renovation';
  sheet.getCell('N4').value = null;
  sheet.getCell('O4').value = null;
  sheet.getCell('P4').value = toNum(app.loanRequest.completedValue);

  // Rentals/Bridge row (row 12) - populate only if borrower owns rentals.
  if (app.experience.ownsRentals || toNum(app.experience.rentalsOwned) > 0) {
    sheet.getCell('B12').value = prop?.address || '';
    sheet.getCell('C12').value = prop?.unit || '';
    sheet.getCell('D12').value = prop?.city || '';
    sheet.getCell('E12').value = prop?.state || '';
    sheet.getCell('F12').value = prop?.zip || '';
    sheet.getCell('G12').value = prop?.propertyType || '';
    sheet.getCell('H12').value = app.entity.entityName || `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
    sheet.getCell('I12').value = app.entity.ownershipPercentage ? Number(app.entity.ownershipPercentage) / 100 : 1;
    sheet.getCell('J12').value = toNum(app.loanRequest.purchasePrice);
    sheet.getCell('K12').value = toDate(app.loanRequest.closingDate);
    sheet.getCell('L12').value = toNum(prop?.estimatedMarketRent);
    sheet.getCell('M12').value = 'Long Term Rental (3+ Months)';
    sheet.getCell('N12').value = 'Yes';
    sheet.getCell('O12').value = null;
    sheet.getCell('P12').value = null;
  } else {
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].forEach(col => {
      sheet.getCell(`${col}12`).value = null;
    });
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

async function buildConstructionBudgetWorkbook(app: InvestorApplication): Promise<Buffer> {
  const wb = await loadTemplateWorkbook('Construction Budget - Single Asset.xlsx');
  const step1 = wb.getWorksheet('Step 1. Project Details');
  const step2 = wb.getWorksheet('Step 2. Construction Budget');
  const step3 = wb.getWorksheet('Step 3. Construction Schedule');
  if (!step1 || !step2 || !step3) {
    throw new Error('Construction Budget template missing one or more required sheets');
  }
  const prop = app.properties?.find(p => p.isMain) || app.properties?.[0];
  const fallbackAddr = splitAddressParts(app.loanRequest.purchaseSubjectAddress);
  const borrowerName = `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  const fullAddress = [
    prop?.address || fallbackAddr.address || app.loanRequest.purchaseSubjectAddress || '',
    prop?.city || fallbackAddr.city || '',
    prop?.state || fallbackAddr.state || '',
    prop?.zip || fallbackAddr.zip || '',
  ].filter(Boolean).join(', ');
  const inspectionName = `${app.loanOfficer?.name || app.borrower.firstName} ${app.borrower.lastName}`.trim();
  const gcCompany = app.entity.entityName || borrowerName;
  const timelineMonths = parseMonths(app.constructionGoal?.constructionTimeline || app.loanRequest.fundingTimeline) || 6;

  // Step 1 input cells (green cells in lender template)
  step1.getCell('D10').value = borrowerName;
  step1.getCell('E12').value = prop?.address || fallbackAddr.address || app.loanRequest.purchaseSubjectAddress || '';
  step1.getCell('E14').value = prop?.city || fallbackAddr.city || '';
  step1.getCell('E15').value = prop?.state || fallbackAddr.state || '';
  step1.getCell('E16').value = prop?.zip || fallbackAddr.zip || '';
  step1.getCell('K10').value = inspectionName;
  step1.getCell('K11').value = app.borrower.phone || '';
  step1.getCell('K12').value = app.borrower.email || '';
  step1.getCell('K14').value = app.constructionGoal?.builderName || borrowerName;
  step1.getCell('K15').value = gcCompany;
  step1.getCell('K16').value = app.constructionGoal?.builderLicense || '';
  step1.getCell('B22').value =
    app.additionalNotes
    || `Construction loan request for ${fullAddress}. Program: ${app.loanProgram || 'construction'}.`;
  step1.getCell('H29').value = 'Quality Grade (ex. Mid-level name brand or some custom)';
  step1.getCell('H30').value = `${timelineMonths} Months`;
  const permitStatus = normalizeText(app.constructionGoal?.permitStatus || '');
  step1.getCell('H31').value = permitStatus.includes('no') ? 'No' : 'Yes';
  step1.getCell('H32').value = permitStatus.includes('issued') ? 'Yes' : 'No';
  step1.getCell('H33').value = `${Math.max(1, Math.ceil(timelineMonths / 3))} Months`;
  step1.getCell('H34').value = app.constructionGoal?.addingSqft ? 'Yes' : 'No';
  step1.getCell('H35').value = app.constructionGoal?.addingSqft ? 'Both (foundation expansion)' : 'Vertical (no foundation expansion)';

  // Step 2 key fields and budget template line items
  step2.getCell('D5').value = borrowerName;
  step2.getCell('D6').value = fullAddress;
  step2.getCell('B8').value = app.additionalNotes || `Construction scope for ${fullAddress}`;
  const totalBudget = toNum(app.loanRequest.constructionBudget);
  const lineItems = [
    { row: 18, amount: Math.round(totalBudget * 0.05), note: 'Plans/engineering allocation from intake budget' },
    { row: 19, amount: Math.round(totalBudget * 0.05), note: 'Permit allocation from intake budget' },
    { row: 31, amount: Math.round(totalBudget * 0.08), note: 'Site work allocation from intake budget' },
    { row: 34, amount: Math.round(totalBudget * 0.12), note: 'Foundation allocation from intake budget' },
    { row: 37, amount: Math.round(totalBudget * 0.2), note: 'Framing allocation from intake budget' },
    { row: 48, amount: Math.round(totalBudget * 0.1), note: 'Plumbing rough-in allocation' },
    { row: 50, amount: Math.round(totalBudget * 0.1), note: 'Electrical rough-in allocation' },
    { row: 52, amount: Math.round(totalBudget * 0.1), note: 'HVAC rough-in allocation' },
    { row: 66, amount: Math.round(totalBudget * 0.08), note: 'Drywall allocation' },
    { row: 74, amount: Math.round(totalBudget * 0.12), note: 'Cabinets/countertops allocation' },
  ];
  lineItems.forEach(item => {
    step2.getCell(`H${item.row}`).value = item.amount;
    step2.getCell(`J${item.row}`).value = item.note;
  });
  const assigned = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const remainder = Math.max(totalBudget - assigned, 0);
  step2.getCell('H94').value = remainder;
  step2.getCell('J94').value = 'Contingency / remaining budget from intake';

  // Step 3 schedule months (column J)
  const scheduleRows = [11, 13, 15, 17, 19, 21, 23, 25, 27, 29];
  const perPhase = Math.max(1, Math.round(timelineMonths / scheduleRows.length));
  scheduleRows.forEach((row, idx) => {
    const value = idx === scheduleRows.length - 1 ? Math.max(1, timelineMonths - perPhase * (scheduleRows.length - 1)) : perPhase;
    step3.getCell(`J${row}`).value = `${value} Month${value > 1 ? 's' : ''}`;
  });

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

function checklistCsv(checklist: ParkPlaceChecklistItem[]): string {
  const rows: string[] = ['Key,Document,Required,Uploaded,Matched Uploaded File'];
  for (const item of checklist) {
    const line = [
      item.key,
      item.label.replace(/,/g, ';'),
      item.required ? 'Yes' : 'No',
      item.uploaded ? 'Yes' : 'No',
      (item.matchedDocumentName || '').replace(/,/g, ';'),
    ];
    rows.push(line.join(','));
  }
  return rows.join('\n');
}

async function ensureBucket() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage.listBuckets();
  if (data?.some(b => b.name === BUCKET)) return;
  await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 15 * 1024 * 1024,
  });
}

async function uploadFile(applicationId: string, name: string, payload: Buffer, contentType: string): Promise<string> {
  await ensureBucket();
  const supabase = createSupabaseAdminClient();
  const path = `${applicationId}/${Date.now()}-${name}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, payload, {
      contentType,
      upsert: true,
    });
  if (error || !data?.path) {
    throw new Error(`Lender export upload failed: ${error?.message || 'unknown error'}`);
  }
  return `supabase://${BUCKET}/${data.path}`;
}

export async function generateParkPlaceLenderExports(
  applicationId: string,
  app: InvestorApplication,
): Promise<LenderExportArtifact> {
  const includeReo = hasExperience(app);
  const checklist = buildParkPlaceChecklist(app.documents || [], includeReo);

  const budgetWorkbook = await buildConstructionBudgetWorkbook(app);
  const budgetRef = await uploadFile(
    applicationId,
    'park-place-construction-budget-single-asset.xlsx',
    budgetWorkbook,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );

  const files: Array<{ name: string; storageRef: string }> = [
    { name: 'park-place-construction-budget-single-asset.xlsx', storageRef: budgetRef },
  ];

  if (includeReo) {
    const reoWorkbook = await buildReoWorkbook(app);
    const reoRef = await uploadFile(
      applicationId,
      'park-place-ppf-reo.xlsx',
      reoWorkbook,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    files.push({ name: 'park-place-ppf-reo.xlsx', storageRef: reoRef });
  }

  const checklistRef = await uploadFile(
    applicationId,
    'park-place-required-documents.csv',
    Buffer.from(checklistCsv(checklist), 'utf8'),
    'text/csv; charset=utf-8',
  );
  files.push({ name: 'park-place-required-documents.csv', storageRef: checklistRef });

  const prop = app.properties?.find(p => p.isMain) || app.properties?.[0];
  const fallbackAddr = splitAddressParts(app.loanRequest.purchaseSubjectAddress);
  const preview: LenderExportArtifact['preview'] = {
    project: {
      borrowerName: `${app.borrower.firstName} ${app.borrower.lastName}`.trim(),
      propertyAddress: prop?.address || fallbackAddr.address || app.loanRequest.purchaseSubjectAddress || '',
      propertyCity: prop?.city || fallbackAddr.city || '',
      propertyState: prop?.state || fallbackAddr.state || '',
      propertyZip: prop?.zip || fallbackAddr.zip || '',
      gcName: app.constructionGoal?.builderName || '',
      gcLicense: app.constructionGoal?.builderLicense || '',
      permitStatus: app.constructionGoal?.permitStatus || '',
      plansStatus: app.constructionGoal?.plansStatus || '',
    },
    budget: {
      requestedLoanAmount: toNum(app.loanRequest.requestedLoanAmount),
      constructionBudget: toNum(app.loanRequest.constructionBudget),
      constructionAmountFinanced: toNum(app.loanRequest.constructionAmountFinanced),
      completedValue: toNum(app.loanRequest.completedValue),
      timeline: app.constructionGoal?.constructionTimeline || app.loanRequest.fundingTimeline || '',
    },
    ...(includeReo
      ? {
          reo: {
            completedFlips: app.experience.completedFlips,
            flipsLast3Years: toNum(app.experience.flipsLast3Years),
            completedNewBuilds: app.experience.completedNewBuilds,
            newBuildsLast3Years: toNum(app.experience.newBuildsLast3Years),
            ownsRentals: app.experience.ownsRentals,
            rentalsOwned: toNum(app.experience.rentalsOwned),
          },
        }
      : {}),
  };

  return {
    lender: 'park_place',
    generatedAt: new Date().toISOString(),
    includeReo,
    files,
    preview,
    checklist,
  };
}

