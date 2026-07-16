import 'server-only';
import type { InvestorApplication, LoanOfficerSelection } from '@/types/investor-application';
import { getShapeLoName } from '@/integrations/shape/lo-roster';

export function buildAssignedLoRecord(
  loanOfficer?: LoanOfficerSelection,
): Record<string, unknown> | null {
  if (!loanOfficer?.workingWithLo || !loanOfficer.depursLo) return null;
  return {
    depursLo: loanOfficer.depursLo,
    name: loanOfficer.name || getShapeLoName(loanOfficer.depursLo) || '',
    source: 'intake',
  };
}

export function assignedLoDepursLo(app: InvestorApplication): number | undefined {
  if (app.loanOfficer?.workingWithLo && app.loanOfficer.depursLo) {
    return app.loanOfficer.depursLo;
  }
  return undefined;
}
