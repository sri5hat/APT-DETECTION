#!/usr/bin/env python3
"""
Robust APT Detection Agent
- More verbose error reporting for send_alert (prints status + body)
- Startup health check to validate DASHBOARD_URL + BEARER_TOKEN
- Defensive handling of psutil fields / None values
- Each watcher uses try/except and non-blocking behavior
- Keeps the same detection logic you wrote, with a few hardening fixes
"""

import requests
import time
import os
import psutil
from threading import Thread
from collections import defaultdict, deque
import hashlib
import stat
import json
import socket
import traceback

# ===============================
# Configuration
# ===============================
DASHBOARD_URL = "http://localhost:3000/api/alerts/ingest"
BEARER_TOKEN = "apt-detection-secret-token-2025"

# Thresholds / tuning
LARGE_ARCHIVE_MB = 10
SUSPICIOUS_DOWNLOAD_NAMES = ("payload", "install", "update", "download")
SHORT_TCP_SECONDS = 30
SHORT_TCP_REPEAT_THRESHOLD = 5
SHORT_TCP_WINDOW = 60
SUID_BASELINE_PATHS = ["/usr/bin", "/usr/local/bin", "/bin", "/sbin", "/usr/sbin"]

# Retry / network config
HTTP_TIMEOUT = 5
HTTP_RETRIES = 2
HEALTHCHECK_TIMEOUT = 3

# ===============================
# Utilities
def host():
    try:
        return os.uname().nodename
    except Exception:
        try:
            return socket.gethostname()
        except Exception:
            return "unknown-host"

def baseline_suid_files():
    """Scan SUID files in baseline paths and return a set of their paths."""
    suid_files = set()
    for base_path in SUID_BASELINE_PATHS:
        if not os.path.isdir(base_path):
            continue
        for root, dirs, files in os.walk(base_path):
            for fname in files:
                fpath = os.path.join(root, fname)
                try:
                    st = os.stat(fpath)
                    # test SUID bit
                    if st.st_mode & stat.S_ISUID:
                        suid_files.add(fpath)
                except Exception:
                    continue
    return suid_files

def hash_file(path):
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None

# ===============================
# Alert Sending (robust)
def send_alert(alert_payload):
    """
    Normalize payload and POST to DASHBOARD_URL.
    Prints HTTP status + body when available, and exceptions if any.
    """
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json"
    }

    normalized = {
        "host": alert_payload.get("host") or host(),
        "alertType": alert_payload.get("alertType", "NetworkAnomaly"),
        "score": float(alert_payload.get("score", 0.0)) if alert_payload.get("score") is not None else 0.0,
        "mitreTactic": alert_payload.get("mitreTactic", ""),
        "srcIp": alert_payload.get("srcIp", ""),
        "dstIp": alert_payload.get("dstIp", ""),
        "evidence": alert_payload.get("evidence", ""),
        "ruleBasedScore": float(alert_payload.get("ruleBasedScore", 0.0)) if alert_payload.get("ruleBasedScore") is not None else 0.0,
        "anomalyDetectionScore": float(alert_payload.get("anomalyDetectionScore", 0.0)) if alert_payload.get("anomalyDetectionScore") is not None else 0.0,
        "supervisedClassifierScore": float(alert_payload.get("supervisedClassifierScore", 0.0)) if alert_payload.get("supervisedClassifierScore") is not None else 0.0,
        "topRuleHits": list(filter(None, list(alert_payload.get("topRuleHits", []) or []))),
        "topFeatures": list(filter(None, list(alert_payload.get("topFeatures", []) or []))),
        # Attach raw payload for debugging (optional, remove for production)
        "raw": alert_payload
    }

    body = None
    # dedup: avoid sending identical alerts repeatedly within window
    try:
        # compute a simple signature from type+evidence+dst/src ip
        sig_src = (normalized.get('alertType', ''), normalized.get('evidence', ''), normalized.get('dstIp', ''), normalized.get('srcIp', ''))
        sig = hashlib.sha1(json.dumps(sig_src, sort_keys=True).encode()).hexdigest()
        now_ts = time.time()
        if not hasattr(send_alert, '_recent_signatures'):
            send_alert._recent_signatures = {}
        # TTL 60s for duplicate suppression
        ttl = 60
        # purge old
        to_del = [k for k, v in send_alert._recent_signatures.items() if now_ts - v > ttl]
        for k in to_del:
            del send_alert._recent_signatures[k]
        if sig in send_alert._recent_signatures:
            print(f"[=] Duplicate alert suppressed (sig={sig[:8]}) for {normalized.get('alertType')}: {normalized.get('evidence')[:80]}")
            return False
        # mark
        send_alert._recent_signatures[sig] = now_ts
    except Exception:
        pass
    for attempt in range(1, HTTP_RETRIES + 2):
        try:
            response = requests.post(DASHBOARD_URL, json=normalized, headers=headers, timeout=HTTP_TIMEOUT)
            body = None
            try:
                body = response.text
            except Exception:
                body = "<no body>"
            if response.ok:
                print(f"[+] Alert sent: {normalized.get('alertType')} on {normalized.get('host')} (HTTP {response.status_code})")
                # optionally print server response for debugging
                print(f"    server response: {body}")
                # also write a short local log file for debugging/dashboard
                try:
                    with open('/tmp/apt_agent_last_alert.log', 'a') as af:
                        af.write(json.dumps({'time': time.time(), 'alert': normalized}) + "\n")
                except Exception:
                    pass
                return True
            else:
                print(f"[!] ALERT NOT ACCEPTED (HTTP {response.status_code}): {body}")
        except requests.exceptions.RequestException as e:
            print(f"[!] FAILED TO SEND ALERT (attempt {attempt}): {e}")
            # show trace for deep debugging (only during dev)
            # traceback.print_exc()
        # small backoff between retries
        time.sleep(0.5 * attempt)

    # if we reach here, all attempts failed
    print(f"[!] All attempts to send alert failed. Local alert: {json.dumps(normalized, default=str)[:300]}...")
    return False

