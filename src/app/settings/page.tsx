
'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
            Manage application settings, user roles, and integrations.
        </p>
      </div>

       <Card className="flex flex-col items-center justify-center text-center h-[60vh]">
        <CardHeader>
           <div className="mx-auto bg-muted rounded-full p-4 w-fit">
             <Settings className="h-10 w-10 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4">Application Settings</CardTitle>
          <CardDescription>
            This area will be used to configure alert thresholds, manage API keys for integrations, and define user roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Feature coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
