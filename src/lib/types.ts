export type AlertStatus = 'New' | 'Investigating' | 'Resolved';

/**
 * MITRE ATT&CK Tactic IDs
 * @see https://attack.mitre.org/tactics/enterprise/
 */
export type MitreTactic =
  | 'TA0010' // Exfiltration
  | 'TA0001' // Initial Access
  | 'TA0008' // Lateral Movement
  | 'TA0003' // Persistence
  | 'TA0005' // Discovery
  | 'TA0009' // Collection
  | 'TA0011' // Command and Control
  | 'TA0002' // Execution
  | 'TA0007'; // Privilege Escalation


export type AlertType =
  | 'DataExfiltration'
  | 'DNSExfiltration'
  | 'FileStaging'
  | 'NetworkAnomaly'
  | 'ProcessAnomaly'
  | 'LateralMovement'
  | 'Beaconing'
  | 'FileAccess';

export interface Alert {
  id: string;
  time: string;
  host: string;
  alertType: AlertType;
  score: number;
  mitreTactic: MitreTactic;
  srcIp: string;
  dstIp: string;
  evidence: string;
  status: AlertStatus;
  // For AI explainability
  ruleBasedScore: number;
  anomalyDetectionScore: number;
  supervisedClassifierScore: number;
  topRuleHits: string[];
  topFeatures: string[];
}
