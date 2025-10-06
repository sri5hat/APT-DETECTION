
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Alert, type AlertType } from '@/lib/types';
import { initialAlerts } from '@/lib/alerts-data';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TACTIC_NAMES } from '@/lib/mitre-data';


const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  destructive: 'hsl(var(--destructive))',
  secondary: 'hsl(var(--secondary-foreground))',
  muted: 'hsl(var(--muted-foreground))',
};

const SEVERITY_COLORS = {
  Low: 'hsl(var(--chart-2))',
  Medium: 'hsl(var(--chart-4))',
  High: 'hsl(var(--chart-1))',
};

export default function MetricsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const eventSource = new EventSource('/api/alerts/stream');
    eventSource.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
    };
    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  }, [isMounted]);

  const timeData = useMemo(() => {
    const data: { [key: string]: number } = {};
    alerts.forEach((alert) => {
      const hour = new Date(alert.time).toLocaleString(undefined, {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
      });
      data[hour] = (data[hour] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, alerts: value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [alerts]);

  const tacticData = useMemo(() => {
    const data: { [key: string]: number } = {};
    alerts.forEach((alert) => {
      const tacticName = TACTIC_NAMES[alert.mitreTactic as keyof typeof TACTIC_NAMES] || alert.mitreTactic;
      data[tacticName] = (data[tacticName] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, alerts: value }))
      .sort((a, b) => b.alerts - a.alerts);
  }, [alerts]);

  const alertTypeData = useMemo(() => {
    const data: { [key in AlertType]: number } = {
        DataExfiltration: 0,
        DNSExfiltration: 0,
        FileStaging: 0,
        NetworkAnomaly: 0,
        ProcessAnomaly: 0,
        LateralMovement: 0,
        Beaconing: 0,
        FileAccess: 0,
    };
    alerts.forEach((alert) => {
        data[alert.alertType] = (data[alert.alertType] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, alerts: value }))
      .sort((a, b) => b.alerts - a.alerts);
  }, [alerts]);


  const hostData = useMemo(() => {
    const data: { [key: string]: number } = {};
    alerts.forEach((alert) => {
      data[alert.host] = (data[alert.host] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, alerts: value }))
      .sort((a, b) => b.alerts - a.alerts)
      .slice(0, 10);
  }, [alerts]);

  const severityData = useMemo(() => {
    const data = { Low: 0, Medium: 0, High: 0 };
    alerts.forEach((alert) => {
      if (alert.score > 0.85) data.High++;
      else if (alert.score > 0.6) data.Medium++;
      else data.Low++;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [alerts]);
  
  if (!isMounted) {
    return null; // Don't render charts on the server
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Security Metrics</h1>
        <p className="text-muted-foreground">
          A high-level analytical overview of detected security events and emerging trends.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alerts Over Time</CardTitle>
            <CardDescription>
             Monitors the frequency of alerts to identify sudden spikes in activity or unusual patterns that may indicate a coordinated attack.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <LineChart data={timeData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  dataKey="alerts"
                  type="natural"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Severity</CardTitle>
            <CardDescription>
              Provides a quick overview of the threat landscape by categorizing alerts into High, Medium, and Low severity.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} cornerRadius={5} paddingAngle={2}>
                  {severityData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]}
                      className="stroke-background hover:opacity-80 focus:outline-none"
                    />
                  ))}
                </Pie>
                <Legend content={({ payload }) => (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-4">
                        {payload?.map((entry, index) => (
                            <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span>{entry.value}</span>
                            </div>
                        ))}
                    </div>
                )} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
         <Card>
          <CardHeader>
            <CardTitle>Top Alerted Hosts</CardTitle>
            <CardDescription>
             Highlights the machines generating the most alerts, helping to identify systems that are either primary targets or potentially compromised.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={hostData} layout="vertical" margin={{ left: 10, right: 10}}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  className="text-xs"
                  width={100}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="alerts" fill={CHART_COLORS.primary} radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MITRE ATT&amp;CK Tactic</CardTitle>
            <CardDescription>
              Visualizes the most common adversary tactics observed, providing insight into attacker goals and methodologies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={tacticData} layout="vertical" margin={{ left: 10, right: 10}}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  className="text-xs"
                   width={100}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="alerts" fill={CHART_COLORS.primary} radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Type Breakdown</CardTitle>
            <CardDescription>
              Breaks down alerts by their specific detection type, offering a granular view of the most frequent threat vectors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={alertTypeData} layout="vertical" margin={{ left: 10, right: 10}}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  className="text-xs"
                   width={100}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="alerts" fill={CHART_COLORS.primary} radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    