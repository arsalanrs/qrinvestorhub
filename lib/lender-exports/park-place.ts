import 'server-only';
import ExcelJS from 'exceljs';
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

async function buildReoWorkbook(app: InvestorApplication): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Real Estate Owned');
  const ref = wb.addWorksheet('Sheet2');
  const prop = app.properties?.find(p => p.isMain) || app.properties?.[0];

  sheet.getCell('B1').value = 'PARK PLACE FINANCE - REO EXPERIENCE';
  sheet.getCell('B2').value = 'New Construction/Renovation Projects';
  sheet.addRow([
    null,
    'Address',
    'Unit',
    'City',
    'State',
    'Zip',
    'Final Property Type',
    'Vested As Name',
    'Percent Ownership',
    'Purchase Price',
    'Purchase Date',
    'Construction Budget',
    'Type of Construction',
    'Cert of Occupancy Date',
    'Disposition Date',
    'Disposition Price',
  ]);

  const row = sheet.getRow(4);
  row.getCell(2).value = prop?.address || app.loanRequest.purchaseSubjectAddress || '';
  row.getCell(3).value = prop?.unit || '';
  row.getCell(4).value = prop?.city || '';
  row.getCell(5).value = prop?.state || '';
  row.getCell(6).value = prop?.zip || '';
  row.getCell(7).value = prop?.propertyType || 'single_family';
  row.getCell(8).value = app.entity.entityName || `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  row.getCell(9).value = app.entity.ownershipPercentage ? Number(app.entity.ownershipPercentage) / 100 : 1;
  row.getCell(10).value = toNum(app.loanRequest.purchasePrice);
  row.getCell(11).value = toDate(app.loanRequest.closingDate);
  row.getCell(12).value = toNum(app.loanRequest.constructionBudget);
  row.getCell(13).value = app.constructionGoal?.isGroundUp ? 'Ground-Up Construction' : 'Heavy Renovation';
  row.getCell(14).value = null;
  row.getCell(15).value = null;
  row.getCell(16).value = toNum(app.loanRequest.completedValue);

  const refRows = [
    ['SFR', 'Light Renovation', 'Long Term Rental (3+ Months)', 'Yes'],
    ['Condo/Townhouse', 'Heavy Renovation', 'Short Term Rental (<1 Month)', 'No'],
    ['2-4 Unit', 'Ground-Up Construction', null, null],
    ['5+ Unit', null, null, null],
    ['Manufactured', null, null, null],
    ['Mixed-Use', null, null, null],
  ];
  refRows.forEach(r => ref.addRow(r));

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

async function buildConstructionBudgetWorkbook(app: InvestorApplication): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const step1 = wb.addWorksheet('Step 1. Project Details');
  const step2 = wb.addWorksheet('Step 2. Construction Budget');
  const step3 = wb.addWorksheet('Step 3. Construction Schedule');
  const hidden = wb.addWorksheet('Hidden');
  const prop = app.properties?.find(p => p.isMain) || app.properties?.[0];

  step1.getCell('B1').value = 'PROJECT DETAILS';
  step1.getCell('B6').value = 'Instructions';
  const details: Array<[string, unknown]> = [
    ['Borrower Name', `${app.borrower.firstName} ${app.borrower.lastName}`.trim()],
    ['Entity Name', app.entity.entityName || ''],
    ['Subject Address', [prop?.address, prop?.city, prop?.state, prop?.zip].filter(Boolean).join(', ')],
    ['Transaction Type', app.loanRequest.transactionType || 'construction'],
    ['Loan Amount Request', toNum(app.loanRequest.requestedLoanAmount)],
    ['Purchase Price', toNum(app.loanRequest.purchasePrice)],
    ['Construction Budget', toNum(app.loanRequest.constructionBudget)],
    ['Completed Value (ARV)', toNum(app.loanRequest.completedValue)],
    ['Builder Name', app.constructionGoal?.builderName || ''],
    ['Builder License', app.constructionGoal?.builderLicense || ''],
    ['Permit Status', app.constructionGoal?.permitStatus || ''],
    ['Plans Status', app.constructionGoal?.plansStatus || ''],
  ];
  details.forEach(([label, value], idx) => {
    const row = 8 + idx;
    step1.getCell(`B${row}`).value = label;
    step1.getCell(`D${row}`).value = value as string | number;
  });

  step2.getCell('B1').value = 'CONSTRUCTION BUDGET';
  step2.getCell('B5').value = 'Borrower Name: ';
  step2.getCell('D5').value = `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  step2.getCell('B6').value = 'Subject Address: ';
  step2.getCell('D6').value = [prop?.address, prop?.city, prop?.state, prop?.zip].filter(Boolean).join(', ');
  step2.getCell('B8').value = 'Category';
  step2.getCell('C8').value = 'Description';
  step2.getCell('D8').value = 'Amount';

  const totalBudget = toNum(app.loanRequest.constructionBudget);
  const financed = toNum(app.loanRequest.constructionAmountFinanced);
  const budgetRows: Array<[string, string, number | string]> = [
    ['Summary', 'Total Construction Budget', totalBudget],
    ['Summary', 'Construction Amount Financed', financed],
    ['Summary', 'Borrower Cash Contribution', Math.max(totalBudget - financed, 0)],
    ['Site Work', '', ''],
    ['Foundation', '', ''],
    ['Framing', '', ''],
    ['Roofing', '', ''],
    ['MEP', 'Mechanical / Electrical / Plumbing', ''],
    ['Interior Finishes', '', ''],
    ['Contingency', '', ''],
  ];
  budgetRows.forEach(([cat, desc, amount], idx) => {
    const row = 9 + idx;
    step2.getCell(`B${row}`).value = cat;
    step2.getCell(`C${row}`).value = desc;
    step2.getCell(`D${row}`).value = amount as string | number;
  });

  step3.getCell('B1').value = 'PROJECT DETAILS';
  step3.getCell('B6').value = 'Instructions';
  step3.getCell('B8').value = 'Milestone';
  step3.getCell('C8').value = 'Target Duration';
  const schedule = [
    ['Permits & Pre-Construction', app.constructionGoal?.permitStatus || 'TBD'],
    ['Foundation', '1-2 Months'],
    ['Framing', '1-2 Months'],
    ['Rough Inspections', '1 Month'],
    ['Finish Work / Final Inspection', app.constructionGoal?.constructionTimeline || 'TBD'],
  ];
  schedule.forEach(([milestone, duration], idx) => {
    const row = 9 + idx;
    step3.getCell(`B${row}`).value = milestone;
    step3.getCell(`C${row}`).value = duration;
  });

  const hiddenRows = [
    ['Select one from dropdown', 'Select one from dropdown', 'Select one from dropdown', 'Select one from dropdown', 'Select one from dropdown', '1 Month'],
    ['Builder Grade (ex. Entry level and hardware store)', 'Not Needed', '1 Month', 'Already Complete', 'Vertical (no foundation expansion)', '2 Months'],
    ['Quality Grade (ex. Mid-level name brand or some custom)', 'Yes', '2 Months', '1 Month', 'Horizontal (foundation expansion)', '3 Months'],
    ['High-End Custom (ex. Custom finishing and designer appliances)', 'No', '3 Months', '2 Months', 'Both (foundation expansion)', '4 Months'],
  ];
  hiddenRows.forEach(r => hidden.addRow(r));

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

  return {
    lender: 'park_place',
    generatedAt: new Date().toISOString(),
    includeReo,
    files,
    checklist,
  };
}

