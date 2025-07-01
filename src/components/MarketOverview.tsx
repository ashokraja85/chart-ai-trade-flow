
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export const MarketOverview = () => {
  const marketData = [
    { symbol: "NIFTY 50", price: "19,674.25", change: "+124.85", changePercent: "+0.64%", isPositive: true },
    { symbol: "BANK NIFTY", price: "43,892.15", change: "-89.45", changePercent: "-0.20%", isPositive: false },
    { symbol: "SENSEX", price: "66,198.35", change: "+298.67", changePercent: "+0.45%", isPositive: true },
    { symbol: "NIFTY IT", price: "32,845.70", change: "+156.20", changePercent: "+0.48%", isPositive: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {marketData.map((item) => (
        <Card key={item.symbol} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">{item.symbol}</h3>
              {item.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-white">{item.price}</p>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${item.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {item.change}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    item.isPositive 
                      ? 'bg-green-900 text-green-300 border-green-700' 
                      : 'bg-red-900 text-red-300 border-red-700'
                  }`}
                >
                  {item.changePercent}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
