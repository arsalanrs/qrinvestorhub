export type PortalResource = {
  id: string;
  category: 'tips' | 'partners' | 'services';
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

export const PORTAL_RESOURCES: PortalResource[] = [
  {
    id: 'biweekly',
    category: 'tips',
    title: 'Biweekly payment strategy',
    description: 'Pay half your mortgage every two weeks — one extra full payment per year, less interest over time.',
    href: 'https://www.investopedia.com/mortgage/biweekly-mortgage-payments/',
    external: true,
  },
  {
    id: 'property-managers',
    category: 'partners',
    title: 'Property manager directory',
    description: 'Find vetted property managers in your market (QuestRock can introduce partners on request).',
    href: 'https://www.narpm.org/find-a-manager',
    external: true,
  },
  {
    id: 'cpa',
    category: 'partners',
    title: 'Connect with a CPA',
    description: 'Self-employed and investor tax planning — ask your QuestRock LO for a CPA referral in your state.',
    href: 'https://questrock.com',
    external: true,
  },
  {
    id: 'ownwell',
    category: 'services',
    title: 'Ownwell — appeal property taxes',
    description: 'Protest over-assessed property values and lower your tax bill (popular with investors).',
    href: 'https://www.ownwell.com',
    external: true,
  },
  {
    id: 'insurance',
    category: 'services',
    title: 'Landlord & hazard insurance',
    description: 'Compare landlord policies — include annual premium in your DSCR math.',
    href: 'https://www.obieinsurance.com',
    external: true,
  },
  {
    id: 'contractors',
    category: 'services',
    title: 'Contractor & rehab network',
    description: 'Rehab and fix-and-flip projects — document scope of work for faster underwriting.',
    href: 'https://www.homeadvisor.com',
    external: true,
  },
  {
    id: 'portfolio-analysis',
    category: 'tips',
    title: 'Portfolio analysis — ready to buy?',
    description: 'Run your next deal through QuestRock Investor Hub intake for terms on DSCR, bridge, rehab, and more.',
    href: '/investor-hub/apply',
    external: false,
  },
];
