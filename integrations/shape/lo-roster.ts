/** Shape CRM loan officer ids (`depursLo`) for ops assignment. Override via SHAPE_LO_ROSTER_JSON. */
export type ShapeLoRosterEntry = {
  name: string;
  depursLo: number;
  email?: string;
  slug?: string;
};

export function loSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveLoParam(param: string): ShapeLoRosterEntry | null {
  const trimmed = param.trim();
  if (!trimmed) return null;

  const roster = getShapeLoRoster();
  const byId = Number(trimmed);
  if (Number.isFinite(byId) && byId > 0) {
    return roster.find(e => e.depursLo === byId) ?? null;
  }

  const slug = trimmed.toLowerCase();
  return roster.find(e => (e.slug || loSlug(e.name)) === slug) ?? null;
}

export const DEFAULT_SHAPE_LO_ROSTER: ShapeLoRosterEntry[] = [
  { name: 'Tashawna Chisholm', depursLo: 49, email: 'tchisholm@questrock.com' },
  { name: 'Tyler Johnson', depursLo: 34, email: 'tjohnson@questrock.com' },
  { name: 'Bastian Johnston', depursLo: 13, email: 'bastianjohnston@questrock.com' },
  { name: 'Nikk Smith', depursLo: 3, email: 'nikksmith@questrock.com' },
  { name: 'Ray Conway', depursLo: 16, email: 'rconway@questrock.com' },
  { name: 'Gregory Bethea Jr', depursLo: 58, email: 'gbethea@questrock.com' },
  { name: 'Zachary Davis', depursLo: 55, email: 'zdavis@questrock.com' },
  { name: 'Jason Friday', depursLo: 52, email: 'jfriday@questrock.com' },
  { name: 'Concierge', depursLo: 31 },
];

let cachedRoster: ShapeLoRosterEntry[] | null = null;

export function getShapeLoRoster(): ShapeLoRosterEntry[] {
  if (cachedRoster) return cachedRoster;

  const raw = process.env.SHAPE_LO_ROSTER_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedRoster = parsed.map(entry => {
          const o = entry as Record<string, unknown>;
          const name = String(o.name ?? '').trim();
          return {
            name,
            depursLo: Number(o.depursLo ?? o.id),
            ...(o.email ? { email: String(o.email).trim() } : {}),
            ...(o.slug ? { slug: String(o.slug).trim() } : { slug: loSlug(name) }),
          };
        });
        return cachedRoster;
      }
    } catch {
      // fall through
    }
  }

  cachedRoster = DEFAULT_SHAPE_LO_ROSTER.map(entry => ({
    ...entry,
    slug: entry.slug || loSlug(entry.name),
  }));
  return cachedRoster;
}

export function getShapeLoName(depursLo: number): string | null {
  return getShapeLoRoster().find(e => e.depursLo === depursLo)?.name ?? null;
}
