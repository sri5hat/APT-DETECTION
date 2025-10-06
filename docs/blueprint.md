# **App Name**: ExfilSense

## Core Features:

- Event Ingestion: Ingest network, endpoint, and event streams in CSV format or via a synthetic event generator.
- Hybrid Detection Engine: Detect APT-like behavior using rule-based heuristics, unsupervised anomaly detection (Isolation Forest), and a supervised classifier trained on labeled exfiltration examples.
- Real-time Alerting: Generate alerts with fields: Time, Host, Alert Type, Score (0.00-1.00), MITRE Tactic, Src IP, Dst IP, Evidence, and Status (New/Investigating/Resolved).
- MITRE ATT&CK Mapping: Map detections to MITRE ATT&CK IDs and provide human-readable justifications.
- Alert Stream: Stream new alerts in real-time via Server-Sent Events for live UI updates.
- Composite Scoring with Explainability: Combine anomaly and classification signals into a composite alert score and provide top contributing features. Normalization weights will be adjustable through a tool that can access a config file.
- Interactive Alert Management: Web UI for displaying, filtering, sorting, and updating alert statuses with detail modal, MITRE mapping, contributing features, and analyst notes.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) for a sense of security and intelligence.
- Background color: Light gray (#F5F5F5) to ensure readability and reduce eye strain in a data-heavy UI.
- Accent color: Teal (#009688) to highlight important interactive elements and alerts.
- Body and headline font: 'Inter', a sans-serif font, will be used for all UI elements for a modern and readable experience.
- Use consistent, minimalist icons from a library like FontAwesome to represent different alert types and MITRE tactics.
- A clean, data-dense layout with clear separation of concerns, focusing on the alert table as the primary element.
- Subtle transitions and animations to provide feedback on user interactions (e.g., alert status changes, filtering).