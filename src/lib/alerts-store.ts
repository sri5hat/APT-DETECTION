import { type Alert } from './types';

// Simple in-memory alert store for development/demo.
// Not persisted — suitable for local dev only.
const STORE_LIMIT = 500;
const alerts: Alert[] = [];

export function addAlert(alert: Alert) {
  alerts.unshift(alert);
  if (alerts.length > STORE_LIMIT) alerts.splice(STORE_LIMIT);
}

export function getAlerts(limit = 100): Alert[] {
  return alerts.slice(0, limit);
}
