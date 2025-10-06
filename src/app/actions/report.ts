'use server';

import {
  generateIncidentReport,
  GenerateIncidentReportInput,
  GenerateIncidentReportOutput,
} from '@/ai/flows/generate-incident-report';

export async function getIncidentReport(
  input: GenerateIncidentReportInput
): Promise<GenerateIncidentReportOutput> {
  return await generateIncidentReport(input);
}
