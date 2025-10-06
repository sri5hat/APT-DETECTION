
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { type Alert } from '@/lib/types';
import { ScoreExplainer } from './score-explainer';
import { ReactNode, useEffect, useState } from 'react';
import { Download, Lightbulb, Bot, FileText, Activity } from 'lucide-react';
import { getIncidentReport } from '@/app/actions/report';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AlertDetailModalProps {
  alert: Alert;
  children: ReactNode;
  updateAlertStatus: (id: string, status: Alert['status']) => void;
}

// Simple markdown to HTML renderer
function Markdown({ content }: { content: string }) {
  const html = content
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/\n- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/`(.*?)`/gim, '<code class="bg-muted text-foreground font-mono text-sm px-1 py-0.5 rounded">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
    .replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: html }} className="prose prose-sm max-w-none" />;
}


export function AlertDetailModal({ alert, children, updateAlertStatus }: AlertDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [justification, setJustification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleGenerateReport();
    } else {
      // Reset state when modal is closed
      setReport(null);
      setJustification(null);
      setIsGeneratingReport(false);
    }
  }, [isOpen]);
  
  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      setReport(null);
      setJustification(null);
      try {
        const { report, justification } = await getIncidentReport({ alert });
        setReport(report);
        setJustification(justification);
      } catch (error) {
        console.error("Failed to generate report:", error);
        setJustification("Could not generate an AI justification for this alert.");
        setReport("Failed to generate incident report.");
      } finally {
        setIsGeneratingReport(false);
      }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${alert.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Alert Details: {alert.id}</DialogTitle>
          <DialogDescription>
            Detailed analysis of the detected threat event from {alert.host}.
          </DialogDescription>
        </DialogHeader>

        {isGeneratingReport && (
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 px-1">
                    <Bot className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-muted-foreground">Generating AI analysis and incident report...</p>
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        )}

        {!isGeneratingReport && report && (
          <Tabs defaultValue="report" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="report"><FileText className="mr-2"/> Full Report</TabsTrigger>
              <TabsTrigger value="analyzer"><Activity className="mr-2"/>Score Analyzer</TabsTrigger>
            </TabsList>
            <TabsContent value="report">
              <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                         <CardTitle>AI Generated Incident Report</CardTitle>
                         <Button variant="secondary" size="sm" onClick={handleDownloadReport} disabled={!report}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Markdown
                        </Button>
                    </div>
                     <CardContent className="p-4 pt-2 border rounded-lg bg-background max-h-[50vh] overflow-y-auto">
                        <Markdown content={report} />
                     </CardContent>
                </CardHeader>
              </Card>
            </TabsContent>
            <TabsContent value="analyzer">
                <div className="p-1">
                    <ScoreExplainer alert={alert} />
                </div>
            </TabsContent>
          </Tabs>
        )}
        
        {!isGeneratingReport && (
            <DialogFooter className="sm:justify-between mt-4">
                <div>
                     <h3 className="text-md font-semibold mb-2">Analyst Notes</h3>
                     <Textarea placeholder="Add investigation notes here..." rows={2} />
                </div>
                <div className="flex gap-2 items-end">
                    <Button variant="outline" onClick={() => { updateAlertStatus(alert.id, 'Investigating'); setIsOpen(false); }}>Mark as Investigating</Button>
                    <Button onClick={() => { updateAlertStatus(alert.id, 'Resolved'); setIsOpen(false); }}>Resolve Alert</Button>
                </div>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
