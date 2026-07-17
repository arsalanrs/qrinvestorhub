import 'server-only';
import type { DocumentItem, InvestorApplication, PropertyData } from '@/types/investor-application';

type PropertyRow = {
  is_main?: boolean | null;
  property_data?: PropertyData | null;
};

export function primaryPropertyLocation(properties?: PropertyRow[] | null): {
  city: string;
  state: string;
} {
  const rows = properties || [];
  const main = rows.find(p => p.is_main) || rows[0];
  const data = main?.property_data;
  return {
    city: String(data?.city || '').trim(),
    state: String(data?.state || '').trim(),
  };
}

export function applicationToInvestorShapeApp(row: Record<string, unknown>) {
  const propertyRows = Array.isArray(row.properties) ? row.properties : [];
  const documentRows = Array.isArray(row.documents) ? row.documents : [];

  const properties: PropertyData[] = propertyRows
    .map((item, idx) => {
      const maybeRow = item as {
        id?: string;
        is_main?: boolean;
        property_data?: Partial<PropertyData> | null;
      };
      const data = maybeRow.property_data;
      if (!data || typeof data !== 'object') return null;
      return {
        id: String(data.id || maybeRow.id || `prop-${idx + 1}`),
        isMain: Boolean(data.isMain ?? maybeRow.is_main ?? idx === 0),
        address: String(data.address || ''),
        unit: String(data.unit || ''),
        city: String(data.city || ''),
        state: String(data.state || ''),
        zip: String(data.zip || ''),
        propertyType: (data.propertyType || '') as PropertyData['propertyType'],
        numUnits: String(data.numUnits || ''),
        bedrooms: String(data.bedrooms || ''),
        bathrooms: String(data.bathrooms || ''),
        sqft: String(data.sqft || ''),
        currentAsIsValue: String(data.currentAsIsValue || ''),
        estimatedMarketRent: String(data.estimatedMarketRent || ''),
        occupancyStatus: (data.occupancyStatus || '') as PropertyData['occupancyStatus'],
        annualHazardInsurance: String(data.annualHazardInsurance || ''),
        annualFloodInsurance: String(data.annualFloodInsurance || ''),
        annualPropertyTax: String(data.annualPropertyTax || ''),
        annualHOA: String(data.annualHOA || ''),
        currentMortgageBalance: String(data.currentMortgageBalance || ''),
        currentLender: String(data.currentLender || ''),
        monthlyPayment: String(data.monthlyPayment || ''),
        leaseStatus: (data.leaseStatus || '') as PropertyData['leaseStatus'],
      } satisfies PropertyData;
    })
    .filter((item): item is PropertyData => item != null);

  const documents: DocumentItem[] = documentRows.map((item, idx) => {
    const doc = item as {
      id?: string;
      label?: string;
      document_type?: string | null;
      file_name?: string | null;
      file_url?: string | null;
      required?: boolean | null;
      status?: string | null;
    };
    const statusRaw = String(doc.status || '').toLowerCase();
    const status: DocumentItem['status'] =
      statusRaw === 'uploaded' || statusRaw === 'requested' || statusRaw === 'reviewed' || statusRaw === 'missing'
        ? statusRaw
        : 'missing';
    const label = String(doc.label || doc.document_type || doc.file_name || `document-${idx + 1}`);
    return {
      id: String(doc.id || `doc-${idx + 1}`),
      label,
      type: String(doc.document_type || label),
      required: Boolean(doc.required),
      status,
      fileName: doc.file_name || undefined,
      fileUrl: doc.file_url || undefined,
    };
  });

  return {
    id: String(row.id),
    loanProgram: row.loan_program as string | null,
    dealStage: row.deal_stage as string | null,
    borrower: row.borrower,
    entity: row.entity,
    experience: row.experience,
    liquidity: row.liquidity || [],
    properties,
    loanRequest: row.loan_request,
    constructionGoal: (row.construction_goal || undefined) as InvestorApplication['constructionGoal'] | undefined,
    documents,
    additionalNotes: (row.additional_notes as string) || '',
    consents: row.consents,
    loanOfficer: row.assigned_lo
      ? {
          workingWithLo: true,
          depursLo: (row.assigned_lo as { depursLo?: number }).depursLo ?? null,
          name: (row.assigned_lo as { name?: string }).name ?? '',
        }
      : undefined,
  };
}
