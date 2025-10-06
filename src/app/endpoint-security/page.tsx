
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Server, ShieldCheck, AlertTriangle, Cpu, Clock, ScanLine, WifiOff } from 'lucide-react';
import { useClientValue } from '@/hooks/use-client-value';
import { useToast } from '@/hooks/use-toast';

interface Endpoint {
    name: string;
    ip: string;
    os: string;
    status: 'Healthy' | 'At Risk' | 'Offline';
    totalAlerts: number;
    lastCheckIn: string;
}

const endpoints: Endpoint[] = [
    {
        name: 'Strive-Linux',
        ip: '10.214.252.84',
        os: 'Ubuntu 22.04 LTS',
        status: 'Healthy',
        totalAlerts: 18,
        lastCheckIn: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
    },
    {
        name: 'Mano-Linux-Debian',
        ip: '10.214.252.85',
        os: 'Debian 12',
        status: 'At Risk',
        totalAlerts: 32,
        lastCheckIn: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
    const formattedDate = useClientValue(() => new Date(endpoint.lastCheckIn).toLocaleString(), '');
    const router = useRouter();
    const { toast } = useToast();

    const getStatusBadgeVariant = (status: Endpoint['status']) => {
        switch (status) {
            case 'Healthy':
                return 'default';
            case 'At Risk':
                return 'destructive';
            case 'Offline':
                return 'secondary';
        }
    }
     const getStatusIcon = (status: Endpoint['status']) => {
        switch (status) {
            case 'Healthy':
                return <ShieldCheck className="h-5 w-5 text-green-500" />;
            case 'At Risk':
                return <AlertTriangle className="h-5 w-5 text-destructive" />;
            case 'Offline':
                return <Server className="h-5 w-5 text-muted-foreground" />;
        }
    }

    const handleViewAlerts = () => {
        router.push(`/?search=${endpoint.name}`);
    }

    const handleRunScan = () => {
        toast({
            title: 'Scan Initiated',
            description: `A security scan has been initiated on ${endpoint.name}.`,
        });
    }

    const handleIsolate = () => {
        toast({
            title: 'Isolation In Progress',
            description: `${endpoint.name} is being isolated from the network.`,
            variant: 'destructive',
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Server className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>{endpoint.name}</CardTitle>
                            <CardDescription className="font-mono">{endpoint.ip}</CardDescription>
                        </div>
                    </div>
                     <Badge variant={getStatusBadgeVariant(endpoint.status)} className="flex items-center gap-2">
                        {getStatusIcon(endpoint.status)}
                        <span>{endpoint.status}</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                        <Cpu className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Operating System</p>
                            <p className="text-muted-foreground">{endpoint.os}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Total Alerts</p>
                            <p className="text-muted-foreground">{endpoint.totalAlerts}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Last Check-in</p>
                            <p className="text-muted-foreground">{formattedDate || '...'}</p>
                        </div>
                    </div>
                 </div>

                <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleViewAlerts}>View Alerts</Button>
                    <Button size="sm" variant="outline" onClick={handleRunScan}>
                        <ScanLine className="mr-2 h-4 w-4" />
                        Run Scan
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button size="sm" variant="destructive" className="bg-destructive/80 hover:bg-destructive">
                                <WifiOff className="mr-2 h-4 w-4" />
                                Isolate Endpoint
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will isolate <span className="font-bold text-foreground">{endpoint.name}</span> from the network. It will lose all connectivity until manually restored. This should only be done if you suspect it is compromised.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleIsolate}>Confirm Isolation</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}

export default function EndpointSecurityPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Endpoint Security</h1>
          <p className="text-muted-foreground">
            Monitor and manage registered personal endpoints.
          </p>
        </div>
      </div>

       <div className="grid gap-6">
            {endpoints.map(endpoint => <EndpointCard key={endpoint.name} endpoint={endpoint} />)}
       </div>
    </div>
  );
}
