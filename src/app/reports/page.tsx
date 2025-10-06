
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Filter, Calendar } from 'lucide-react';

export default function ReportsPage() {

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view historical security reports.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Select Date Range
            </Button>
             <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter by Type
            </Button>
            <Button>
                Generate Report
            </Button>
        </div>
      </div>

       <Card className="flex flex-col items-center justify-center text-center h-[60vh]">
        <CardHeader>
           <div className="mx-auto bg-muted rounded-full p-4 w-fit">
             <FileText className="h-10 w-10 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4">No Reports Generated</CardTitle>
          <CardDescription>
            Use the controls above to generate a new security report.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button>Generate Your First Report</Button>
        </CardContent>
      </Card>
    </div>
  );
}
