# AI-Driven Framework for Real-Time APT Detection

## Abstract

Advanced Persistent Threats (APTs) are sophisticated cyberattacks that target critical infrastructures and sensitive data through stealthy, prolonged campaigns. This project proposes an AI-driven framework for real-time APT detection and mitigation by integrating threat intelligence, anomaly detection, and automated incident response. Leveraging datasets specific to APT activities, the system uses Isolation Forest and other machine learning models to identify malicious behaviors such as data exfiltration, DNS tunneling, lateral movement, and privilege escalation. The framework features a visual log dashboard, a web-based interface, and an automatic ticketing system for rapid response, enabling security teams to prioritize and remediate threats efficiently. By correlating external threat intelligence with internal network behavior, the system enhances detection accuracy for top APT campaigns and provides actionable insights to strengthen organizational cybersecurity posture.

### Keywords

*Advanced Persistent Threats, AI-based detection, Threat Intelligence, Isolation Forest, Data Exfiltration, DNS Exfiltration, Lateral Movement, Automated Incident Response, Cybersecurity Analytics*

---

## Getting Started

To run the ExfilSense dashboard on your local machine, follow these steps:

1.  **Install Dependencies:**
    First, you need to install all the required Node.js packages listed in `package.json`. Open your terminal in the project's root directory and run:
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    Once the dependencies are installed, you can start the Next.js development server. Run the following command:
    ```bash
    npm run dev
    ```
    This will start the application in development mode with Turbopack for faster performanc
3.  **View the Dashboard:**
    Open your web browser and navigate to [http://localhost:9002](http://localhost:9002). The application will start with a simulated data exfiltration scenario running.

## Integrating a Python Backend Agent

While this application simulates alerts, it is designed to receive real alerts from an external detection engine. You can build a Python agent to monitor a system for threats and send alerts to this dashboard.

### Alert Ingestion API

Your agent can send alerts by making a `POST` request to the `/api/alerts/ingest` endpoint.

- **URL:** `http://<your-host>/api/alerts/ingest`
- **Method:** `POST`
- **Authentication:** `Authorization: Bearer <your_secret_token>`
- **Body:** A JSON object matching the `Alert` structure.

A detailed guide and a `cURL` example can be found in `src/app/api/alerts/ingest/README.md`.

### Recommended Python Libraries for a Detection Agent

To build a backend that can detect the kinds of threats this dashboard visualizes (DNS tunneling, file staging, unusual network traffic), consider using the following Python libraries:

-   **`psutil`**: To monitor system utilization, processes, and network connections. It's invaluable for identifying suspicious processes or unusual resource usage.
-   **`watchdog`**: To monitor filesystem events in real-time. You can use it to detect suspicious file creation (e.g., staging archives), modifications, or access to sensitive directories.
-   **`scapy`**: For deep packet inspection and network traffic analysis. `scapy` can be used to capture and analyze network packets to detect anomalies like DNS tunneling or unusually large outbound data flows.
-   **`requests`**: A simple library for making HTTP requests. You'll need this to send the JSON-formatted alerts from your agent to the dashboard's ingestion API.

### Conceptual Agent Architecture

Based on best practices, a modular agent could be designed as follows:

1.  **File/Process Monitor**: Uses `watchdog` and `psutil` to track process creation (e.g., `powershell.exe` spawning from `WINWORD.EXE`) and file staging activities (e.g., creation of large `.zip` or `.7z` files in temp directories).
2.  **Network Monitor**: Uses `scapy` to analyze network traffic. It can have sub-modules for:
    -   **DNS Tunneling Detection**: Looks for high-entropy subdomains or unusually long DNS queries.
    -   **Exfiltration Detection**: Monitors for large outbound data flows to known cloud storage providers or flagged IPs, correlating this with recent file staging events.
3.  **Correlation Engine**: This central component receives findings from the monitors. If a file staging event is followed by a large upload to a suspicious IP, it can correlate these events to generate a high-confidence `DataExfiltration` alert.
4.  **Alerting Module**: When the correlation engine identifies a threat, this module formats the alert into the required JSON structure and uses `requests` to send it to the ExfilSense dashboard's API endpoint.
