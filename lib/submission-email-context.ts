import type { SubmissionEmailRouting } from '@/lib/investor-submission-routing';
import type { CallTranscriptContext } from '@/lib/call-transcript-lookup';
import type { ShapeUpsertResult } from '@/integrations/shape/client';

export type SubmissionEmailContext = {
  routing: SubmissionEmailRouting;
  transcript?: CallTranscriptContext;
  shapeResult?: ShapeUpsertResult;
};
