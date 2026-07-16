import { InvestorApplicationWizard } from '@/components/wizard/InvestorApplicationWizard';
import { resolveLoParam, loSlug } from '@/integrations/shape/lo-roster';

interface Props {
  searchParams: Promise<{ program?: string; lo?: string }>;
}

export default async function ApplyPage({ searchParams }: Props) {
  const params = await searchParams;
  const program = params.program;
  const loEntry = params.lo ? resolveLoParam(params.lo) : null;
  const initialLo = loEntry
    ? {
        depursLo: loEntry.depursLo,
        name: loEntry.name,
        slug: loEntry.slug || loSlug(loEntry.name),
      }
    : undefined;

  return <InvestorApplicationWizard initialProgram={program} initialLo={initialLo} />;
}
