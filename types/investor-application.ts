import type { CommercialReInfo } from '@/types/commercial-re';

export type { CommercialReInfo };

export type LoanProgram =
  | 'blanket_portfolio'
  | 'bridge'
  | 'construction'
  | 'dscr'
  | 'rehab'
  | 'commercial_re';

export type DealStage =
  | 'general_info'
  | 'actively_looking'
  | 'identified_property'
  | 'under_contract'
  | 'own_property'
  | 'loan_maturity_balloon';

export type TransactionType =
  | 'purchase'
  | 'refinance'
  | 'cash_out_refi'
  | 'rate_term_refi'
  | 'delayed_purchase'
  | 'line_of_credit'
  | 'maturing_balloon_refi'
  | 'construction_to_permanent';

export type PropertyType =
  | 'single_family'
  | 'two_to_four_unit'
  | 'multifamily_5plus'
  | 'condo'
  | 'townhome'
  | 'mixed_use'
  | 'commercial'
  | 'land'
  | 'other';

export type OccupancyStatus = 'vacant' | 'tenant_occupied' | 'owner_occupied' | 'partially_occupied';
export type LeaseStatus = 'leased' | 'month_to_month' | 'vacant' | 'short_term_rental' | 'market_rent_only';

export interface BorrowerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  creditRange: '620-659' | '660-699' | '700-739' | '740+' | 'not_sure' | '';
  hasCoBorrower: boolean;
  coBorrowerName: string;
  coBorrowerEmail: string;
  coBorrowerPhone: string;
  coBorrowerCreditRange: '620-659' | '660-699' | '700-739' | '740+' | 'not_sure' | '';
}

export interface EntityInfo {
  borrowingAs: 'entity' | 'individual';
  entityName: string;
  entityType: 'LLC' | 'Corporation' | 'Trust' | 'Partnership' | 'Individual' | 'Other' | '';
  stateOfFormation: string;
  authorizedSigner: string;
  ownershipPercentage: string;
  ein: string;
  additionalGuarantors: Array<{ name: string; email: string; phone: string }>;
}

export interface ExperienceInfo {
  completedFlips: boolean;
  flipsLast3Years: string;
  ownsRentals: boolean;
  rentalsOwned: string;
  completedNewBuilds: boolean;
  newBuildsLast3Years: string;
  isBuilderDeveloper: boolean;
  adverseHistory: boolean;
  adverseHistoryDetails: string;
}

export interface LiquidityAsset {
  type: 'checking_savings' | 'retirement' | 'stocks_brokerage' | 'other';
  label: string;
  estimatedBalance: string;
}

export interface PropertyData {
  id: string;
  isMain: boolean;
  address: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType | '';
  numUnits: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  currentAsIsValue: string;
  estimatedMarketRent: string;
  occupancyStatus: OccupancyStatus | '';
  annualHazardInsurance: string;
  annualFloodInsurance: string;
  annualPropertyTax: string;
  annualHOA: string;
  currentMortgageBalance: string;
  currentLender: string;
  monthlyPayment: string;
  leaseStatus: LeaseStatus | '';
}

export interface LoanRequest {
  transactionType: TransactionType | '';
  subjectPropertyId: string;
  purchaseSubjectAddress: string;
  requestedLoanAmount: string;
  purchasePrice: string;
  desiredCashOut: string;
  rehabBudget: string;
  rehabAmountFinanced: string;
  arv: string;
  constructionBudget: string;
  constructionAmountFinanced: string;
  completedValue: string;
  fundingTimeline: string;
  closingDate: string;
  exitStrategy: string;
  backupExitStrategy: string;
  prepayStructure: '5yr' | '3yr' | '1yr' | 'none' | '';
  interestOnly: boolean;
}

export interface BlanketGoal {
  portfolioAction: string;
  numProperties: string;
  anyUnderContract: boolean;
  desiredCashOut: string;
  closingTimeline: string;
}

export interface BridgeGoal {
  bridgePurpose: string;
  fundingTimeline: string;
  underContract: boolean;
  closingDate: string;
}

export interface ConstructionGoal {
  landStatus: string;
  fundingTimeline: string;
  isGroundUp: boolean;
  isMidConstruction: boolean;
  addingSqft: boolean;
  additionalSqft: string;
  exitStrategy: string;
  builderName: string;
  builderPhone: string;
  builderLicense: string;
  permitStatus: string;
  plansStatus: string;
  drawScheduleAvailable: boolean;
  scopeAvailable: boolean;
  constructionTimeline: string;
}

export interface DSCRGoal {
  action: string;
  currentlyRented: boolean;
  signedLease: boolean;
  isSTR: boolean;
  closingTimeline: string;
}

export interface RehabGoal {
  exitStrategy: 'fix_flip' | 'fix_hold' | '';
  underContract: boolean;
  closingDate: string;
  fundingTimeline: string;
  isMidConstruction: boolean;
  addingSqft: boolean;
  additionalSqft: string;
  scopeAvailable: boolean;
  contractorSelected: boolean;
  rehabTimeline: string;
}

export interface DocumentItem {
  id: string;
  label: string;
  type: string;
  required: boolean;
  status: 'missing' | 'uploaded' | 'requested' | 'reviewed';
  fileName?: string;
  fileUrl?: string;
}

export interface Consents {
  accuracyConfirmed: boolean;
  investmentPurpose: boolean;
  noOwnerOccupancy: boolean;
  contactConsent: boolean;
  electronicComms: boolean;
  creditPullConsent: boolean;
}

export interface InvestorApplication {
  id?: string;
  loanProgram: LoanProgram | '';
  dealStage: DealStage | '';
  borrower: BorrowerInfo;
  entity: EntityInfo;
  experience: ExperienceInfo;
  liquidity: LiquidityAsset[];
  properties: PropertyData[];
  loanRequest: LoanRequest;
  blanketGoal?: BlanketGoal;
  bridgeGoal?: BridgeGoal;
  constructionGoal?: ConstructionGoal;
  dscrGoal?: DSCRGoal;
  rehabGoal?: RehabGoal;
  commercialRe?: CommercialReInfo;
  documents: DocumentItem[];
  additionalNotes: string;
  consents: Consents;
  status?: 'draft' | 'submitted' | 'needs_review';
}
