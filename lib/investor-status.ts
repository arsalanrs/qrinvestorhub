import type { ExperienceInfo } from '@/types/investor-application';

export type InvestorTier = 'rookie' | 'pro' | 'elite';

export type InvestorTierInfo = {
  tier: InvestorTier;
  label: string;
  dealsLast3Years: number;
  nextTier: InvestorTier | null;
  nextTierLabel: string | null;
  dealsToNext: number;
  description: string;
};

/** Count investment deals completed in the last 3 years from intake answers. */
export function countDealsLast3Years(experience?: ExperienceInfo | null): number {
  if (!experience) return 0;
  const flips = experience.completedFlips ? parseInt(String(experience.flipsLast3Years || '0'), 10) : 0;
  const builds = experience.completedNewBuilds ? parseInt(String(experience.newBuildsLast3Years || '0'), 10) : 0;
  return (Number.isFinite(flips) ? flips : 0) + (Number.isFinite(builds) ? builds : 0);
}

export function getInvestorTierInfo(experience?: ExperienceInfo | null): InvestorTierInfo {
  const deals = countDealsLast3Years(experience);

  if (deals >= 7) {
    return {
      tier: 'elite',
      label: 'ELITE',
      dealsLast3Years: deals,
      nextTier: null,
      nextTierLabel: null,
      dealsToNext: 0,
      description: '7+ deals in the last 3 years — top-tier investor partner.',
    };
  }

  if (deals >= 3) {
    return {
      tier: 'pro',
      label: 'PRO',
      dealsLast3Years: deals,
      nextTier: 'elite',
      nextTierLabel: 'ELITE',
      dealsToNext: 7 - deals,
      description: '3–6 deals in the last 3 years — experienced investor.',
    };
  }

  return {
    tier: 'rookie',
    label: 'ROOKIE',
    dealsLast3Years: deals,
    nextTier: 'pro',
    nextTierLabel: 'PRO',
    dealsToNext: Math.max(0, 3 - deals),
    description: '0–2 deals in the last 3 years — building your track record.',
  };
}

export const APPLICATION_STATUS_STEPS = [
  { key: 'submitted', label: 'Application received' },
  { key: 'needs_review', label: 'Under review' },
  { key: 'sent_to_lendingpad', label: 'File in process' },
  { key: 'closed', label: 'Funded / closed' },
] as const;

export function getApplicationStatusIndex(status: string): number {
  const idx = APPLICATION_STATUS_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}
