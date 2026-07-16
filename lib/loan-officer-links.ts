import 'server-only';
import { getAppOrigin } from '@/lib/get-app-url';
import { getShapeLoRoster, loSlug, type ShapeLoRosterEntry } from '@/integrations/shape/lo-roster';

export function buildLoApplyUrl(entry: ShapeLoRosterEntry, program?: string): string {
  const origin = getAppOrigin() || '';
  const slug = entry.slug || loSlug(entry.name);
  const params = new URLSearchParams({ lo: slug });
  if (program) params.set('program', program);
  return `${origin}/investor-hub/apply?${params.toString()}`;
}

export function getPublicLoRoster() {
  return getShapeLoRoster().map(entry => {
    const slug = entry.slug || loSlug(entry.name);
    return {
      name: entry.name,
      depursLo: entry.depursLo,
      slug,
      applyUrl: buildLoApplyUrl({ ...entry, slug }),
    };
  });
}
