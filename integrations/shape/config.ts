const DEFAULT_SEARCH_BASE = 'https://secure-api.setshape.com/api';
const DEFAULT_UPDATE_URL = 'https://secure.setshape.com/api/update/lead/info';
const LEGACY_UPDATE_URL = 'https://secure-api.setshape.com/api/update/lead/info';

export function readShapeCrmId(): string {
  return String(
    process.env.SHAPE_CRM_ID || process.env.SHAPE_ACCOUNT_ID || process.env.CRM_ID || '',
  ).trim();
}

export function getShapeSearchConfig() {
  const apiKey = process.env.SHAPE_API_KEY || process.env.SHAPE_ACCESS_TOKEN || '';
  const crmId = readShapeCrmId();
  const searchBase = (process.env.SHAPE_BASE_URL || DEFAULT_SEARCH_BASE).replace(/\/+$/, '');
  return { apiKey, crmId, searchBase };
}

function resolveShapeUpdateUrl(updateUrl: string, crmId: string): string {
  const base = updateUrl.replace(/\/+$/, '');
  const id = crmId.trim();
  if (base.includes('secure.setshape.com')) return base;
  if (!id || base.endsWith(`/${id}`)) return base;
  return `${base}/${id}`;
}

export function getShapeUpdateUrlCandidates(): string[] {
  const crmId = readShapeCrmId();
  const configured = process.env.SHAPE_UPDATE_URL?.trim();
  const candidates: string[] = [];
  if (configured) candidates.push(resolveShapeUpdateUrl(configured, crmId));
  candidates.push(resolveShapeUpdateUrl(DEFAULT_UPDATE_URL, crmId));
  if (crmId) candidates.push(resolveShapeUpdateUrl(LEGACY_UPDATE_URL, crmId));
  return [...new Set(candidates.filter(Boolean))];
}

export function getInvestorHubPostLeadUrl(): string | null {
  const direct = process.env.SHAPE_INVESTOR_HUB_POST_LEAD_URL?.trim();
  if (direct) return direct;

  const crmId = readShapeCrmId() || '20931';
  const sourceId = process.env.SHAPE_INVESTOR_HUB_SOURCE_ID?.trim();
  if (!sourceId) return null;

  return `https://secure-api.setshape.com/postlead/${crmId}/${sourceId}`;
}

export function withSystemId<T extends Record<string, unknown>>(payload: T): T & { systemid?: number } {
  const crmId = readShapeCrmId();
  if (!crmId) return payload;
  const numeric = Number(crmId);
  if (Number.isNaN(numeric)) return payload;
  return { ...payload, systemid: numeric };
}
