import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Camera, 
  Settings, 
  Brain, 
  TrendingUp, 
  Target, 
  Shield,
  Loader2,
  History,
  Zap
} from "lucide-react";
import { useEnhancedAI } from "@/hooks/useEnhancedAI";
import { useMarketData } from "@/hooks/useMarketData";
import { useZerodhaAuth } from "@/hooks/useZerodhaAuth";
import { useToast } from "@/hooks/use-toast";
import { MarketContext } from "@/lib/promptEngine";
import html2canvas from "html2canvas";

interface EnhancedAIAnalyzerProps {
  symbol?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export const EnhancedAIAnalyzer = ({ 
  symbol = "NIFTY", 
  onAnalysisComplete 
}: EnhancedAIAnalyzerProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto');
  const [analysisType, setAnalysisType] = useState<'basic' | 'enhanced'>('enhanced');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  
  const {
    analysisHistory,
    userContext,
    loading,
    analyzeWithContext,
    getContextualInsights,
    updateUserPreferences,
    availableTemplates
  } = useEnhancedAI();
  
  const { accessToken } = useZerodhaAuth();
  const { toast } = useToast();
  
  // Get market data for context
  const { data: quoteData } = useMarketData({
    symbol,
    dataType: 'quote',
    accessToken,
    refreshInterval: 30000
  });

  const captureChart = async (): Promise<string | null> => {
    try {
      const chartElement = document.querySelector('[data-chart]') || 
                          document.querySelector('.recharts-wrapper') ||
                          document.querySelector('.chart-container') ||
                          document.querySelector('[class*="chart"]');
      
      const targetElement = chartElement || 
                           document.querySelector('main') || 
                           document.querySelector('.container');
      
      if (!targetElement) {
        throw new Error('No suitable element found for screenshot');
      }
      
      const canvas = await html2canvas(targetElement as HTMLElement, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: Math.min(1920, targetElement.clientWidth),
        height: Math.min(1080, targetElement.clientHeight)
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      throw new Error('Failed to capture screenshot');
    }
  };

  const buildMarketContext = (): MarketContext => {
    return {
      symbol,
      instrumentType: symbol.includes('NIFTY') || symbol.includes('BANKNIFTY') ? 'FUTURE' : 'EQUITY',
      currentPrice: quoteData?.last_price || 0,
      marketCondition: quoteData?.change >= 0 ? 'bullish' : 'bearish',
      volatility: Math.abs(quoteData?.change_percent || 0),
      volume: quoteData?.volume || 0,
      timeframe: '1D',
      technicalIndicators: {
        // Add any available technical indicators
        rsi: undefined,
        macd: undefined,
        sma_50: undefined,
        sma_200: undefined
      }
    };
  };

  const handleEnhancedAnalysis = async () => {
    try {
      toast({
        title: "🎯 Enhanced AI Analysis",
        description: "Preparing contextual analysis with advanced reasoning...",
      });

      const imageData = await captureChart();
      if (!imageData) throw new Error('Failed to capture chart');

      const marketContext = buildMarketContext();
      
      const result = await analyzeWithContext(
        imageData,
        marketContext,
        selectedTemplate === 'auto' ? undefined : selectedTemplate
      );

      if (result.success) {
        setCurrentAnalysis(result.analysis);
        onAnalysisComplete?.(result.analysis);
        
        toast({
          title: "✅ Enhanced Analysis Complete",
          description: `Context-aware analysis with ${result.analysis.confidence}% confidence`,
        });
      }
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      toast({
        title: "❌ Enhanced Analysis Failed",
        description: error instanceof Error ? error.message : 'Analysis failed',
        variant: "destructive",
      });
    }
  };

  const contextualInsights = getContextualInsights(symbol);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          Enhanced AI Analyzer
          <Badge className="bg-purple-600 text-white text-xs">GPT-4.1</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analyze" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="analyze" className="text-white">
              <Camera className="h-4 w-4 mr-2" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            {/* Context Insights */}
            {contextualInsights.length > 0 && (
              <div className="bg-slate-700 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Context Insights</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {contextualInsights.map((insight, i) => (
                    <li key={i}>• {insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Analysis Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🎯 Auto-Select (Recommended)</SelectItem>
                  {availableTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.category === 'chart_analysis' && '📊 '}
                      {template.category === 'risk_assessment' && '🛡️ '}
                      {template.category === 'pattern_recognition' && '🔍 '}
                      {template.category === 'market_sentiment' && '📈 '}
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Analysis Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={handleEnhancedAnalysis}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Enhanced Analysis
                  </>
                )}
              </Button>
            </div>

            {/* Current Market Context */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-700 p-3 rounded-lg">
              <div>
                <span className="text-slate-400">Current Price:</span>
                <span className="ml-1 text-white">₹{quoteData?.last_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="text-slate-400">Change:</span>
                <span className={`ml-1 ${(quoteData?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {quoteData?.change_percent?.toFixed(2) || '0.00'}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">User Level:</span>
                <span className="ml-1 text-white capitalize">{userContext.experience}</span>
              </div>
              <div>
                <span className="text-slate-400">Risk Profile:</span>
                <span className="ml-1 text-white capitalize">{userContext.riskTolerance}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">Experience Level</label>
                <Select 
                  value={userContext.experience} 
                  onValueChange={(value: any) => updateUserPreferences({ 
                    detailLevel: value === 'beginner' ? 'brief' : value === 'advanced' ? 'comprehensive' : 'detailed' 
                  })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Beginner</SelectItem>
                    <SelectItem value="intermediate">📈 Intermediate</SelectItem>
                    <SelectItem value="advanced">🎯 Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white">Detail Level</label>
                <Select 
                  value={userContext.preferences.detailLevel} 
                  onValueChange={(value: any) => updateUserPreferences({ detailLevel: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">⚡ Brief</SelectItem>
                    <SelectItem value="detailed">📊 Detailed</SelectItem>
                    <SelectItem value="comprehensive">🔬 Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Recent Analyses</h4>
              {analysisHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No analysis history yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analysisHistory.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="bg-slate-700 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-white">{analysis.symbol}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(analysis.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{analysis.analysis_type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Analysis Results */}
        {currentAnalysis && !loading && (
          <div className="mt-6 space-y-4 border-t border-slate-600 pt-4">
            <div className="flex items-center gap-2">
              <Badge className={`text-white ${
                currentAnalysis.trend === 'bullish' ? 'bg-green-600' : 
                currentAnalysis.trend === 'bearish' ? 'bg-red-600' : 'bg-yellow-600'
              }`}>
                {currentAnalysis.trend === 'bullish' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                 currentAnalysis.trend === 'bearish' ? <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> :
                 <Target className="h-3 w-3 mr-1" />}
                {currentAnalysis.trend.toUpperCase()}
              </Badge>
              <span className="text-sm text-slate-400">
                {currentAnalysis.confidence}% confidence
              </span>
              <Badge variant="outline" className={`text-xs ${
                currentAnalysis.riskLevel === 'low' ? 'border-green-500 text-green-400' :
                currentAnalysis.riskLevel === 'high' ? 'border-red-500 text-red-400' :
                'border-yellow-500 text-yellow-400'
              }`}>
                <Shield className="h-3 w-3 mr-1" />
                {currentAnalysis.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">AI Summary</h4>
              <p className="text-sm text-slate-300 mb-3">{currentAnalysis.summary}</p>
              
              {currentAnalysis.userAdaptedAdvice && (
                <div className="bg-slate-600 p-3 rounded border-l-4 border-purple-500">
                  <p className="text-xs text-slate-300">
                    <strong>Personalized Advice:</strong> {currentAnalysis.userAdaptedAdvice}
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 text-center">
              Enhanced analysis • GPT-4.1 • Context-aware • Just now
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};