
import requests
import time
import os
import psutil
from threading import Thread

# --- Configuration ---
# The URL where your ExfilSense dashboard is running.
# If running on a different machine, replace 'localhost' with the appropriate IP address.
DASHBOARD_URL = "http://localhost:9002/api/alerts/ingest"

# IMPORTANT: This token MUST match the 'ALERT_INGESTION_TOKEN' in your .env file for the Next.js app.
BEARER_TOKEN = "secret_token_!@#$%" 

# --- Detection Logic ---

def watch_staging_directory():
    """
    Continuously checks for large archive files in /tmp, which could indicate data staging.
    """
    print("[+] Starting file staging watcher...")
    temp_dir = "/tmp"
    
    while True:
        try:
            files_in_tmp = os.listdir(temp_dir)
            for filename in files_in_tmp:
                if filename.endswith(('.zip', '.7z', '.tar.gz', '.rar')):
                    file_path = os.path.join(temp_dir, filename)
                    # Check if it's a file and not a directory
                    if not os.path.isfile(file_path):
                        continue
                        
                    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
                    
                    # Alert if a large archive is found (e.g., > 10MB)
                    if file_size_mb > 10:
                        print(f"[*] ALERT: Detected large archive: {filename} ({file_size_mb:.2f} MB)")
                        send_alert({
                            "host": os.uname().nodename,
                            "alertType": "FileStaging",
                            "score": 0.82,
                            "mitreTactic": "TA0009",  # Collection
                            "srcIp": "127.0.0.1",
                            "dstIp": "-",
                            "evidence": f"Large archive file '{filename}' found in {temp_dir}, size: {file_size_mb:.2f} MB",
                            "topRuleHits": ["Large Archive in Temp Directory"],
                            "topFeatures": [f"file_path:{file_path}", f"size_mb:{file_size_mb:.2f}"],
                            "ruleBasedScore": 0.9,
                            "anomalyDetectionScore": 0.7,
                            "supervisedClassifierScore": 0.85,
                        })
                        # Clean up the file to prevent re-alerting in this simple example
                        os.remove(file_path)
        except Exception as e:
            print(f"[!] Error in file watcher: {e}")
            
        time.sleep(10) # Check every 10 seconds

def watch_suspicious_processes():
    """
    Monitors for the execution of suspicious processes like curl or wget.
    """
    print("[+] Starting suspicious process watcher...")
    seen_pids = set()
    
    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                # Check if the process name is suspicious and we haven't seen it before
                if proc.info['name'] in ['curl', 'wget'] and proc.pid not in seen_pids:
                    cmdline = ' '.join(proc.info['cmdline'])
                    print(f"[*] ALERT: Detected suspicious process: {proc.info['name']} (PID: {proc.pid})")
                    send_alert({
                        "host": os.uname().nodename,
                        "alertType": "ProcessAnomaly",
                        "score": 0.65,
                        "mitreTactic": "TA0011",  # Command and Control
                        "srcIp": "127.0.0.1",
                        "dstIp": "-",
                        "evidence": f"Suspicious process execution: {cmdline}",
                        "topRuleHits": ["Execution of Network Utility"],
                        "topFeatures": [f"process:{proc.info['name']}", "parent:unknown"],
                        "ruleBasedScore": 0.7,
                        "anomalyDetectionScore": 0.5,
                        "supervisedClassifierScore": 0.6,
                    })
                    seen_pids.add(proc.pid) # Add PID to set to avoid duplicate alerts

                    # Optional: Clean up old PIDs to prevent memory growth over time
                    if len(seen_pids) > 1000:
                        seen_pids.clear()
        except Exception as e:
            print(f"[!] Error in process watcher: {e}")

        time.sleep(5) # Check every 5 seconds

# --- Alerting Function ---
def send_alert(alert_payload):
    """Sends a formatted alert to the dashboard's API endpoint."""
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(DASHBOARD_URL, json=alert_payload, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        print(f"[+] Alert sent successfully: {alert_payload['alertType']} on {alert_payload['host']}")
    except requests.exceptions.RequestException as e:
        print(f"[!] FAILED TO SEND ALERT: {e}")

# --- Main Execution ---
if __name__ == "__main__":
    print("--- Starting Simple APT Detection Agent ---")
    
    if BEARER_TOKEN == "your_secret_token_here" or BEARER_TOKEN == "secret_token_!@#$%":
        print("\n[INFO] Using default bearer token.")
        if BEARER_TOKEN == "your_secret_token_here":
             print("[CRITICAL] SECURITY WARNING: Please update the 'BEARER_TOKEN' in this script to match your '.env' file!")
    
    # Run watchers in separate threads so they don't block each other
    file_watcher_thread = Thread(target=watch_staging_directory, daemon=True)
    process_watcher_thread = Thread(target=watch_suspicious_processes, daemon=True)

    file_watcher_thread.start()
    process_watcher_thread.start()

    print("--- Agent is running. Monitoring for threats. ---")
    
    # Keep the main thread alive
    while True:
        time.sleep(1)
