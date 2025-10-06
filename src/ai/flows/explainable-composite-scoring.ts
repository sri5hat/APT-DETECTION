// This is a server-side file!
'use server';

/**
 * @fileOverview A Genkit flow to provide human-readable explanations for alert scores.
 * 
 * - explainableCompositeScoring - A function that generates composite alert scores with explanations.
 * - ExplainableCompositeScoringInput - The input type for the explainableCompositeScoring function.
 * - ExplainableCompositeScoringOutput - The return type for the explainableCompositeScoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainableCompositeScoringInputSchema = z.object({
  ruleBasedScore: z
    .number()
    .min(0)
    .max(1)
    .describe('The score from rule-based heuristics (0 to 1).'),
  anomalyDetectionScore: z
    .number()
    .min(0)
    .max(1)
    .describe('The score from unsupervised anomaly detection (0 to 1).'),
  supervisedClassifierScore: z
    .number()
    .min(0)
    .max(1)
    .describe('The score from the supervised classifier (0 to 1).'),
  ruleBasedWeight: z
    .number()
    .min(0)
    .max(1)
    .describe('The weight for the rule-based score in the composite score.'),
  anomalyDetectionWeight: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'The weight for the anomaly detection score in the composite score.'
    ),
  supervisedClassifierWeight: z
    .number()
    .min(0)
    .max(1)
    .describe('The weight for the supervised classifier score in the composite score.'),
  topRuleHits: z.array(z.string()).describe('The top rule hits that fired.'),
  topFeatures: z
    .array(z.string())
    .describe('The top features contributing to the classifier score.'),
});

export type ExplainableCompositeScoringInput = z.infer<
  typeof ExplainableCompositeScoringInputSchema
>;

const ExplainableCompositeScoringOutputSchema = z.object({
  compositeScore: z
    .number()
    .min(0)
    .max(1)
    .describe('The final composite alert score (0 to 1).'),
  explanation: z.string().describe('A human-readable explanation of the score.'),
});

export type ExplainableCompositeScoringOutput = z.infer<
  typeof ExplainableCompositeScoringOutputSchema
>;

export async function explainableCompositeScoring(
  input: ExplainableCompositeScoringInput
): Promise<ExplainableCompositeScoringOutput> {
  return explainableCompositeScoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainableCompositeScoringPrompt',
  input: {schema: ExplainableCompositeScoringInputSchema},
  output: {schema: ExplainableCompositeScoringOutputSchema},
  prompt: `You are an expert security analyst explaining alert scores.

  You will receive scores from different detection methods: rule-based heuristics, anomaly detection, and a supervised classifier. You will also receive weights for each score, the top rule hits, and the top features contributing to the classifier score.

  Your task is to calculate a composite score based on the weighted average of the individual scores and provide a concise human-readable explanation of how the composite score was derived. Highlight the key factors that contributed most to the final score.

  Scores:
  - Rule-based score: {{{ruleBasedScore}}}
  - Anomaly detection score: {{{anomalyDetectionScore}}}
  - Supervised classifier score: {{{supervisedClassifierScore}}}

  Weights:
  - Rule-based weight: {{{ruleBasedWeight}}}
  - Anomaly detection weight: {{{anomalyDetectionWeight}}}
  - Supervised classifier weight: {{{supervisedClassifierWeight}}}

  Top Rule Hits: {{#each topRuleHits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Top Features: {{#each topFeatures}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Composite Score (weighted average): 
  
  Explanation:
  `, //Keep the explanation simple and within a single line.
});

const explainableCompositeScoringFlow = ai.defineFlow(
  {
    name: 'explainableCompositeScoringFlow',
    inputSchema: ExplainableCompositeScoringInputSchema,
    outputSchema: ExplainableCompositeScoringOutputSchema,
  },
  async input => {
    const compositeScore = 
      input.ruleBasedWeight * input.ruleBasedScore +
      input.anomalyDetectionWeight * input.anomalyDetectionScore +
      input.supervisedClassifierWeight * input.supervisedClassifierScore;

    const normalizedCompositeScore = Math.min(1, Math.max(0, compositeScore));

    // We don't need to call the AI for the composite score calculation itself,
    // but for the explanation based on the inputs.
    const {output} = await prompt({
      ...input
    });
    
    return {
      ...output,
      compositeScore: normalizedCompositeScore,
    } as ExplainableCompositeScoringOutput;
  }
);
