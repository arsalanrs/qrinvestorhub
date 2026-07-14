import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import {
  postShapeLeadDirect,
  updateShapeLeadFields,
  upsertShapeLead,
  type ShapeLeadPayload,
} from '@/integrations/shape/client';
import { getInvestorHubPostLeadUrl } from '@/integrations/shape/config';
import { SHAPE_STATUS_MAP } from '@/integrations/shape/field-map';
import { getShapeLoName } from '@/integrations/shape/lo-roster';
import { buildShapeSubmissionNote } from '@/lib/shape-submission-note';

const SHAPE_OPS_DELETE_STATUS =
  process.env.SHAPE_OPS_DELETE_STATUS?.trim() || 'Do Not Contact';

export function buildShapePayloadFromApplication(
  app: InvestorApplication,
  applicationId: string,
  aiSummary?: string,
): ShapeLeadPayload {
  return {
    firstName: app.borrower.firstName,
    lastName: app.borrower.lastName,
    email: app.borrower.email,
    phone: app.borrower.phone,
    loanProgram: app.loanProgram || '',
    loanAmount: app.loanRequest.requestedLoanAmount,
    status: SHAPE_STATUS_MAP[app.loanProgram || ''] || 'Loan Submitted',
    source: 'Investor Hub',
    note: buildShapeSubmissionNote(app, aiSummary || '', applicationId, {
      shapeAction: 'created',
    }),
  };
}

/** Ops-triggered Shape create (ignores ENABLE_SHAPE_SYNC gate). */
export async function createShapeLeadForApplication(
  app: InvestorApplication,
  applicationId: string,
  aiSummary?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const postUrl = getInvestorHubPostLeadUrl();
  if (!postUrl) {
    return {
      success: false,
      error: 'Set SHAPE_INVESTOR_HUB_POST_LEAD_URL or SHAPE_INVESTOR_HUB_SOURCE_ID',
    };
  }

  const payload = buildShapePayloadFromApplication(app, applicationId, aiSummary);
  const createResult = await postShapeLeadDirect(postUrl, {
    firstname: payload.firstName,
    lastname: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    notes: payload.note || `Investor Hub · ${payload.loanProgram}`,
    mstrstatus1: payload.status,
    leadsource: payload.source || 'Investor Hub',
  });

  if (!createResult.created || !createResult.shape_lead_id) {
    return { success: false, error: createResult.error || 'Shape create failed' };
  }

  return { success: true, id: createResult.shape_lead_id };
}

/** Ops-triggered Shape upsert (search phone/email, update or create). */
export async function syncShapeLeadForApplication(
  app: InvestorApplication,
  applicationId: string,
  aiSummary?: string,
): Promise<Awaited<ReturnType<typeof upsertShapeLead>>> {
  const prev = process.env.ENABLE_SHAPE_SYNC;
  process.env.ENABLE_SHAPE_SYNC = 'true';
  try {
    return await upsertShapeLead(
      buildShapePayloadFromApplication(app, applicationId, aiSummary),
    );
  } finally {
    if (prev === undefined) delete process.env.ENABLE_SHAPE_SYNC;
    else process.env.ENABLE_SHAPE_SYNC = prev;
  }
}

export async function assignShapeLeadOwner(
  shapeLeadId: string,
  depursLo: number,
): Promise<{ success: boolean; error?: string; assignedTo?: string }> {
  const loName = getShapeLoName(depursLo);
  const update = await updateShapeLeadFields(shapeLeadId, {
    depursLo,
    notes_sidebar: `<strong>[Investor Hub Ops]</strong> Assigned to ${loName || `LO #${depursLo}`} · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
  });

  if (!update.synced) {
    return { success: false, error: update.error || 'Shape assign failed' };
  }

  return { success: true, assignedTo: loName || String(depursLo) };
}

/**
 * Shape has no public delete API — mark inactive via status + sidebar note.
 * Clears local linkage when called from ops route.
 */
export async function markShapeLeadRemoved(
  shapeLeadId: string,
): Promise<{ success: boolean; error?: string }> {
  const update = await updateShapeLeadFields(shapeLeadId, {
    mstrstatus1: SHAPE_OPS_DELETE_STATUS,
    notes_sidebar: `<strong>[Investor Hub Ops]</strong> Lead marked removed · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
  });

  if (!update.synced) {
    return { success: false, error: update.error || 'Shape update failed' };
  }

  return { success: true };
}

export { getShapeLoRoster } from '@/integrations/shape/lo-roster';
