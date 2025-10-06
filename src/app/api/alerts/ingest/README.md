# Alert Ingestion API

This endpoint (`/api/alerts/ingest`) allows a trusted backend service to inject new alerts into the ExfilSense real-time dashboard.

## Authentication

To send alerts, you must provide a secret bearer token in the `Authorization` header.

`Authorization: Bearer YOUR_SECRET_TOKEN`

This token should be set in your project's `.env.local` file as `ALERT_INGESTION_TOKEN`.

## Method

`POST`

## Body

The request body should be a JSON object representing a single alert. The structure must match the `Alert` type defined in the application.

### Example Payload:

```json
{
  "host": "production-db-01",
  "alertType": "DataExfiltration",
  "score": 0.98,
  "mitreTactic": "Exfiltration",
  "srcIp": "10.1.1.5",
  "dstIp": "185.199.108.153",
  "evidence": "Large upload (50.2MB) to known file sharing site transfer.sh",
  "topRuleHits": ["Exfiltration to File Sharing Site", "Anomalous Data Transfer Size"],
  "topFeatures": ["dst_ip:185.199.108.153", "bytes_sent>50MB"],
  "ruleBasedScore": 0.9,
  "anomalyDetectionScore": 0.95,
  "supervisedClassifierScore": 0.99
}
```

**Note:** Fields like `id`, `time`, and `status` will be automatically added by the ingestion endpoint.

### Example cURL Request:

```bash
curl -X POST \
  http://localhost:9002/api/alerts/ingest \
  -H "Authorization: Bearer your_secret_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "real-backend-test",
    "alertType": "DataExfiltration",
    "score": 0.99,
    "mitreTactic": "Exfiltration",
    "srcIp": "192.168.1.100",
    "dstIp": "203.0.113.25",
    "evidence": "Real alert from custom backend!",
    "topRuleHits": ["Custom Backend Rule"],
    "topFeatures": ["backend:python"],
    "ruleBasedScore": 1,
    "anomalyDetectionScore": 1,
    "supervisedClassifierScore": 1
  }'
```