def check_dashboard_health():
    """Try a small GET or simple POST to ensure server reachable and auth accepted."""
    print("[*] Running dashboard health check...")
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    try:
        # Prefer HEAD/GET if the endpoint supports it; otherwise post a small ping
        resp = requests.get(DASHBOARD_URL, headers=headers, timeout=HEALTHCHECK_TIMEOUT)
        print(f"[*] Health check: HTTP {resp.status_code} - {resp.reason}")
        try:
            print("    server body:", resp.text[:200])
        except Exception:
            pass
    except Exception as e:
        print(f"[!] Health check failed: {e}")

# ===============================
# Detection Modules
def watch_staging_directory():
    """Detect large archive files (potential data staging)."""
    print("[+] Starting file staging watcher...")
    temp_dir = "/tmp"
    while True:
        try:
            for filename in os.listdir(temp_dir):
                # handle multi-extension matches (e.g., .tar.gz)
                lower = filename.lower()
                if lower.endswith(('.zip', '.7z', '.tar.gz', '.tgz', '.rar')):
                    file_path = os.path.join(temp_dir, filename)
                    if os.path.isfile(file_path):
                        try:
                            size_mb = os.path.getsize(file_path) / (1024 * 1024)
                        except Exception:
                            size_mb = 0
                        if size_mb > LARGE_ARCHIVE_MB:
                            evidence = f"Large archive '{filename}' in {temp_dir} ({size_mb:.2f} MB)"
                            print(f"[*] ALERT: {evidence}")
                            send_alert({
                                "host": host(),
                                "alertType": "FileStaging",
                                "score": 0.82,
                                "mitreTactic": "TA0009",
                                "evidence": evidence,
                                "topRuleHits": ["Large archive in /tmp"],
                                "topFeatures": [f"file:{file_path}", f"size_mb:{size_mb:.2f}"],
                            })
                            try:
                                os.remove(file_path)
                            except Exception as e:
                                print(f"[!] Could not remove staged file: {e}")
        except Exception as e:
            print(f"[!] Error in file watcher: {e}")
            traceback.print_exc()
        time.sleep(10)

def watch_suspicious_processes():
    """Detect suspicious utilities like curl/wget."""
    print("[+] Starting suspicious process watcher...")
    seen_pids = set()
    suspicious_names = {'curl', 'wget', 'fetch', 'powershell', 'invoke-webrequest'}
    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                info = proc.info
                name = (info.get('name') or "").lower()
                pid = info.get('pid')
                # if name is empty, try to inspect cmdline first token
                if not name:
                    cmdline = info.get('cmdline') or []
                    if cmdline:
                        name = os.path.basename(cmdline[0]).lower()
                if name in suspicious_names and pid not in seen_pids:
                    cmdline = ' '.join(info.get('cmdline') or [])
                    suspicious_name_match = any(tok in cmdline.lower() for tok in SUSPICIOUS_DOWNLOAD_NAMES)
                    evidence = f"Suspicious process {name} (pid {pid}) cmdline: {cmdline}"
                    print(f"[*] ALERT: {evidence}")
                    send_alert({
                        "host": host(),
                        "alertType": "ProcessAnomaly",
                        "score": 0.88 if suspicious_name_match else 0.65,
                        "mitreTactic": "TA0001",
                        "evidence": evidence,
                        "topRuleHits": ["Network Utility Execution", "Suspicious download name" if suspicious_name_match else ""],
                        "topFeatures": [f"process:{name}", f"cmdline:{cmdline}"],
                    })
                    seen_pids.add(pid)
            if len(seen_pids) > 2000:
                seen_pids.clear()
        except Exception as e:
            print(f"[!] Error in process watcher: {e}")
            traceback.print_exc()
        time.sleep(5)

