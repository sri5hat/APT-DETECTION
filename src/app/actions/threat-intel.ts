'use server';

import {
  lookupThreatIntel,
  LookupThreatIntelInput,
  LookupThreatIntelOutput,
} from '@/ai/flows/lookup-threat-intel';

export async function getThreatIntel(
  input: LookupThreatIntelInput
): Promise<LookupThreatIntelOutput> {
  return await lookupThreatIntel(input);
}
