export type CommercialPropertyType =
  | 'multifamily_5plus'
  | 'office'
  | 'retail'
  | 'industrial_warehouse'
  | 'mixed_use'
  | 'self_storage'
  | 'mobile_home_park'
  | 'hotel_hospitality'
  | 'restaurant'
  | 'healthcare_assisted_living'
  | 'daycare'
  | 'automotive'
  | 'church_religious'
  | 'land_development'
  | 'special_purpose'
  | 'other'
  | '';

export type CommercialPropertyUse =
  | 'owner_occupied'
  | 'leased_tenants'
  | 'partial_owner_lease'
  | 'vacant'
  | 'under_construction'
  | '';

export interface CommercialReInfo {
  commercialPropertyType: CommercialPropertyType;
  commercialPropertyTypeOther: string;
  propertyUse: CommercialPropertyUse;

  yearBuilt: string;
  totalSqft: string;
  lotSizeAcres: string;
  numBuildings: string;
  numUnitsOrSpaces: string;
  occupancyPct: string;
  isOperating: boolean | null;
  isStabilized: boolean | null;

  propertyIncome: {
    monthlyRentalIncome: string;
    annualGrossIncome: string;
    annualOperatingExpenses: string;
    annualNOI: string;
    occupiedUnits: string;
    vacantUnits: string;
    rentsAtMarket: boolean | null;
    tenantsDelinquent: boolean | null;
    majorLeasesExpiring12mo: boolean | null;
  };

  leaseInfo: {
    hasRentRoll: boolean | null;
    writtenLeasesInPlace: boolean | null;
    avgRemainingLeaseTerm: string;
    largestTenantName: string;
    largestTenantIncomePct: string;
    tenantRelatedToBorrower: boolean | null;
  };

  propertyDocumentsAvailable: string[];

  operatingBusiness: {
    legalName: string;
    businessType: string;
    businessAddress: string;
    yearsInBusiness: string;
    occupancyPct: string;
    numEmployees: string;
    annualRevenue: string;
    annualNetIncome: string;
    isProfitable: boolean | null;
    revenueTrend: 'increased' | 'decreased' | 'stable' | '';
    paysRentCurrently: boolean | null;
    currentMonthlyRent: string;
    continueDuringMoveOrReno: boolean | null;
  };

  businessOwnership: {
    ownershipPct: string;
    owners20Plus: string;
    allOwnersGuarantee: boolean | null;
    ownersUnwillingGuarantee: boolean | null;
  };

  businessDocumentsAvailable: string[];

  purchaseDetails: {
    totalDownPayment: string;
    earnestMoneyDeposited: string;
    contractExpiration: string;
    dueDiligenceExpiration: string;
    sellerFinancing: boolean | null;
    armLengthTransaction: boolean | null;
    purchasingRealEstateOnly: boolean | null;
    renovationsRequiredAfterClosing: boolean | null;
    renovationBudget: string;
    downPaymentSource: string;
    downPaymentSourceOther: string;
  };

  existingLoan: {
    currentLender: string;
    currentBalance: string;
    currentRate: string;
    currentMonthlyPayment: string;
    originalLoanAmount: string;
    maturityDate: string;
    balloonDueDate: string;
    prepaymentPenalty: boolean | null;
    everLate: boolean | null;
    currentlyInDefault: boolean | null;
    lenderRequiringRefi: boolean | null;
  };

  cashOut: {
    requestedAmount: string;
    purpose: string;
    purposeOther: string;
  };

  financialProfile: {
    personalNetWorth: string;
    businessLiquidity: string;
    fundsForClosing: string;
    liquidityAfterClosing: string;
    otherCreOwned: boolean | null;
    businessLoansOutstanding: boolean | null;
    sbaLoansOutstanding: boolean | null;
    taxLiensOrPaymentPlans: boolean | null;
    adverseHistory: boolean | null;
    adverseHistoryDetails: string;
  };

  commercialExperience: {
    currentlyOwnsCre: boolean | null;
    numPropertiesOwned: string;
    previouslyOwnedThisType: boolean | null;
    yearsOwnershipExperience: string;
    selfManage: boolean | null;
    thirdPartyManager: boolean | null;
    completedRenovationsOrConstruction: boolean | null;
    licensedContractorDeveloperManager: boolean | null;
    priorForeclosureOrTransfer: boolean | null;
  };

  dealStory: string;
}
