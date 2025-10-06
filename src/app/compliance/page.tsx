
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookCheck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompliancePage() {

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Compliance Center</h1>
          <p className="text-muted-foreground">
            Monitor and report on adherence to security frameworks.
          </p>
        </div>
         <div className="ml-auto flex items-center gap-2">
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
            </Button>
        </div>
      </div>

       <Card className="flex flex-col items-center justify-center text-center h-[60vh]">
        <CardHeader>
           <div className="mx-auto bg-muted rounded-full p-4 w-fit">
             <BookCheck className="h-10 w-10 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4">Compliance Dashboard</CardTitle>
          <CardDescription>
            This area will contain controls, evidence, and reporting for compliance frameworks like NIST, CIS, and PCI-DSS.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Feature coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
