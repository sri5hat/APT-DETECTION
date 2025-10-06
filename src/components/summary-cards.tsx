'use client';

import { useMemo } from 'react';
import {
  AlertCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Alert } from '@/lib/types';

interface SummaryCardsProps {
  alerts: Alert[];
}

export function SummaryCards({ alerts }: SummaryCardsProps) {
  const summary = useMemo(() => {
    const newAlerts = alerts.filter((a) => a.status === 'New').length;
    const investigating = alerts.filter(
      (a) => a.status === 'Investigating'
    ).length;
    const resolved = alerts.filter((a) => a.status === 'Resolved').length;
    const topScore = alerts.reduce((max, a) => (a.score > max ? a.score : max), 0);
    return { newAlerts, investigating, resolved, topScore };
  }, [alerts]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.newAlerts}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting investigation
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Investigating
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.investigating}</div>
          <p className="text-xs text-muted-foreground">
            Currently under review
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved Alerts</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.resolved}</div>
          <p className="text-xs text-muted-foreground">
            Closed and archived
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.topScore.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Top threat score detected
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
