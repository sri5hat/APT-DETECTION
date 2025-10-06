
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Incident, IncidentStatus } from '@/app/incidents/page';
import { ReactNode } from 'react';
import { GitBranch, User, Calendar, AlertTriangle } from 'lucide-react';
import { useClientValue } from '@/hooks/use-client-value';


interface IncidentDetailModalProps {
  incident: Incident;
  children: ReactNode;
}

export function IncidentDetailModal({ incident, children }: IncidentDetailModalProps) {
    const formattedDate = useClientValue(() => new Date(incident.lastActivity).toLocaleString(), '');
    
     const getStatusBadgeVariant = (status: IncidentStatus) => {
        switch (status) {
            case 'Open':
                return 'destructive';
            case 'Under Investigation':
                return 'secondary';
            case 'Closed':
                return 'default';
        }
    }


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Incident Details: {incident.id}</DialogTitle>
          <DialogDescription>
            {incident.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Status</p>
                        <Badge variant={getStatusBadgeVariant(incident.status)}>{incident.status}</Badge>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Assignee</p>
                        <p className="text-muted-foreground">{incident.assignee}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Last Activity</p>
                        <p className="text-muted-foreground">{formattedDate}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Alerts</p>
                        <p className="text-muted-foreground">{incident.alerts}</p>
                    </div>
                </div>
            </div>

            <Separator />

            <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{incident.description}</p>
            </div>

            <div>
                <h4 className="font-semibold mb-2">Related Alerts</h4>
                {incident.relatedAlerts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                    {incident.relatedAlerts.map(alertId => (
                        <Badge key={alertId} variant="outline">{alertId}</Badge>
                    ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No alerts have been linked to this incident.</p>
                )}
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
