
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getExplanation } from '@/app/actions/scoring';
import { Button } from './ui/button';
import { Bot, Lightbulb } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';

interface ScoreExplainerProps {
  alert: Alert;
}

export function ScoreExplainer({ alert }: ScoreExplainerProps) {
  const [weights, setWeights] = useState({
    ruleBasedWeight: 0.5,
    anomalyDetectionWeight: 0.3,
    supervisedClassifierWeight: 0.2,
  });
  const [compositeScore, setCompositeScore] = useState(alert.score);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

   const handleWeightChange = (changedSlider: keyof typeof weights, value: number[]) => {
    const newWeight = value[0];
    const oldWeights = { ...weights };
    const remainingWeight = 1 - newWeight;

    // The other sliders that were not changed
    const otherSliders = (Object.keys(oldWeights) as Array<keyof typeof weights>).filter(
      (k) => k !== changedSlider
    );

    // Current sum of the other sliders
    let otherSlidersSum = otherSliders.reduce((sum, key) => sum + oldWeights[key], 0);

    // If the sum is zero, distribute remaining weight equally
    if (otherSlidersSum === 0) {
      const distributedWeight = remainingWeight / otherSliders.length;
      setWeights({
        ...oldWeights,
        [changedSlider]: newWeight,
        ...Object.fromEntries(otherSliders.map(key => [key, distributedWeight]))
      });
      return;
    }

    // Proportional scaling factor
    const factor = remainingWeight / otherSlidersSum;

    setWeights({
      ...oldWeights,
      [changedSlider]: newWeight,
      ...Object.fromEntries(otherSliders.map(key => [key, oldWeights[key] * factor]))
    });
  };


  useEffect(() => {
    // Recalculate score locally whenever weights or alert scores change
    const newCompositeScore =
      weights.ruleBasedWeight * alert.ruleBasedScore +
      weights.anomalyDetectionWeight * alert.anomalyDetectionScore +
      weights.supervisedClassifierWeight * alert.supervisedClassifierScore;
    
    const normalizedCompositeScore = Math.min(1, Math.max(0, newCompositeScore));
    setCompositeScore(normalizedCompositeScore);
    // Clear previous explanation when weights change
    setExplanation(null);
  }, [weights, alert]);

  const handleExplainScore = async () => {
    setIsGenerating(true);
    setExplanation(null);
    try {
      const result = await getExplanation({
        ruleBasedScore: alert.ruleBasedScore,
        anomalyDetectionScore: alert.anomalyDetectionScore,
        supervisedClassifierScore: alert.supervisedClassifierScore,
        ruleBasedWeight: weights.ruleBasedWeight,
        anomalyDetectionWeight: weights.anomalyDetectionWeight,
        supervisedClassifierWeight: weights.supervisedClassifierWeight,
        topRuleHits: alert.topRuleHits,
        topFeatures: alert.topFeatures,
      });
      setCompositeScore(result.compositeScore);
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Failed to get explanation", error);
      setExplanation("Could not generate an AI explanation for this score configuration.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div className="space-y-4">
        <h3 className="text-md font-semibold">Score Contribution Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Adjust the weights of the detection models to see how they affect the composite score and generate an AI-powered explanation.
        </p>
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="rule-slider">Rule-Based Heuristics</Label>
              <span className="font-mono text-sm">{weights.ruleBasedWeight.toFixed(2)}</span>
            </div>
            <Slider
              id="rule-slider"
              min={0}
              max={1}
              step={0.05}
              value={[weights.ruleBasedWeight]}
              onValueChange={(v) => handleWeightChange('ruleBasedWeight', v)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="anomaly-slider">Anomaly Detection (UCL)</Label>
               <span className="font-mono text-sm">{weights.anomalyDetectionWeight.toFixed(2)}</span>
            </div>
            <Slider
              id="anomaly-slider"
              min={0}
              max={1}
              step={0.05}
              value={[weights.anomalyDetectionWeight]}
              onValueChange={(v) => handleWeightChange('anomalyDetectionWeight', v)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="classifier-slider">Supervised Classifier</Label>
               <span className="font-mono text-sm">{weights.supervisedClassifierWeight.toFixed(2)}</span>
            </div>
            <Slider
              id="classifier-slider"
              min={0}
              max={1}
              step={0.05}
              value={[weights.supervisedClassifierWeight]}
              onValueChange={(v) => handleWeightChange('supervisedClassifierWeight', v)}
            />
          </div>
           <Button onClick={handleExplainScore} disabled={isGenerating} className="w-full">
            <Bot className="mr-2 h-4 w-4" />
            {isGenerating ? 'Analyzing...' : 'Explain This Score'}
          </Button>
        </div>
      </div>
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Simulated Composite Score</CardTitle>
           <CardDescription>
            The recalculated score and AI explanation based on your adjustments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-primary">{(compositeScore * 100).toFixed(1)}</p>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <p className="text-sm text-foreground italic h-4">Original alert score was {alert.score.toFixed(2)}.</p>
          </div>
          {(isGenerating || explanation) && <Separator />}
           {isGenerating && (
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            )}
          {explanation && (
            <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary"/> AI Explanation</h4>
                <p className="text-sm text-muted-foreground">{explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
