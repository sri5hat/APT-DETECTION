# AI-Driven Framework for Real-Time APT Detection

### Abstract

Advanced Persistent Threats (APTs) are sophisticated cyberattacks that target critical infrastructures and sensitive data through stealthy, prolonged campaigns. This project proposes an AI-driven framework for real-time APT detection and mitigation by integrating threat intelligence, anomaly detection, and automated incident response. Leveraging datasets specific to APT activities, the system uses Isolation Forest and other machine learning models to identify malicious behaviors such as data exfiltration, DNS tunneling, lateral movement, and privilege escalation. The framework features a visual log dashboard, a web-based interface, and an automatic ticketing system for rapid response, enabling security teams to prioritize and remediate threats efficiently. By correlating external threat intelligence with internal network behavior, the system enhances detection accuracy for top APT campaigns and provides actionable insights to strengthen organizational cybersecurity posture.

### Keywords

*Advanced Persistent Threats, AI-based detection, Threat Intelligence, Isolation Forest, Data Exfiltration, DNS Exfiltration, Lateral Movement, Automated Incident Response, Cybersecurity Analytics*

---

## Core Features

- **AI-Generated Reports**: Automatically generate detailed reports about log analysis, highlighting anomalies and potential threats.
- **MITRE ATT&CK Framework Integration**: Map detections to MITRE ATT&CK tactics and techniques, providing actionable insights for security teams.
- **Real-time Alerting**: Generate alerts with fields: Time, Host, Alert Type, Score (0.00-1.00), MITRE Tactic, Src IP, Dst IP, Evidence, and Status (New/Investigating/Resolved).
- **Composite Scoring with Explainability**: Combine anomaly and classification signals into a composite alert score and provide top contributing features.
- **Visual Log Dashboard**: A web-based interface for monitoring and managing alerts in real-time.

## Getting Started

To run the ExfilSense dashboard on your local machine, follow these steps:

1. **Install Dependencies:**
   First, you need to install all the required Node.js packages listed in `package.json`. Open your terminal in the project's root directory and run:
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   Once the dependencies are installed, you can start the Next.js development server. Run the following command:
   ```bash
   npm run dev
   ```
   This will start the application in development mode with Turbopack for faster performance.

3. **View the Dashboard:**
   Open your web browser and navigate to **http://localhost:9002**. The application will start with a simulated data exfiltration scenario running.

## Integrating a Python Backend Agent

The Python backend agent (`apt_agent.py`) is designed to monitor suspicious activities on endpoints and send alerts to the dashboard. Follow these steps to integrate it:

1. **Install Python Dependencies:**
   Install the required Python libraries using pip:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Agent:**
   Start the Python agent by navigating to the `python_agent` directory and running:
   ```bash
   python3 apt_agent.py
   ```

3. **Simulate an Attack:**
   Test the system by simulating suspicious activities, such as creating large archive files in `/tmp` or executing network utilities like `curl`.

## Highlights

- **AI-Generated Reports**: The system leverages machine learning to analyze logs and generate comprehensive reports, aiding in faster decision-making.
- **MITRE ATT&CK Mapping**: Provides a clear mapping of detected threats to the MITRE ATT&CK framework, enhancing situational awareness.
- **Interactive Dashboard**: A user-friendly interface for real-time monitoring and management of security incidents.

![APT Detection Dashboard](python_agent/images/1.png)
