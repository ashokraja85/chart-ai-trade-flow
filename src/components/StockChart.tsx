
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Camera } from "lucide-react";

interface StockChartProps {
  symbol: string;
}

export const StockChart = ({ symbol }: StockChartProps) => {
  const timeframes = ['5M', '15M', '1H', '1D', '1W'];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {symbol} Chart
        </CardTitle>
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant="outline"
              size="sm"
              className={`h-8 px-3 ${
                tf === '1D' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Placeholder for TradingView chart */}
        <div className="bg-slate-900 rounded-lg p-8 text-center border border-slate-700 min-h-[400px] flex items-center justify-center">
          <div className="text-slate-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">TradingView Chart Integration</p>
            <p className="text-sm">Real-time {symbol} price chart with indicators</p>
            <div className="mt-4 flex justify-center">
              <Button className="bg-green-600 hover:bg-green-700">
                <Camera className="h-4 w-4 mr-2" />
                Screenshot & Analyze
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">RSI</p>
            <p className="text-sm font-bold text-white">68.5</p>
          </div>
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">MACD</p>
            <p className="text-sm font-bold text-green-400">+12.4</p>
          </div>
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">Volume</p>
            <p className="text-sm font-bold text-white">2.1M</p>
          </div>
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">VWAP</p>
            <p className="text-sm font-bold text-blue-400">19,680</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
