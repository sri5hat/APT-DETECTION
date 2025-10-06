
import { type Alert, type AlertType, type MitreTactic } from '@/lib/types';
import { logEmitter } from '@/lib/log-emitter';

const hosts = ['Strive-Linux', 'Mano-Linux-Debian', 'WEB-SERVER-03', 'DEV-STATION-11', 'DB-SERVER-01'];
const hostIps: {[key: string]: string} = {
    'Strive-Linux': '10.214.252.84',
    'Mano-Linux-Debian': '10.214.252.85',
    'WEB-SERVER-03': '10.10.1.5',
    'DEV-STATION-11': '10.0.0.14',
    'DB-SERVER-01': '10.0.0.8',
};
const users = ['jdoe', 'admin', 'svc_account', 'guest', 'dsmith'];
const processes = ['powershell.exe', 'cmd.exe', 'svchost.exe', 'WINWORD.EXE', 'curl.exe', 'sshd', 'nmap', 'mimikatz.exe'];
const externalIps = ['8.8.8.8', '1.1.1.1', '208.67.222.222', '198.51.100.55'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Data Exfiltration Scenario ---
let scenarioStep = 0;
const scenarioHost = 'Mano-Linux-Debian';
const scenarioUser = 'dsmith';
const exfilDomain = 'transfer.sh';
const exfilIp = '185.199.108.153'; // Example IP for transfer.sh
const sensitiveFile = '/home/dsmith/documents/project_europa_brief.docx';
const stagingFile = `/tmp/archive.zip`;
const dnsExfilDomain = 'c2-server-blog.com';


const scenario = [
  // 1. Discovery: User accesses a sensitive file
  () => {
    emitLog(`[file] user=${scenarioUser} host=${scenarioHost} action=read path=${sensitiveFile}`, 'INFO');
  },
  // 2. Staging: A tool is used to compress the file
  () => {
    emitLog(`[process] user=${scenarioUser} host=${scenarioHost} process=zip ppid=bash cmdline="zip ${stagingFile} ${sensitiveFile}"`, 'WARNING');
    emitAlert({
      alertType: 'FileStaging',
      host: scenarioHost,
      srcIp: hostIps[scenarioHost],
      score: 0.78,
      mitreTactic: 'TA0009', // Collection
      evidence: `zip process used to create archive ${stagingFile}`,
      topRuleHits: ['Suspicious Compression Activity'],
      topFeatures: ['process:zip', 'cmdline:zip', `file_path:${stagingFile}`],
    });
  },
  // 3. Exfiltration via large upload
  () => {
    emitLog(`[net] src=${hostIps[scenarioHost]} dst=${exfilIp}:443 protocol=tcp bytes_sent=12582912`, 'CRITICAL');
    emitAlert({
      alertType: 'DataExfiltration',
      host: scenarioHost,
      srcIp: hostIps[scenarioHost],
      dstIp: exfilIp,
      score: 0.95,
      mitreTactic: 'TA0010', // Exfiltration
      evidence: `Large upload (12.5MB) to ${exfilDomain} (${exfilIp})`,
      topRuleHits: ['Exfiltration to File Sharing Site', 'Anomalous Data Transfer Size'],
      topFeatures: [`dst_ip:${exfilIp}`, 'bytes_sent>10MB', `domain:${exfilDomain}`],
    });
  },
  // 4. DNS Tunneling Exfiltration (more stealthy)
  () => {
    const encodedData = '4a6f686e20446f65207061796c6f6164'; // "some data payload"
    emitLog(`[dns] host=${scenarioHost} query=${encodedData}.${dnsExfilDomain} type=A`, 'WARNING');
     emitAlert({
      alertType: 'DNSExfiltration',
      host: scenarioHost,
      srcIp: hostIps[scenarioHost],
      score: 0.88,
      mitreTactic: 'TA0010', // Exfiltration
      evidence: `Anomalous DNS query pattern detected to ${dnsExfilDomain}`,
      topRuleHits: ['DNS Tunneling Heuristic', 'High-entropy Subdomain'],
      topFeatures: [`domain:${dnsExfilDomain}`, 'query_length>64', 'entropy_level:high'],
    });
  },
];

// --- Generic Log Filler ---
function createRandomLog(): string {
    const timestamp = new Date().toISOString();
    const host = getRandomElement(hosts.filter(h => h !== scenarioHost));
    const user = getRandomElement(users);
    
    const logType = Math.random();
    if (logType < 0.4) {
        return `${timestamp} [INFO] [dns] host=${host} query for google.com from ${hostIps[host]}`;
    } else if (logType < 0.6) {
        return `${timestamp} [INFO] [http] host=${host} user=${user} GET /index.html from ${getRandomElement(externalIps)}`;
    } else if (logType < 0.8) {
        return `${timestamp} [INFO] [auth] user=${user} host=${host} action=login_success src_ip=192.168.1.100`;
    } else if (logType < 0.9) {
        return `${timestamp} [WARNING] [auth] user=root host=${host} action=login_failed src_ip=103.44.22.11`;
    } else {
        return `${timestamp} [INFO] [firewall] host=corp-firewall-01 action=allow src=${hostIps[host]} dst=${getRandomElement(externalIps)} port=443`;
    }
}


function emitLog(log: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'system') {
    const timestamp = new Date().toISOString();
    const formattedLog = `${timestamp} [${severity}] ${log}`;
    logEmitter.emit('log', formattedLog);
}

function emitAlert(partialAlert: Partial<Alert>) {
    const randomHost = getRandomElement(Object.keys(hostIps));
    const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        time: new Date().toISOString(),
        host: 'unknown',
        alertType: 'NetworkAnomaly',
        score: 0.5,
        mitreTactic: 'TA0005', // Discovery
        srcIp: hostIps[randomHost],
        dstIp: `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
        evidence: 'N/A',
        status: 'New',
        ruleBasedScore: Math.random(),
        anomalyDetectionScore: Math.random(),
        supervisedClassifierScore: Math.random(),
        topRuleHits: [],
        topFeatures: [],
        ...partialAlert,
    };
    logEmitter.emit('alert', alert);
}


let logInterval: NodeJS.Timeout | null = null;
function startLogStream() {
    if (logInterval) return;

    let logCounter = 0;
    logInterval = setInterval(() => {
        // Every 15 logs, run a scenario step
        if (logCounter > 20 && logCounter % 15 === 0 && scenarioStep < scenario.length) {
            scenario[scenarioStep]();
            scenarioStep++;
        } else {
            // Reset scenario after a delay
            if (scenarioStep === scenario.length && logCounter % 40 === 0) {
                 scenarioStep = 0;
                 emitLog(`[system] Scenario reset. Waiting for next execution cycle.`, 'system');
            } else {
                logEmitter.emit('log', createRandomLog());
            }
        }
        logCounter++;

    }, 1500); // Send a new log every 1.5 seconds
}

function stopLogStream() {
    if (logInterval) {
        clearInterval(logInterval);
        logInterval = null;
    }
}


export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const handler = (log: string) => {
        const data = `data: ${log}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      logEmitter.on('log', handler);
      
      // Start the central log generation if it's not already running
      if (logEmitter.listenerCount('log') === 1) {
          startLogStream();
          emitLog('[system] Live log stream connected.', 'system');
      }

      // Clean up the interval when the client closes the connection
      controller.signal.addEventListener('abort', () => {
        logEmitter.off('log', handler);
        // If no clients are listening, stop the log generation
        if (logEmitter.listenerCount('log') === 0) {
            stopLogStream();
            console.log("[Stream] Client disconnected, stopping log stream.");
        }
        controller.close();
      });
    },
     cancel() {
        // This is called if the client aborts the connection.
        if (logEmitter.listenerCount('log') === 0) {
            stopLogStream();
            console.log("[Stream] Stream cancelled, stopping log stream.");
        }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// This is required to enable streaming responses on Vercel
export const dynamic = 'force-dynamic';
