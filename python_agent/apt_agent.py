import requests
import time
import os
import psutil
from threading import Thread
from collections import defaultdict, deque

# ===============================
# Configuration
# ===============================

# Replace with your dashboard or API endpoint
DASHBOARD_URL = "http://localhost:3000/api/alerts/ingest"

# Replace with your real token (should match your dashboard .env)
BEARER_TOKEN = "apt-detection-secret-token-2025"

# ===============================
# Detection Modules
# ===============================

def watch_staging_directory():
    """Detect large archive files (potential data staging)."""
    print("[+] Starting file staging watcher...")
    temp_dir = "/tmp"
    while True:
        try:
            files_in_tmp = os.listdir(temp_dir)
            for filename in files_in_tmp:
                if filename.endswith(('.zip', '.7z', '.tar.gz', '.rar')):
                    file_path = os.path.join(temp_dir, filename)
                    if not os.path.isfile(file_path):
                        continue

                    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
                    if file_size_mb > 10:
                        print(f"[*] ALERT: Large archive detected: {filename} ({file_size_mb:.2f} MB)")
                        send_alert({
                            "host": os.uname().nodename,
                            "alertType": "FileStaging",
                            "score": 0.82,
                            "mitreTactic": "TA0009",  # Collection
                            "srcIp": "127.0.0.1",
                            "dstIp": "-",
                            "evidence": f"Large archive '{filename}' found in {temp_dir} ({file_size_mb:.2f} MB)",
                            "topRuleHits": ["Large Archive in /tmp"],
                            "topFeatures": [f"file:{file_path}", f"size_mb:{file_size_mb:.2f}"],
                            "ruleBasedScore": 0.9,
                            "anomalyDetectionScore": 0.7,
                            "supervisedClassifierScore": 0.85,
                        })
                        os.remove(file_path)
        except Exception as e:
            print(f"[!] Error in file watcher: {e}")
        time.sleep(10)


def watch_suspicious_processes():
    """Detect suspicious command-line utilities like curl/wget."""
    print("[+] Starting suspicious process watcher...")
    seen_pids = set()
    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                if proc.info['name'] in ['curl', 'wget'] and proc.pid not in seen_pids:
                    cmdline = ' '.join(proc.info['cmdline'])
                    print(f"[*] ALERT: Suspicious process: {proc.info['name']} (PID: {proc.pid})")
                    send_alert({
                        "host": os.uname().nodename,
                        "alertType": "ProcessAnomaly",
                        "score": 0.65,
                        "mitreTactic": "TA0011",
                        "srcIp": "127.0.0.1",
                        "dstIp": "-",
                        "evidence": f"Suspicious process execution: {cmdline}",
                        "topRuleHits": ["Execution of Network Utility"],
                        "topFeatures": [f"process:{proc.info['name']}"],
                        "ruleBasedScore": 0.7,
                        "anomalyDetectionScore": 0.5,
                        "supervisedClassifierScore": 0.6,
                    })
                    seen_pids.add(proc.pid)
            if len(seen_pids) > 1000:
                seen_pids.clear()
        except Exception as e:
            print(f"[!] Error in process watcher: {e}")
        time.sleep(5)


def watch_netcat_processes():
    """Detect netcat/socat/ncat execution (small data exfil or reverse shells)."""
    print("[+] Starting netcat/socat watcher...")
    seen_pids = set()
    suspicious_names = {'nc', 'netcat', 'socat', 'ncat'}
    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                name = proc.info.get('name') or ''
                if name in suspicious_names and proc.pid not in seen_pids:
                    cmdline = ' '.join(proc.info.get('cmdline') or [])
                    print(f"[*] ALERT: Netcat detected: {name} (PID: {proc.pid})")
                    send_alert({
                        "host": os.uname().nodename,
                        "alertType": "NetcatExecution",
                        "score": 0.92,
                        "mitreTactic": "TA0011",
                        "srcIp": "127.0.0.1",
                        "dstIp": "-",
                        "evidence": f"Detected '{name}' execution: {cmdline}",
                        "topRuleHits": ["Netcat Utility Execution"],
                        "topFeatures": [f"process:{name}", f"cmdline:{cmdline}"],
                        "ruleBasedScore": 0.95,
                        "anomalyDetectionScore": 0.8,
                        "supervisedClassifierScore": 0.9,
                    })
                    seen_pids.add(proc.pid)
            if len(seen_pids) > 2000:
                seen_pids.clear()
        except Exception as e:
            print(f"[!] Error in netcat watcher: {e}")
        time.sleep(2)


