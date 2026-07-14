import 'server-only';
import {
  getInvestorHubPostLeadUrl,
  getShapeSearchConfig,
  getShapeUpdateUrlCandidates,
  withSystemId,
} from './config';
import { searchShapeLeadByEmail, searchShapeLeadByPhone } from './search-lead';
import { SHAPE_STATUS_MAP } from './field-map';

export interface ShapeLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanProgram: string;
  loanAmount?: string;
  status: string;
  source: string;
  note?: string;
}

export type ShapeUpsertResult = {
  id?: string;
  success: boolean;
  action?: 'created' | 'updated' | 'stub' | 'skipped';
  matchedExisting?: boolean;
  nameMismatch?: string;
  leadSource?: string;
  error?: string;
};

function extractShapeLeadId(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  const candidates = [
    j.lead_id,
    j.leadId,
    j.leadid,
    j.LeadId,
    (j.data as Record<string, unknown> | undefined)?.lead_id,
    (j.data as Record<string, unknown> | undefined)?.leadid,
  ];
  for (const value of candidates) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) return String(numeric);
  }
  const text = JSON.stringify(json);
  const match = text.match(/"lead[_ ]?id"\s*:\s*"?(\d+)"?/i);
  return match?.[1] ?? null;
}

async function postShapeLead(postUrl: string, payload: Record<string, unknown>) {
  const apiKey = process.env.SHAPE_API_KEY || process.env.SHAPE_ACCESS_TOKEN || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (apiKey) headers.Authorization = apiKey;

  const response = await fetch(postUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let shapeResponse: unknown = {};
  try {
    shapeResponse = text ? JSON.parse(text) : {};
  } catch {
    shapeResponse = { raw: text.slice(0, 500) };
  }

  const shapeLeadId = extractShapeLeadId(shapeResponse);
  if (!response.ok) {
    return {
      created: false,
      http_status: response.status,
      shape_response: shapeResponse,
      error: `Shape postlead rejected (${response.status})`,
    };
  }
  if (!shapeLeadId) {
    return {
      created: false,
      http_status: response.status,
      shape_response: shapeResponse,
      error: 'Shape postlead succeeded but no lead ID returned',
    };
  }
  return { created: true, shape_lead_id: shapeLeadId, shape_response: shapeResponse };
}

export async function postShapeLeadDirect(postUrl: string, payload: Record<string, unknown>) {
  return postShapeLead(postUrl, payload);
}

export async function updateShapeLeadFields(shapeLeadId: string, fields: Record<string, unknown>) {
  const { apiKey } = getShapeSearchConfig();
  if (!apiKey) return { synced: false, error: 'Missing SHAPE_API_KEY' };

  const leadid = Number(shapeLeadId);
  if (Number.isNaN(leadid) || leadid <= 0) {
    return { synced: false, error: `Invalid shape_lead_id: ${shapeLeadId}` };
  }

  const payload = withSystemId({ leadid, ...fields });
  const urls = getShapeUpdateUrlCandidates();
  let lastFailure: { synced: false; error: string; http_status?: number } | null = null;

  for (const updateUrl of urls) {
    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (response.ok) {
      return { synced: true, update_url: updateUrl };
    }

    lastFailure = {
      synced: false,
      error: `Shape update rejected (${response.status}): ${text.slice(0, 200)}`,
      http_status: response.status,
    };
    if (response.status !== 404) break;
  }

  return lastFailure ?? { synced: false, error: 'No Shape update URL configured' };
}

function namesLooselyMatch(
  shapeFirst: string,
  shapeLast: string,
  appFirst: string,
  appLast: string,
): boolean {
  const sf = shapeFirst.toLowerCase().trim();
  const sl = shapeLast.toLowerCase().trim();
  const af = appFirst.toLowerCase().trim();
  const al = appLast.toLowerCase().trim();
  if (!sf && !sl) return true;
  return sf === af && sl === al;
}

/**
 * Find existing Shape lead (phone, then email) or create via Investor Hub postlead URL.
 */
export async function upsertShapeLead(payload: ShapeLeadPayload): Promise<ShapeUpsertResult> {
  if (process.env.ENABLE_SHAPE_SYNC !== 'true') {
    console.log('[Shape stub] Would upsert lead:', payload.email);
    return { success: true, id: `stub-${Date.now()}`, action: 'stub' };
  }

  const { apiKey } = getShapeSearchConfig();
  if (!apiKey) {
    return { success: false, action: 'skipped', error: 'Missing SHAPE_API_KEY' };
  }

  let existing = await searchShapeLeadByPhone(payload.phone);
  if (!('found' in existing) || !existing.found) {
    const byEmail = await searchShapeLeadByEmail(payload.email);
    if ('found' in byEmail && byEmail.found) {
      existing = byEmail;
    }
  }

  const noteBlock = payload.note
    ? `<br><br>${payload.note}`
    : '';

  if ('found' in existing && existing.found && existing.leadId) {
    const nameMismatch = namesLooselyMatch(
      existing.firstName,
      existing.lastName,
      payload.firstName,
      payload.lastName,
    )
      ? undefined
      : `Shape has "${existing.firstName} ${existing.lastName}" · form has "${payload.firstName} ${payload.lastName}"`;

    const update = await updateShapeLeadFields(existing.leadId, {
      mstrstatus1: payload.status,
      notes_sidebar: `<strong>[Investor Hub]</strong> ${payload.loanProgram} · ${payload.loanAmount || '—'}${noteBlock}`,
      email: payload.email,
      phone: payload.phone,
    });

    if (!update.synced) {
      return {
        success: false,
        id: existing.leadId,
        action: 'updated',
        matchedExisting: true,
        nameMismatch,
        leadSource: existing.leadSource,
        error: update.error,
      };
    }

    return {
      success: true,
      id: existing.leadId,
      action: 'updated',
      matchedExisting: true,
      nameMismatch,
      leadSource: existing.leadSource,
    };
  }

  const postUrl = getInvestorHubPostLeadUrl();
  if (!postUrl) {
    return {
      success: false,
      action: 'skipped',
      error: 'Set SHAPE_INVESTOR_HUB_POST_LEAD_URL or SHAPE_INVESTOR_HUB_SOURCE_ID to create new leads',
    };
  }

  const createResult = await postShapeLead(postUrl, {
    firstname: payload.firstName,
    lastname: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    notes: payload.note || `Investor Hub · ${payload.loanProgram}`,
    mstrstatus1: payload.status,
    leadsource: payload.source || 'Investor Hub',
  });

  if (!createResult.created || !createResult.shape_lead_id) {
    return {
      success: false,
      action: 'skipped',
      error: createResult.error || 'Shape create failed',
    };
  }

  return {
    success: true,
    id: createResult.shape_lead_id,
    action: 'created',
    matchedExisting: false,
  };
}

export { SHAPE_STATUS_MAP };
