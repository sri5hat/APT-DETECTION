'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Filter,
  ListFilter,
  PauseCircle,
  PlayCircle,
  Search,
  Upload,
} from 'lucide-react';

import { type Alert } from '@/lib/types';
import { initialAlerts } from '@/lib/alerts-data';
import { SummaryCards } from '@/components/summary-cards';
import { AlertsTable } from '@/components/alerts-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { TACTIC_NAMES } from '@/lib/mitre-data';

const MITRE_TACTICS = Object.keys(TACTIC_NAMES) as (keyof typeof TACTIC_NAMES)[];

const ALERT_TYPES = [
  'DataExfiltration',
  'DNSExfiltration',
  'FileStaging',
  'NetworkAnomaly',
  'ProcessAnomaly',
  'LateralMovement',
  'Beaconing',
  'FileAccess',
];

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isLive, setIsLive] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    score: number;
    tactics: string[];
    types: string[];
  }>({
    score: 0,
    tactics: [],
    types: [],
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Alert;
    direction: 'ascending' | 'descending';
  } | null>({ key: 'time', direction: 'descending' });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLive || !isMounted) {
      return;
    }

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
  }, [isLive, isMounted]);
  
  const handleFilterChange = useCallback((filterType: 'tactics' | 'types', value: string) => {
    setFilters((prev) => {
      const newValues = prev[filterType].includes(value)
        ? prev[filterType].filter((v) => v !== value)
        : [...prev[filterType], value];
      return { ...prev, [filterType]: newValues };
    });
  }, []);

  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts.filter(
      (alert) =>
        (alert.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.srcIp.includes(searchTerm) ||
          alert.dstIp.includes(searchTerm) ||
          alert.evidence.toLowerCase().includes(searchTerm.toLowerCase())) &&
        alert.score >= filters.score &&
        (filters.tactics.length === 0 ||
          filters.tactics.includes(alert.mitreTactic)) &&
        (filters.types.length === 0 || filters.types.includes(alert.alertType))
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [alerts, searchTerm, filters, sortConfig]);

  const requestSort = (key: keyof Alert) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const updateAlertStatus = (id: string, status: Alert['status']) => {
    setAlerts(alerts.map(a => a.id === id ? {...a, status} : a));
  };

  const handleExport = () => {
    const headers = Object.keys(filteredAndSortedAlerts[0]).join(',');
    const csv = [
      headers,
      ...filteredAndSortedAlerts.map(row => 
        Object.values(row).map(value => 
          `"${Array.isArray(value) ? value.join(';') : String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `exfilsense_alerts_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">ExfilSense Dashboard</h1>
          <p className="text-muted-foreground">
            Live APT threat detection and analysis.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="w-[100px]"
          >
            {isLive ? (
              <PauseCircle className="mr-2 h-4 w-4" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredAndSortedAlerts.length === 0}>
            <Upload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      <SummaryCards alerts={alerts} />
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="relative w-full md:w-auto md:flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by host, IP, evidence..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by MITRE Tactic</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {MITRE_TACTICS.map((tactic) => (
                  <DropdownMenuCheckboxItem
                    key={tactic}
                    checked={filters.tactics.includes(tactic)}
                    onCheckedChange={() => handleFilterChange('tactics', tactic)}
                  >
                    {TACTIC_NAMES[tactic]}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Alert Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {ALERT_TYPES.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filters.types.includes(type)}
                    onCheckedChange={() => handleFilterChange('types', type)}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Separator />
        <AlertsTable
          alerts={filteredAndSortedAlerts}
          sortConfig={sortConfig}
          requestSort={requestSort}
          updateAlertStatus={updateAlertStatus}
        />
      </div>
    </div>
  );
}
