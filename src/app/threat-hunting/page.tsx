
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ThreatHuntingPage() {

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Threat Hunting</h1>
          <p className="text-muted-foreground">
            Proactively search for threats and anomalies across your environment.
          </p>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Query Builder</CardTitle>
          <CardDescription>
            Construct a query using a structured search language to investigate security events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder='e.g., process.name = "powershell.exe" and network.direction = "outbound"'
            />
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
       </Card>

       <Card className="flex flex-col items-center justify-center text-center h-[50vh]">
        <CardHeader>
           <div className="mx-auto bg-muted rounded-full p-4 w-fit">
             <Search className="h-10 w-10 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4">No Search Results</CardTitle>
          <CardDescription>
            Your query results will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
