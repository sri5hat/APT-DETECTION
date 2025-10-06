'use server';

import { explainableCompositeScoring, ExplainableCompositeScoringInput, ExplainableCompositeScoringOutput } from '@/ai/flows/explainable-composite-scoring';

export async function getExplanation(input: ExplainableCompositeScoringInput): Promise<ExplainableCompositeScoringOutput> {
  return await explainableCompositeScoring(input);
}
