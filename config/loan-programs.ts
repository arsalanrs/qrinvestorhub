export type ProgramKey = 'blanket_portfolio' | 'bridge' | 'construction' | 'dscr' | 'rehab';

export interface ProgramConfig {
  key: ProgramKey;
  label: string;
  shortLabel: string;
  description: string;
  maxMarketLTV?: number;
  maxAcquisitionLTV?: number;
  maxLTC?: number;
  maxARV?: number;
  maxPortfolioLTV?: number;
  minDSCR?: number;
  maxLoanAmount?: number;
  requiredFields: string[];
  steps: string[];
}

export const PROGRAM_CONFIGS: Record<ProgramKey, ProgramConfig> = {
  blanket_portfolio: {
    key: 'blanket_portfolio',
    label: 'Blanket / Portfolio Loan',
    shortLabel: 'Portfolio',
    description: 'Finance multiple investment properties under one loan. Ideal for rental portfolios.',
    maxPortfolioLTV: 75,
    requiredFields: ['properties (min 2)', 'portfolio value', 'rent roll or property schedule'],
    steps: ['Purpose', 'Borrower', 'Entity', 'Experience', 'Liquidity', 'Structure', 'Portfolio', 'Documents', 'Notes', 'Review'],
  },
  bridge: {
    key: 'bridge',
    label: 'Bridge Loan',
    shortLabel: 'Bridge',
    description: 'Short-term financing to purchase, refinance, or stabilize a property quickly.',
    maxMarketLTV: 70,
    maxLTC: 70,
    requiredFields: ['exit strategy', 'funding timeline'],
    steps: ['Purpose', 'Borrower', 'Entity', 'Experience', 'Property', 'Structure', 'Exit Strategy', 'Documents', 'Review'],
  },
  construction: {
    key: 'construction',
    label: 'Construction / Ground-Up',
    shortLabel: 'Construction',
    description: 'New ground-up construction or major addition financing.',
    maxLTC: 90,
    maxARV: 75,
    requiredFields: ['ARV', 'construction budget', 'builder info', 'timeline'],
    steps: ['Purpose', 'Borrower', 'Entity', 'Experience', 'Land / Property', 'Construction Budget', 'Builder & Permits', 'Documents', 'Review'],
  },
  dscr: {
    key: 'dscr',
    label: 'DSCR Rental Loan',
    shortLabel: 'DSCR',
    description: 'Qualify on rental income, not personal income. No tax returns required.',
    maxMarketLTV: 80,
    minDSCR: 1.0,
    requiredFields: ['market rent', 'taxes', 'insurance', 'property type'],
    steps: ['Purpose', 'Borrower', 'Entity', 'Experience', 'Property', 'Rental Income', 'Loan Structure', 'Documents', 'Review'],
  },
  rehab: {
    key: 'rehab',
    label: 'Rehab / Fix & Flip / Fix & Hold',
    shortLabel: 'Rehab',
    description: 'Purchase plus rehab financing. Exit via sale or refinance into a rental loan.',
    maxLTC: 90,
    maxARV: 75,
    requiredFields: ['ARV', 'rehab budget', 'exit strategy'],
    steps: ['Purpose', 'Borrower', 'Entity', 'Experience', 'Property', 'Rehab Budget', 'Exit Strategy', 'Documents', 'Review'],
  },
};

export const PROGRAM_LIST = Object.values(PROGRAM_CONFIGS);
