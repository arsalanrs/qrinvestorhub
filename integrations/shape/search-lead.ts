import 'server-only';
import { getShapeSearchConfig } from './config';
import { normalizePhoneDigits } from './phone';

export type ShapeLeadMatch = {
  found: true;
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadSource?: string;
};

function unwrapSearchResults(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  if (Array.isArray(json) && json[0]) return json[0] as Record<string, unknown>;
  if (Array.isArray(j.data) && j.data[0]) return j.data[0] as Record<string, unknown>;
  if (j.data && typeof j.data === 'object' && !Array.isArray(j.data)) {
    return j.data as Record<string, unknown>;
  }
  return null;
}

function leadFromRecord(lead: Record<string, unknown>, fallbackPhone: string): ShapeLeadMatch {
  return {
    found: true,
    leadId: String(lead.id ?? lead.leadid ?? lead.lead_id ?? ''),
    firstName: String(lead.firstname ?? lead.first_name ?? '').trim(),
    lastName: String(lead.lastname ?? lead.last_name ?? '').trim(),
    email: String(lead.email ?? '').trim(),
    phone: String(lead.phone ?? lead.mobilephone ?? fallbackPhone).trim(),
    leadSource: String(lead.leadsource ?? lead.lead_source ?? '').trim() || undefined,
  };
}

async function searchShape(body: Record<string, unknown>) {
  const { apiKey, crmId, searchBase } = getShapeSearchConfig();
  if (!apiKey || !crmId) {
    return { ok: false as const, error: 'Shape API not configured (SHAPE_API_KEY / SHAPE_CRM_ID)' };
  }

  const apiUrl = `${searchBase}/search/lead/${encodeURIComponent(crmId)}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false as const, error: `Shape search returned non-JSON: ${text.slice(0, 200)}` };
  }

  if (!response.ok) {
    return { ok: false as const, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
  }

  const lead = unwrapSearchResults(json);
  if (!lead) return { ok: true as const, lead: null };
  return { ok: true as const, lead };
}

/** Find existing Shape lead by phone (DSCR Hot / prior inbound). */
export async function searchShapeLeadByPhone(phone: string) {
  const phone10 = normalizePhoneDigits(phone);
  if (phone10.length !== 10) {
    return { found: false as const, error: 'Phone must have 10 digits' };
  }

  for (const body of [{ phone: phone10 }, { phone: `1${phone10}` }]) {
    const result = await searchShape(body);
    if (!result.ok) continue;
    if (result.lead) {
      const match = leadFromRecord(result.lead, phone10);
      if (match.leadId) return match;
    }
  }

  return { found: false as const, phone10 };
}

/** Secondary match by email when phone search misses. */
export async function searchShapeLeadByEmail(email: string) {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized) return { found: false as const, error: 'Email required' };

  const result = await searchShape({ email: normalized });
  if (!result.ok) return { found: false as const, error: result.error };
  if (!result.lead) return { found: false as const };

  const match = leadFromRecord(result.lead, '');
  if (!match.leadId) return { found: false as const };
  return match;
}
