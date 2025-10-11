
'use client';

import { ArrowDown, ArrowUp, ExternalLink } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDetailModal } from '@/components/alert-detail-modal';
import { type Alert } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useEffect, useState } from 'react';
import { TACTIC_NAMES } from '@/lib/mitre-data';


interface AlertsTableProps {
  alerts: Alert[];
  sortConfig: { key: keyof Alert; direction: 'ascending' | 'descending' } | null;
  requestSort: (key: keyof Alert) => void;
  updateAlertStatus: (id: string, status: Alert['status']) => void;
}

export function AlertsTable({
  alerts,
  sortConfig,
  requestSort,
  updateAlertStatus,
}: AlertsTableProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getSortIcon = (key: keyof Alert) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const getScoreBadgeVariant = (
    score: number
  ): 'destructive' | 'secondary' | 'default' => {
    if (score > 0.85) return 'destructive';
    if (score > 0.6) return 'secondary';
    return 'default';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort('time')}
            >
              <span className="flex items-center">
                Time {getSortIcon('time')}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort('host')}
            >
              <span className="flex items-center">
                Host {getSortIcon('host')}
              </span>
            </TableHead>
            <TableHead>Alert Type</TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort('score')}
            >
              <span className="flex items-center">
                Score {getSortIcon('score')}
              </span>
            </TableHead>
            <TableHead>MITRE Tactic</TableHead>
            <TableHead>Src IP</TableHead>
            <TableHead>Dst IP</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert, idx) => (
            <TableRow key={alert.id ?? `${alert.host ?? 'h'}-${alert.time ?? idx}-${idx}`}>
              {/** normalize score to avoid runtime errors when undefined */}
              {(() => {
                const scoreNum = typeof alert.score === 'number' ? alert.score : 0;
                // attach to row via data-attribute not necessary; use constants below
                return null;
              })()}
              <TableCell className="whitespace-nowrap">
                {isClient ? new Date(alert.time).toLocaleString() : ''}
              </TableCell>
              <TableCell className="font-medium">{alert.host}</TableCell>
              <TableCell>
                <Badge variant="outline">{alert.alertType}</Badge>
              </TableCell>
              <TableCell>
                {(() => {
                  const scoreNum = typeof alert.score === 'number' ? alert.score : 0;
                  const scoreDisplay = typeof alert.score === 'number' ? alert.score.toFixed(2) : '—';
                  return (
                    <Badge variant={getScoreBadgeVariant(scoreNum)}>
                      {scoreDisplay}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell>
                 <a
                  href={`https://attack.mitre.org/tactics/${alert.mitreTactic}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {TACTIC_NAMES[alert.mitreTactic as keyof typeof TACTIC_NAMES] || alert.mitreTactic}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
              <TableCell>{alert.srcIp}</TableCell>
              <TableCell>{alert.dstIp}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {alert.evidence}
              </TableCell>
              <TableCell>
                <Select
                  value={alert.status}
                  onValueChange={(value: Alert['status']) =>
                    updateAlertStatus(alert.id, value)
                  }
                >
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue placeholder="Set status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Investigating">Investigating</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <AlertDetailModal alert={alert} updateAlertStatus={updateAlertStatus}>
                  <Button variant="ghost" size="sm">
                    Details
                  </Button>
                </AlertDetailModal>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {alerts.length === 0 && (
          <div className="flex justify-center items-center py-10 text-muted-foreground">
            No alerts found.
          </div>
        )}
    </div>
  );
}
