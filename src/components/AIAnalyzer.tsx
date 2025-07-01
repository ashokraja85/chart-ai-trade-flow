
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export const AIAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(true);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalysis(true);
    }, 3000);
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
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Screenshot & Analyze
            </>
          )}
        </Button>

        {hasAnalysis && !isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                BULLISH
              </Badge>
              <span className="text-sm text-slate-400">Confidence: 78%</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Key Insights:</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Strong upward momentum detected</li>
                <li>• RSI approaching overbought zone</li>
                <li>• Volume spike indicates institutional interest</li>
                <li>• Support level at 19,650</li>
              </ul>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">Recommendation</span>
              </div>
              <p className="text-sm text-slate-300">
                Consider buying on dips near 19,650 support. Target: 19,750-19,800. 
                Stop loss: 19,600.
              </p>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Analysis generated using GPT-4 Vision • 2 minutes ago
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
