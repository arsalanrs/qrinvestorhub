export type ParkPlaceRequiredDoc = {
  key: string;
  label: string;
  requiredByDefault: boolean;
  matchTerms: string[];
};

export const PARK_PLACE_REQUIRED_DOCS: ParkPlaceRequiredDoc[] = [
  { key: 'driver_license', label: 'Driver License', requiredByDefault: true, matchTerms: ['driver license', 'government-issued id', 'id'] },
  { key: 'june_bank_statements', label: 'June Bank Statements', requiredByDefault: true, matchTerms: ['bank statement'] },
  { key: 'articles_operations_llc', label: 'Articles of Operations (LLC)', requiredByDefault: true, matchTerms: ['articles', 'entity documents'] },
  { key: 'ein_form', label: 'EIN Form', requiredByDefault: true, matchTerms: ['ein'] },
  { key: 'operating_agreement_llc', label: 'Operating Agreement (LLC)', requiredByDefault: true, matchTerms: ['operating agreement', 'entity documents'] },
  { key: 'insurance_agent_contact', label: 'Insurance Agent Contact Information', requiredByDefault: true, matchTerms: ['insurance agent'] },
  { key: 'title_company_info', label: 'Title Company Information', requiredByDefault: true, matchTerms: ['title company', 'title'] },
  { key: 'primary_residence_mortgage_statement', label: 'Primary Residence Mortgage Statement/Lease/Deed', requiredByDefault: true, matchTerms: ['mortgage statement', 'lease', 'deed'] },
  { key: 'voided_check', label: 'Voided Check (To Match ACH Form via Docusign)', requiredByDefault: true, matchTerms: ['voided check', 'ach'] },
  { key: 'executed_purchase_contract', label: 'Executed Purchase Contract', requiredByDefault: true, matchTerms: ['purchase contract', 'contract'] },
  { key: 'ppf_reo', label: 'PPF REO (Experience Form)', requiredByDefault: true, matchTerms: ['reo'] },
  { key: 'ppf_budget', label: 'PPF Budget', requiredByDefault: true, matchTerms: ['budget', 'draw schedule'] },
  { key: 'gc_license', label: 'GC License', requiredByDefault: true, matchTerms: ['gc license', 'builder', 'license'] },
  { key: 'gc_contract', label: 'GC Contract', requiredByDefault: true, matchTerms: ['gc contract', 'contractor contract'] },
  { key: 'gc_liability_insurance', label: 'GC Liability Insurance', requiredByDefault: true, matchTerms: ['liability insurance', 'insurance'] },
  { key: 'gc_id', label: 'GC ID', requiredByDefault: true, matchTerms: ['gc id', 'id'] },
  { key: 'gc_coo', label: 'GC Certificate of Occupancy', requiredByDefault: true, matchTerms: ['certificate of occupancy', 'coo'] },
  { key: 'plans_and_permits', label: 'Plans and Permits', requiredByDefault: true, matchTerms: ['plans', 'permits', 'architectural plans'] },
];

