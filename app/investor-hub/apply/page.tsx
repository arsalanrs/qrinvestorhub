import { InvestorApplicationWizard } from '@/components/wizard/InvestorApplicationWizard';

interface Props {
  searchParams: Promise<{ program?: string }>;
}

export default async function ApplyPage({ searchParams }: Props) {
  const params = await searchParams;
  const program = params.program;

  return <InvestorApplicationWizard initialProgram={program} />;
}
