
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OptionData {
  strike: number;
  callOI: number;
  callLTP: number;
  callChange: number;
  callVolume: number;
  putOI: number;
  putLTP: number;
  putChange: number;
  putVolume: number;
  isATM?: boolean;
}

interface EnhancedOptionChainProps {
  symbol: string;
}

export const EnhancedOptionChain = ({ symbol }: EnhancedOptionChainProps) => {
  const [optionData, setOptionData] = useState<OptionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState('current');
  const [spotPrice, setSpotPrice] = useState(19674.25); // Mock spot price
  const [totalCallOI, setTotalCallOI] = useState(0);
  const [totalPutOI, setTotalPutOI] = useState(0);

  // Mock option chain data - In production, this would come from your API
  const mockOptionData: OptionData[] = [
    { strike: 19500, callOI: 45780, callLTP: 189.5, callChange: +15.2, callVolume: 1250, putOI: 67890, putLTP: 15.3, putChange: -2.1, putVolume: 890 },
    { strike: 19550, callOI: 78965, callLTP: 145.8, callChange: +12.1, callVolume: 1850, putOI: 89456, putLTP: 22.7, putChange: -1.8, putVolume: 1120 },
    { strike: 19600, callOI: 123456, callLTP: 102.8, callChange: +8.5, callVolume: 2340, putOI: 98765, putLTP: 28.7, putChange: -1.8, putVolume: 1450 },
    { strike: 19650, callOI: 156789, callLTP: 65.4, callChange: +5.9, callVolume: 2890, putOI: 134567, putLTP: 38.9, putChange: +1.3, putVolume: 1780 },
    { strike: 19700, callOI: 234567, callLTP: 35.4, callChange: +2.9, callVolume: 3450, putOI: 187654, putLTP: 58.9, putChange: +3.3, putVolume: 2100, isATM: true },
    { strike: 19750, callOI: 187654, callLTP: 18.1, callChange: +0.8, callVolume: 2890, putOI: 156789, putLTP: 88.2, putChange: +5.1, putVolume: 2340 },
    { strike: 19800, callOI: 134567, callLTP: 8.7, callChange: -0.5, callVolume: 2100, putOI: 123456, putLTP: 125.6, putChange: +8.8, putVolume: 1890 },
    { strike: 19850, callOI: 98765, callLTP: 4.2, callChange: -1.2, callVolume: 1450, putOI: 98765, putLTP: 168.3, putChange: +12.5, putVolume: 1560 },
    { strike: 19900, callOI: 67890, callLTP: 2.1, callChange: -1.8, callVolume: 890, putOI: 78965, putLTP: 215.7, putChange: +15.8, putVolume: 1120 },
  ];

  useEffect(() => {
    loadOptionChain();
    const interval = setInterval(loadOptionChain, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [symbol, selectedExpiry]);

  const loadOptionChain = async () => {
    setLoading(true);
    try {
      // In production, fetch from your API
      // const { data, error } = await supabase.functions.invoke('get-option-chain', {
      //   body: { symbol, expiry: selectedExpiry }
      // });
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setOptionData(mockOptionData);
      
      // Calculate totals
      const callOITotal = mockOptionData.reduce((sum, item) => sum + item.callOI, 0);
      const putOITotal = mockOptionData.reduce((sum, item) => sum + item.putOI, 0);
      setTotalCallOI(callOITotal);
      setTotalPutOI(putOITotal);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading option chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 100000) {
      return (num / 100000).toFixed(1) + 'L';
    }
    return num.toLocaleString();
  };

  const getATMStrike = () => {
    return optionData.find(item => item.isATM)?.strike || 19700;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {symbol} Option Chain
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadOptionChain}
              disabled={loading}
              className="bg-slate-700 border-slate-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-slate-700 rounded">
            <p className="text-slate-400">Spot Price</p>
            <p className="text-lg font-bold text-white">₹{spotPrice.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 bg-slate-700 rounded">
            <p className="text-slate-400">ATM Strike</p>
            <p className="text-lg font-bold text-yellow-400">{getATMStrike()}</p>
          </div>
          <div className="text-center p-2 bg-slate-700 rounded">
            <p className="text-slate-400">Total Call OI</p>
            <p className="text-lg font-bold text-green-400">{formatNumber(totalCallOI)}</p>
          </div>
          <div className="text-center p-2 bg-slate-700 rounded">
            <p className="text-slate-400">Total Put OI</p>
            <p className="text-lg font-bold text-red-400">{formatNumber(totalPutOI)}</p>
          </div>
        </div>
        
        {lastUpdated && (
          <p className="text-xs text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-2 text-slate-400">Call OI</th>
                <th className="text-right p-2 text-slate-400">Call LTP</th>
                <th className="text-right p-2 text-slate-400">Call Vol</th>
                <th className="text-center p-2 text-slate-400 font-bold">Strike</th>
                <th className="text-left p-2 text-slate-400">Put Vol</th>
                <th className="text-left p-2 text-slate-400">Put LTP</th>
                <th className="text-right p-2 text-slate-400">Put OI</th>
              </tr>
            </thead>
            <tbody>
              {optionData.map((row) => (
                <tr 
                  key={row.strike} 
                  className={`border-b border-slate-700 hover:bg-slate-700 ${
                    row.isATM ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <td className="p-2 text-slate-300">{formatNumber(row.callOI)}</td>
                  <td className="p-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-white font-medium">₹{row.callLTP}</span>
                      <div className="flex items-center gap-1">
                        {row.callChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${row.callChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.callChange > 0 ? '+' : ''}{row.callChange}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right text-slate-400">{formatNumber(row.callVolume)}</td>
                  <td className="p-2 text-center">
                    <span className={`font-bold ${row.isATM ? 'text-yellow-400' : 'text-white'}`}>
                      {row.strike}
                    </span>
                    {row.isATM && (
                      <Badge variant="secondary" className="ml-1 text-xs bg-yellow-600 text-yellow-100">
                        ATM
                      </Badge>
                    )}
                  </td>
                  <td className="p-2 text-slate-400">{formatNumber(row.putVolume)}</td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">₹{row.putLTP}</span>
                      <div className="flex items-center gap-1">
                        {row.putChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${row.putChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.putChange > 0 ? '+' : ''}{row.putChange}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right text-slate-300">{formatNumber(row.putOI)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            Buy Call
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            Buy Put
          </Button>
          <Button size="sm" variant="outline" className="border-slate-600">
            Add to Watchlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
