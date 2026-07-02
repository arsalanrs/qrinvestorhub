import type { InvestorApplication } from '@/types/investor-application';

export function mapApplicationToLendingPad(app: InvestorApplication): Record<string, unknown> {
  // TODO: Map to LendingPad loan creation payload
  // Docs: https://api.lendingpad.com/docs
  return {
    borrower: {
      first_name: app.borrower.firstName,
      last_name: app.borrower.lastName,
      email: app.borrower.email,
      phone: app.borrower.phone,
    },
    loan: {
      loan_type: app.loanProgram,
      loan_amount: app.loanRequest.requestedLoanAmount,
      purchase_price: app.loanRequest.purchasePrice,
    },
    property: app.properties[0]
      ? {
          address: app.properties[0].address,
          city: app.properties[0].city,
          state: app.properties[0].state,
          zip: app.properties[0].zip,
          property_type: app.properties[0].propertyType,
        }
      : undefined,
    // TODO: Add full field mapping once LP field IDs are confirmed
  };
}
