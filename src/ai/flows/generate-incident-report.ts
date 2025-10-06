
// This is a server-side file!
'use server';

/**
 * @fileOverview A Genkit flow to generate a detailed incident report for a security alert.
 *
 * - generateIncidentReport - A function that generates the report.
 * - GenerateIncidentReportInput - The input type for the generateIncidentReport function.
 * - GenerateIncidentReportOutput - The return type for the generateIncidentReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { lookupThreatIntel, type LookupThreatIntelOutput as ThreatIntelOutput } from './lookup-threat-intel';

const GenerateIncidentReportInputSchema = z.object({
  alert: z.object({
    id: z.string(),
    time: z.string(),
    host: z.string(),
    alertType: z.string(),
    score: z.number(),
    mitreTactic: z.string(),
    srcIp: z.string(),
    dstIp: z.string(),
    evidence: z.string(),
    status: z.string(),
    topFeatures: z.array(z.string()),
  }),
});

export type GenerateIncidentReportInput = z.infer<typeof GenerateIncidentReportInputSchema>;

const GenerateIncidentReportOutputSchema = z.object({
  report: z.string().describe('The full, formatted incident report as a single Markdown string.'),
  justification: z.string().describe('A concise, single-sentence, human-readable justification for the alert, explaining *why* it is suspicious.')
});

export type GenerateIncidentReportOutput = z.infer<typeof GenerateIncidentReportOutputSchema>;

export async function generateIncidentReport(
  input: GenerateIncidentReportInput
): Promise<GenerateIncidentReportOutput> {
  return generateIncidentReportFlow(input);
}

// Define the schema for the threat intel tool's output here.
const LookupThreatIntelOutputSchema = z.object({
  isMalicious: z.boolean().describe('Whether the indicator is considered malicious.'),
  knownFor: z.array(z.string()).describe('A list of threat categories the indicator is associated with (e.g., Brute Force, C2, Malware).'),
  reportSummary: z.string().describe('A short, one-sentence summary of the threat intelligence findings.'),
});


// Define a tool to get threat intel for an IP
const getThreatIntelTool = ai.defineTool(
  {
    name: 'getThreatIntelForIp',
    description: 'Gets threat intelligence information for a given IP address. Use this for both the source and destination IP addresses.',
    inputSchema: z.object({ ip: z.string() }),
    outputSchema: LookupThreatIntelOutputSchema,
  },
  async ({ ip }) => {
    // Do not perform lookups on internal or unassigned IPs
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip === '-' || ip.startsWith('127.')) {
      return {
        isMalicious: false,
        knownFor: [],
        reportSummary: 'This is an internal or unassigned IP address; no external threat intel is available.',
      };
    }
    return await lookupThreatIntel({ indicator: ip });
  }
);


const prompt = ai.definePrompt({
  name: 'generateIncidentReportPrompt',
  input: { schema: GenerateIncidentReportInputSchema },
  output: { schema: GenerateIncidentReportOutputSchema },
  tools: [getThreatIntelTool],
  prompt: `You are a Tier 1 SOC Analyst responsible for writing initial incident reports and providing clear alert justifications.
  
  An alert has been triggered. Your tasks are:
  1. Generate a detailed incident report in **Markdown format** based on the alert data provided.
  2. Provide a concise, single-sentence, human-readable justification for the alert, explaining *why* it's suspicious based on its evidence and top features. Start the justification directly, without any preamble like "This alert is...".
  
  Use the 'getThreatIntelForIp' tool to enrich BOTH the source IP address ({{{alert.srcIp}}}) AND the destination IP address ({{{alert.dstIp}}}) with threat intelligence data if they are public IPs.
  
  **Incident Report Markdown Template:**
  
  # Incident Report: {{{alert.alertType}}} on {{{alert.host}}}
  
  ## Summary
  - **Title**: Alert: {{{alert.alertType}}} on {{{alert.host}}}
  - **Date/Time**: {{{alert.time}}}
  - **Severity**: [Determine based on score: >0.85 = High, >0.6 = Medium, else = Low]
  - **Detection Source**: ExfilSense Platform
  
  ## Event Details
  - **Alert ID**: \`{{{alert.id}}}\`
  - **Host**: \`{{{alert.host}}}\`
  - **User**: [Extract from evidence if available, otherwise "N/A"]
  - **Source IP**: \`{{{alert.srcIp}}}\`
  - **Destination IP**: \`{{{alert.dstIp}}}\`
  - **MITRE ATT&CK**: [{{{alert.mitreTactic}}}](https://attack.mitre.org/tactics/{{alert.mitreTactic}})
  
  ## Intelligence Analysis
  - **Threat Intel on Source IP ({{{alert.srcIp}}})**: [Summarize the findings from the getThreatIntelForIp tool. Mention if it's malicious and what it's known for.]
  - **Threat Intel on Destination IP ({{{alert.dstIp}}})**: [Summarize the findings from the getThreatIntelForIp tool. Mention if it's malicious and what it's known for.]

  ## Evidence
  - **Raw Evidence**: \`{{{alert.evidence}}}\`
  - **Alert Score**: **{{{alert.score}}}**
  - **Top Contributing Features**: {{#each alert.topFeatures}}\`{{{this}}}\`{{#unless @last}}, {{/unless}}{{/each}}
  
  ## Actions Taken
  - Alert triggered and ingested for review.
  - Threat intelligence lookup performed on source and destination IPs.
  - No automated response actions taken.
  
  ## Recommendation
  - Analyst to review the alert and associated evidence.
  - If confirmed malicious, escalate to SOC L2.
  - Consider blocking the source IP at the firewall if the activity is deemed hostile.
  
  ## Escalation
  - **Escalated to**: SOC L1 (Pending Review)
  - **Ticket ID**: Pending Triage
  `,
});


const generateIncidentReportFlow = ai.defineFlow(
  {
    name: 'generateIncidentReportFlow',
    inputSchema: GenerateIncidentReportInputSchema,
    outputSchema: GenerateIncidentReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
