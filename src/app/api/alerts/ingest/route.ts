// This is a server-side file!
import { logEmitter } from '@/lib/log-emitter';
import { type Alert } from '@/lib/types';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const bearerToken = process.env.ALERT_INGESTION_TOKEN;

// Define a Zod schema for the incoming alert payload for validation.
// This ensures the data structure is correct.
const IngestAlertSchema = z.object({
    host: z.string(),
    alertType: z.enum([
        'DataExfiltration',
        'DNSExfiltration',
        'FileStaging',
        'NetworkAnomaly',
        'ProcessAnomaly',
        'LateralMovement',
        'Beaconing',
        'FileAccess',
    ]),
    score: z.number().min(0).max(1),
    mitreTactic: z.string().regex(/^TA\d{4}$/, 'Invalid MITRE Tactic ID'),
    srcIp: z.string(),
    dstIp: z.string(),
    evidence: z.string(),
    ruleBasedScore: z.number().min(0).max(1),
    anomalyDetectionScore: z.number().min(0).max(1),
    supervisedClassifierScore: z.number().min(0).max(1),
    topRuleHits: z.array(z.string()),
    topFeatures: z.array(z.string()),
});


export async function POST(request: Request) {
    // 1. Authenticate the request
    if (!bearerToken) {
        console.error("ALERT_INGESTION_TOKEN is not set on the server.");
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${bearerToken}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate the request body
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
    }

    const parseResult = IngestAlertSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json({ message: 'Invalid alert payload.', errors: parseResult.error.flatten() }, { status: 400 });
    }

    // 3. Create the full Alert object
    const newAlert: Alert = {
        ...parseResult.data,
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        time: new Date().toISOString(),
        status: 'New',
    };

    // 4. Emit the alert to all connected clients
    logEmitter.emit('alert', newAlert);

    // 5. Send a success response
    return NextResponse.json({ message: 'Alert ingested successfully.', alertId: newAlert.id }, { status: 202 });
}
