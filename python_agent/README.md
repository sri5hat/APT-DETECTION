
# ExfilSense Python Detection Agent

This directory contains a simple Python script (`agent.py`) designed to run on a machine you want to monitor (e.g., your Debian "monitoring" VM). It detects basic suspicious activities and sends alerts to your ExfilSense dashboard in real-time.

## Features

This agent can currently detect two types of threats:

1.  **File Staging**: Monitors the `/tmp` directory for the creation of large archive files (`.zip`, `.tar.gz`, etc.), which is a common indicator that an attacker is collecting data before exfiltrating it.
2.  **Suspicious Process Execution**: Watches for the execution of common command-line network utilities like `curl` and `wget`, which are often used by attackers to download tools or send data.

## Prerequisites

You need to have Python 3 and the `requests` and `psutil` libraries installed on your monitoring machine.

```bash
pip install requests
pip install psutil
```

## How to Use

### 1. Configure the Agent

Open `agent.py` in a text editor and make two important changes:

-   **`DASHBOARD_URL`**: If your ExfilSense dashboard is running on a different machine, change `localhost` to the IP address of the machine running the dashboard.
-   **`BEARER_TOKEN`**: **This is critical.** You MUST replace `"your_secret_token_here"` with the secret token you have set in the `.env` file of your Next.js project (the `ALERT_INGESTION_TOKEN` variable).

### 2. Run the Agent

On your Debian **monitoring** machine, run the script from the terminal:

```bash
python3 agent.py
```

The agent will start and print messages indicating that it's running and watching for threats.

### 3. Simulate an Attack

Now, from your Debian **attacker** machine (or even from another terminal on the monitoring machine), perform one of the following actions to trigger an alert.

#### To Trigger a "FileStaging" Alert:

Create a large archive file in the `/tmp` directory. This command creates a 15MB file.

```bash
# Run this on the monitoring machine
dd if=/dev/zero of=/tmp/secret-data-backup.zip bs=1M count=15
```

Within 10 seconds, the agent should detect the file, print an alert message to your console, and send the alert to the ExfilSense dashboard.

#### To Trigger a "ProcessAnomaly" Alert:

Use `curl` to simulate downloading a file or contacting a server.

```bash
# Run this on the monitoring machine
curl http://example.com -o /tmp/downloaded_file
```

Within 5 seconds, the agent will detect the `curl` process and send a `ProcessAnomaly` alert to the dashboard.

## How It Works

The agent runs two main functions in parallel threads:
- `watch_staging_directory()`: Periodically scans `/tmp` for large archives.
- `watch_suspicious_processes()`: Periodically checks the list of running processes for suspicious names.

When a threat is detected, the `send_alert()` function formats a JSON payload and sends it via an HTTP `POST` request to the `/api/alerts/ingest` endpoint of your dashboard, using the bearer token for authentication.
