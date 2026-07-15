// TODO: Replace with actual Shape CRM field IDs from your Shape account settings.
// Shape API docs: https://developer.setshape.com/

export const SHAPE_FIELD_MAP = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  loanProgram: 'loan_type',
  loanAmount: 'loan_amount',
  source: 'lead_source',
  status: 'lead_status',
};

export const SHAPE_STATUS_MAP: Record<string, string> = {
  blanket_portfolio: 'Blanket Portfolio Loan Submitted',
  bridge: 'Bridge Loan Submitted',
  construction: 'Construction Loan Submitted',
  dscr: 'DSCR Loan Submitted',
  rehab: 'Rehab Loan Submitted',
  commercial_re: 'Commercial RE Loan Submitted',
};