def watch_short_tcp_connections():
    """Detect small-chunk data exfiltration via repeated short TCP sessions."""
    print("[+] Starting short TCP connection watcher...")
    SHORT_CONN_SECONDS = 30
    SHORT_CONN_REPEAT_THRESHOLD = 5
    SHORT_CONN_WINDOW = 60
    prev_set = set()
    conn_first_seen = {}
    recent_short = defaultdict(lambda: deque())

    while True:
        try:
            conns = psutil.net_connections(kind='tcp')
            current = set()
            now = time.time()

            for c in conns:
                if not c.raddr:
                    continue
                laddr_ip = getattr(c.laddr, 'ip', None) or c.laddr[0]
                raddr_ip = getattr(c.raddr, 'ip', None) or c.raddr[0]
                key = (laddr_ip, raddr_ip, c.pid)
                current.add(key)
                if key not in conn_first_seen:
                    conn_first_seen[key] = now

            closed = prev_set - current
            for key in closed:
                start = conn_first_seen.pop(key, now)
                duration = now - start
                _, r_ip, _ = key

                if r_ip.startswith(('127.', '10.', '192.168.', '172.')):
                    continue

                if duration < SHORT_CONN_SECONDS:
                    dq = recent_short[r_ip]
                    dq.append(now)
                    while dq and now - dq[0] > SHORT_CONN_WINDOW:
                        dq.popleft()

                    if len(dq) >= SHORT_CONN_REPEAT_THRESHOLD:
                        evidence = f"{len(dq)} short TCP connections to {r_ip} in {SHORT_CONN_WINDOW}s"
                        print(f"[*] ALERT: {evidence}")
                        send_alert({
                            "host": os.uname().nodename,
                            "alertType": "ShortTcpConnectionBurst",
                            "score": 0.78,
                            "mitreTactic": "TA0011",
                            "srcIp": "-",
                            "dstIp": r_ip,
                            "evidence": evidence,
                            "topRuleHits": ["Repeated short TCP connections"],
                            "topFeatures": [f"remote:{r_ip}", f"count:{len(dq)}"],
                            "ruleBasedScore": 0.8,
                            "anomalyDetectionScore": 0.6,
                            "supervisedClassifierScore": 0.65,
                        })
                        recent_short[r_ip].clear()
            prev_set = current
        except Exception as e:
            print(f"[!] Error in short-tcp watcher: {e}")
        time.sleep(2)


# ===============================
# Alert Sending
# ===============================

def send_alert(alert_payload):
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(DASHBOARD_URL, json=alert_payload, headers=headers)
        response.raise_for_status()
        print(f"[+] Alert sent: {alert_payload['alertType']} on {alert_payload['host']}")
    except requests.exceptions.RequestException as e:
        print(f"[!] FAILED TO SEND ALERT: {e}")


# ===============================
# Main
# ===============================

if __name__ == "__main__":
    print("\n--- Starting Simple APT Detection Agent ---")
    if BEARER_TOKEN == "your_secret_token_here":
        print("\n[CRITICAL] SECURITY WARNING: Please update BEARER_TOKEN!\n")

    # Run watchers in parallel threads
    Thread(target=watch_staging_directory, daemon=True).start()
    Thread(target=watch_suspicious_processes, daemon=True).start()
    Thread(target=watch_netcat_processes, daemon=True).start()
    Thread(target=watch_short_tcp_connections, daemon=True).start()

    print("--- Agent is running. Monitoring for threats. ---")
    while True:
        time.sleep(1)
