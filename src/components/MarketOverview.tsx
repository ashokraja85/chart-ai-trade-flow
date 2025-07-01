
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";

export const MarketOverview = () => {
  const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS'];
  
  const MarketCard = ({ symbol }: { symbol: string }) => {
    const { data, loading, error } = useMarketData({
      symbol,
      dataType: 'quote',
      refreshInterval: 3000
    });

    const getDisplayName = (sym: string) => {
      switch(sym) {
        case 'NIFTY': return 'NIFTY 50';
        case 'BANKNIFTY': return 'BANK NIFTY';
        case 'RELIANCE': return 'RELIANCE';
        case 'TCS': return 'TCS';
        default: return sym;
      }
    };

    if (loading && !data) {
      return (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error && !data) {
      return (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-sm font-medium text-slate-300">{getDisplayName(symbol)}</h3>
              <p className="text-xs text-red-400 mt-2">Error loading data</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const isPositive = (data?.change || 0) >= 0;
    const changePercent = data?.change_percent || ((data?.change || 0) / (data?.ohlc?.open || 1) * 100);

    return (
      <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">{getDisplayName(symbol)}</h3>
            <div className="flex items-center gap-1">
              {loading && <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />}
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-white">
              ₹{data?.last_price?.toLocaleString() || 'N/A'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}₹{data?.change?.toFixed(2) || '0.00'}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  isPositive 
                    ? 'bg-green-900 text-green-300 border-green-700' 
                    : 'bg-red-900 text-red-300 border-red-700'
                }`}
              >
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {symbols.map((symbol) => (
        <MarketCard key={symbol} symbol={symbol} />
      ))}
    </div>
  );
};
