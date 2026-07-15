import type { CommercialPropertyType } from '@/types/commercial-re';

export const COMMERCIAL_PROPERTY_TYPES: Array<{ value: CommercialPropertyType; label: string }> = [
  { value: 'multifamily_5plus', label: 'Multifamily — 5+ units' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial_warehouse', label: 'Industrial / Warehouse' },
  { value: 'mixed_use', label: 'Mixed-Use' },
  { value: 'self_storage', label: 'Self-Storage' },
  { value: 'mobile_home_park', label: 'Mobile Home Park' },
  { value: 'hotel_hospitality', label: 'Hotel / Hospitality' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'healthcare_assisted_living', label: 'Healthcare / Assisted Living' },
  { value: 'daycare', label: 'Daycare' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'church_religious', label: 'Church / Religious Facility' },
  { value: 'land_development', label: 'Land / Development' },
  { value: 'special_purpose', label: 'Special-Purpose Property' },
  { value: 'other', label: 'Other' },
];

export const COMMERCIAL_PROPERTY_USES = [
  { value: 'owner_occupied', label: 'My business will occupy the property', description: 'Evaluated primarily from operating business income.' },
  { value: 'leased_tenants', label: 'The property is leased to tenants', description: 'Evaluated primarily from rental income (NOI).' },
  { value: 'partial_owner_lease', label: 'Partially owner-occupied and partially leased', description: 'Evaluated from both business and rental income.' },
  { value: 'vacant', label: 'Property is currently vacant', description: '' },
  { value: 'under_construction', label: 'Property is under construction or being renovated', description: '' },
] as const;

export const COMMERCIAL_TRANSACTION_TYPES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'rate_term_refi', label: 'Rate-and-Term Refinance' },
  { value: 'cash_out_refi', label: 'Cash-Out Refinance' },
  { value: 'maturing_balloon_refi', label: 'Maturing Balloon Refinance' },
  { value: 'construction_to_permanent', label: 'Construction-to-Permanent' },
] as const;

export const CASH_OUT_PURPOSES = [
  { value: 'property_improvements', label: 'Property improvements' },
  { value: 'business_expansion', label: 'Business expansion' },
  { value: 'purchase_another_property', label: 'Purchase another property' },
  { value: 'pay_business_debt', label: 'Pay off business debt' },
  { value: 'pay_personal_debt', label: 'Pay off personal debt' },
  { value: 'working_capital', label: 'Working capital' },
  { value: 'partner_buyout', label: 'Partner buyout' },
  { value: 'tax_obligation', label: 'Tax obligation' },
  { value: 'other', label: 'Other' },
];

export const DOWN_PAYMENT_SOURCES = [
  { value: 'personal_funds', label: 'Personal funds' },
  { value: 'business_funds', label: 'Business funds' },
  { value: 'sale_of_property', label: 'Sale of another property' },
  { value: 'partner_investor', label: 'Partner or investor contribution' },
  { value: 'gift', label: 'Gift' },
  { value: 'seller_financing', label: 'Seller financing' },
  { value: 'other_borrowed', label: 'Other borrowed funds' },
  { value: 'other', label: 'Other' },
];

export const PROPERTY_DOCUMENT_OPTIONS = [
  { value: 'rent_roll', label: 'Current rent roll' },
  { value: 't12_operating', label: 'Trailing 12-month operating statement' },
  { value: 'ytd_pl', label: 'Year-to-date profit and loss statement' },
  { value: 'prior_two_years', label: 'Prior two years of property financials' },
  { value: 'leases', label: 'Copies of leases' },
  { value: 'tax_bill', label: 'Property tax bill' },
  { value: 'insurance_dec', label: 'Insurance declaration page' },
  { value: 'mortgage_statement', label: 'Existing mortgage statement' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'environmental', label: 'Environmental report' },
  { value: 'none_yet', label: 'None available yet' },
];

export const BUSINESS_DOCUMENT_OPTIONS = [
  { value: 'tax_returns_2yr', label: 'Two years of business tax returns' },
  { value: 'ytd_pl', label: 'Year-to-date profit and loss statement' },
  { value: 'balance_sheet', label: 'Current balance sheet' },
  { value: 'debt_schedule', label: 'Business debt schedule' },
  { value: 'bank_statements', label: 'Business bank statements' },
  { value: 'existing_lease', label: 'Existing lease' },
  { value: 'purchase_contract', label: 'Purchase contract' },
  { value: 'none_yet', label: 'None available yet' },
];
