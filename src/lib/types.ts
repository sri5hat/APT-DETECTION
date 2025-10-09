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
  | 'TA0005' // Defense Evasion
  | 'TA0009' // Collection
  | 'TA0011' // Command and Control
  | 'TA0002' // Execution
  | 'TA0007' // Credential Access
  | 'TA0040' // Impact
  | 'TA0042' // Resource Hijacking
  | 'TA0043'; // Network-based Effects
  


export type AlertType =
  | 'DataExfiltration'
  | 'DNSExfiltration'
  | 'FileStaging'
  | 'NetworkAnomaly'
  | 'ProcessAnomaly'
  | 'LateralMovement'
  | 'Beaconing'
  | 'FileAccess'
  | 'NetcatExecution'
  | 'ShortTcpConnectionBurst';

export interface Alert {
  id: string;
  time: string;
  host: string;
  alertType: AlertType;
  score: number;
  mitreTactic: string; // Allow any string for flexibility with ingested alerts
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