def watch_netcat_processes():
    """Detect netcat/socat/ncat execution."""
    print("[+] Starting netcat/socat watcher...")
    seen_pids = set()
    suspicious_names = {'nc', 'netcat', 'socat', 'ncat'}
    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                info = proc.info
                name = (info.get('name') or "").lower()
                pid = info.get('pid')
                # fallback to cmdline if name missing
                if not name:
                    cmdline = info.get('cmdline') or []
                    if cmdline:
                        name = os.path.basename(cmdline[0]).lower()
                if name in suspicious_names and pid not in seen_pids:
                    cmdline = ' '.join(info.get('cmdline') or [])
                    print(f"[*] ALERT: Netcat-like detected: {name} (PID: {pid}) cmdline: {cmdline}")
                    send_alert({
                        "host": host(),
                        "alertType": "NetcatExecution",
                        "score": 0.92,
                        "mitreTactic": "TA0011",
                        "evidence": f"Detected '{name}' execution: {cmdline}",
                        "topRuleHits": ["Netcat Utility Execution"],
                        "topFeatures": [f"process:{name}", f"cmdline:{cmdline}"],
                    })
                    seen_pids.add(pid)
            if len(seen_pids) > 2000:
                seen_pids.clear()
        except Exception as e:
            print(f"[!] Error in netcat watcher: {e}")
            traceback.print_exc()
        time.sleep(2)

def watch_short_tcp_connections():
    """Detect repeated short TCP sessions (small-chunk exfil)."""
    print("[+] Starting short TCP connection watcher...")
    prev_set = set()
    conn_first_seen = {}
    recent_short = defaultdict(lambda: deque())
    while True:
        try:
            conns = []
            try:
                conns = psutil.net_connections(kind='tcp')
            except Exception as e:
                # psutil may require extra privileges; warn and skip this cycle
                print(f"[!] psutil.net_connections error (need root?): {e}")
                time.sleep(2)
                continue

            current = set()
            now = time.time()
            for c in conns:
                # avoid missing attributes
                try:
                    if not c.raddr:
                        continue
                    laddr_ip = getattr(c.laddr, 'ip', None) or (c.laddr[0] if isinstance(c.laddr, tuple) and len(c.laddr) > 0 else None)
                    raddr_ip = getattr(c.raddr, 'ip', None) or (c.raddr[0] if isinstance(c.raddr, tuple) and len(c.raddr) > 0 else None)
                    pid = getattr(c, 'pid', None)
                    if not laddr_ip or not raddr_ip:
                        continue
                    key = (laddr_ip, raddr_ip, pid)
                    current.add(key)
                    if key not in conn_first_seen:
                        conn_first_seen[key] = now
                except Exception:
                    continue

            closed = prev_set - current
            for key in closed:
                start = conn_first_seen.pop(key, now)
                duration = now - start
                _, r_ip, _ = key
                if not r_ip:
                    continue
                if r_ip.startswith(('127.', '10.', '192.168.', '172.')):
                    continue
                if duration < SHORT_TCP_SECONDS:
                    dq = recent_short[r_ip]
                    dq.append(now)
                    while dq and now - dq[0] > SHORT_TCP_WINDOW:
                        dq.popleft()
                    if len(dq) >= SHORT_TCP_REPEAT_THRESHOLD:
                        evidence = f"{len(dq)} short TCP connections to {r_ip} in {SHORT_TCP_WINDOW}s"
                        print(f"[*] ALERT: {evidence}")
                        send_alert({
                            "host": host(),
                            "alertType": "ShortTcpConnectionBurst",
                            "score": 0.78,
                            "mitreTactic": "TA0011",
                            "dstIp": r_ip,
                            "evidence": evidence,
                            "topRuleHits": ["Repeated short TCP connections"],
                            "topFeatures": [f"remote:{r_ip}", f"count:{len(dq)}"],
                        })
                        recent_short[r_ip].clear()
            prev_set = current
        except Exception as e:
            print(f"[!] Error in short-tcp watcher: {e}")
            traceback.print_exc()
        time.sleep(2)

# Additional watcher placeholders (implement similarly, with robust logging)
# def watch_port_scans(): ...
# def watch_outbound_traffic_for_exfil(): ...
# ...

# ===============================
# Main
if __name__ == "__main__":
    print("\n--- Starting APT Detection Agent ---")
    if BEARER_TOKEN in ("", "your_secret_token_here", None):
        print("\n[CRITICAL] SECURITY WARNING: Please update BEARER_TOKEN!\n")

    # baseline SUID scan
    try:
        suid_baseline = baseline_suid_files()
        print(f"[*] SUID baseline contains {len(suid_baseline)} entries")
    except Exception as e:
        print(f"[!] Failed to compute SUID baseline: {e}")

    # health check to make debugging easier
    try:
        check_dashboard_health()
    except Exception as e:
        print(f"[!] Dashboard health check raised: {e}")

    # start watchers
    Thread(target=watch_staging_directory, daemon=True).start()
    Thread(target=watch_suspicious_processes, daemon=True).start()
    Thread(target=watch_netcat_processes, daemon=True).start()
    Thread(target=watch_short_tcp_connections, daemon=True).start()

    print("--- Agent is running. Monitoring for threats. ---")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[!] Agent stopped by user.")
