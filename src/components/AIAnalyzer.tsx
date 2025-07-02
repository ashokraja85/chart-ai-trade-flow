
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, TrendingUp, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface AIAnalysisResult {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  recommendation: 'buy' | 'sell' | 'hold';
  patterns: string[];
  supportLevels: number[];
  resistanceLevels: number[];
  entry: number | null;
  target: number | null;
  stopLoss: number | null;
  summary: string;
  insights: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface AIAnalyzerProps {
  symbol?: string;
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
}

export const AIAnalyzer = ({ symbol = "NIFTY", onAnalysisComplete }: AIAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const { toast } = useToast();

  const captureChart = async (): Promise<string | null> => {
    try {
      // Find the chart container - try multiple selectors
      const chartElement = document.querySelector('[data-chart]') || 
                          document.querySelector('.recharts-wrapper') ||
                          document.querySelector('.chart-container') ||
                          document.querySelector('[class*="chart"]');
      
      if (!chartElement) {
        // Fallback: capture the entire main content area
        const mainContent = document.querySelector('main') || 
                          document.querySelector('.container') || 
                          document.body;
        
        if (!mainContent) {
          throw new Error('No chart element found to capture');
        }
        
        const canvas = await html2canvas(mainContent as HTMLElement, {
          backgroundColor: '#0f172a', // slate-900 background
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
        });
        
        return canvas.toDataURL('image/png');
      }

      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      throw new Error('Failed to capture chart screenshot');
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      toast({
        title: "📸 Capturing Chart",
        description: "Taking screenshot of the chart...",
      });

      // Capture the chart
      const imageData = await captureChart();
      
      if (!imageData) {
        throw new Error('Failed to capture chart image');
      }

      toast({
        title: "🤖 Analyzing Chart",
        description: "AI is analyzing the chart patterns...",
      });

      // Call the AI analyzer function
      const { data, error } = await supabase.functions.invoke('ai-chart-analyzer', {
        body: {
          imageData,
          symbol,
          timeframe: '1D', // Could be dynamic based on current timeframe
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'trading_dashboard'
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'AI analysis failed');
      }

      if (!data.success || !data.analysis) {
        throw new Error('Invalid response from AI analyzer');
      }

      const analysisResult = data.analysis as AIAnalysisResult;
      setAnalysis(analysisResult);
      onAnalysisComplete?.(analysisResult);

      toast({
        title: "✅ Analysis Complete",
        description: `${analysisResult.trend.toUpperCase()} signal detected with ${analysisResult.confidence}% confidence`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "❌ Analysis Failed",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="h-5 w-5" />
          AI Chart Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Chart...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Screenshot & Analyze
            </>
          )}
        </Button>

        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`text-white ${
                analysis.trend === 'bullish' ? 'bg-green-600' : 
                analysis.trend === 'bearish' ? 'bg-red-600' : 'bg-yellow-600'
              }`}>
                {analysis.trend === 'bullish' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                 analysis.trend === 'bearish' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                 <AlertCircle className="h-3 w-3 mr-1" />}
                {analysis.trend.toUpperCase()}
              </Badge>
              <span className="text-sm text-slate-400">Confidence: {analysis.confidence}%</span>
              <Badge variant="outline" className={`text-xs ${
                analysis.riskLevel === 'low' ? 'border-green-500 text-green-400' :
                analysis.riskLevel === 'high' ? 'border-red-500 text-red-400' :
                'border-yellow-500 text-yellow-400'
              }`}>
                {analysis.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>

            {analysis.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Key Insights:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {analysis.insights.slice(0, 4).map((insight, index) => (
                    <li key={index}>• {insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.patterns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Detected Patterns:</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.patterns.map((pattern, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Trading Recommendation</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-300">{analysis.summary}</p>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Recommendation:</span>
                    <span className={`ml-1 font-medium ${
                      analysis.recommendation === 'buy' ? 'text-green-400' :
                      analysis.recommendation === 'sell' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {analysis.recommendation.toUpperCase()}
                    </span>
                  </div>
                  
                  {analysis.entry && (
                    <div>
                      <span className="text-slate-400">Entry:</span>
                      <span className="ml-1 text-white">₹{analysis.entry}</span>
                    </div>
                  )}
                  
                  {analysis.target && (
                    <div>
                      <span className="text-slate-400">Target:</span>
                      <span className="ml-1 text-green-400">₹{analysis.target}</span>
                    </div>
                  )}
                  
                  {analysis.stopLoss && (
                    <div>
                      <span className="text-slate-400">Stop Loss:</span>
                      <span className="ml-1 text-red-400">₹{analysis.stopLoss}</span>
                    </div>
                  )}
                </div>

                {(analysis.supportLevels.length > 0 || analysis.resistanceLevels.length > 0) && (
                  <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-600">
                    {analysis.supportLevels.length > 0 && (
                      <div>
                        <span className="text-slate-400">Support:</span>
                        <span className="ml-1 text-green-400">
                          ₹{analysis.supportLevels.slice(0, 2).join(', ₹')}
                        </span>
                      </div>
                    )}
                    
                    {analysis.resistanceLevels.length > 0 && (
                      <div>
                        <span className="text-slate-400">Resistance:</span>
                        <span className="ml-1 text-red-400">
                          ₹{analysis.resistanceLevels.slice(0, 2).join(', ₹')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Analysis generated using GPT-4o Vision • Just now
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
