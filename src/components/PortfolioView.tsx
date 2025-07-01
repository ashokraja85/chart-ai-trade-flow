
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export const PortfolioView = () => {
  const positions = [
    { symbol: "NIFTY 19700 CE", qty: 50, avgPrice: 45.2, ltp: 52.8, pnl: +380, pnlPercent: +16.8 },
    { symbol: "RELIANCE", qty: 10, avgPrice: 2650, ltp: 2680, pnl: +300, pnlPercent: +1.13 },
    { symbol: "TCS", qty: 5, avgPrice: 3820, ltp: 3795, pnl: -125, pnlPercent: -0.65 },
  ];

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Portfolio</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Total P&L:</span>
          <Badge className={`${totalPnL >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {totalPnL >= 0 ? '+' : ''}₹{totalPnL}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position) => (
            <div key={position.symbol} className="bg-slate-700 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{position.symbol}</span>
                <div className="flex items-center gap-1">
                  {position.pnl >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Qty: {position.qty}</span>
                <span>Avg: ₹{position.avgPrice}</span>
                <span>LTP: ₹{position.ltp}</span>
                <span className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {position.pnl >= 0 ? '+' : ''}₹{position.pnl}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
