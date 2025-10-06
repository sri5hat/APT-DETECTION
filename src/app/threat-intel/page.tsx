'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar, Users, FlaskConical } from 'lucide-react';
import { getThreatIntel } from '../actions/threat-intel';
import type { LookupThreatIntelOutput } from '@/ai/flows/lookup-threat-intel';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function ThreatIntelPage() {
  const [indicator, setIndicator] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupThreatIntelOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!indicator) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await getThreatIntel({ indicator });
      setResult(res);
    } catch (e) {
      setError('Failed to fetch threat intelligence. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Threat Intelligence Lookup</h1>
        <p className="text-muted-foreground">
          Enrich indicators of compromise (IOCs) using AI-powered threat
          intelligence.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indicator Search</CardTitle>
          <CardDescription>
            Enter an IP address, domain, or file hash to look up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., 185.220.101.35 or suspicious-domain.com"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
             <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Intel Report for{' '}
                <span className="font-mono text-primary">{indicator}</span>
              </CardTitle>
               <Badge variant={result.isMalicious ? 'destructive' : 'default'} className="text-sm">
                {result.isMalicious ? 'MALICIOUS' : 'NOT MALICIOUS'}
              </Badge>
            </div>
            <CardDescription>{result.reportSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Observation Period</h3>
                  <p className="text-muted-foreground">First Seen: {result.firstSeen}</p>
                  <p className="text-muted-foreground">Last Seen: {result.lastSeen}</p>
                </div>
              </div>
               <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Country of Origin</h3>
                  <p className="text-muted-foreground">{result.countryOfOrigin}</p>
                </div>
              </div>
                <div className="flex items-start gap-3">
                <Users className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Associated Campaigns</h3>
                   {result.associatedCampaigns.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {result.associatedCampaigns.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">None identified.</p>
                    )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold flex items-center gap-2"><FlaskConical className="h-5 w-5"/>Detailed Analysis</h3>
              <p className="mt-2 text-muted-foreground">{result.detailedAnalysis}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Known For</h3>
              {result.knownFor.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.knownFor.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific threat categories associated with this indicator.
                </p>
              )}
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
