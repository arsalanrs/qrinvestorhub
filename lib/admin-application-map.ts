import 'server-only';
import type { PropertyData } from '@/types/investor-application';

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
  return {
    id: String(row.id),
    loanProgram: row.loan_program as string | null,
    dealStage: row.deal_stage as string | null,
    borrower: row.borrower,
    entity: row.entity,
    experience: row.experience,
    liquidity: row.liquidity || [],
    properties: [],
    loanRequest: row.loan_request,
    documents: [],
    additionalNotes: (row.additional_notes as string) || '',
    consents: row.consents,
  };
}
