
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useMarketData } from '@/hooks/useMarketData';

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
  const [selectedExpiry, setSelectedExpiry] = useState('current');
  const [totalCallOI, setTotalCallOI] = useState(0);
  const [totalPutOI, setTotalPutOI] = useState(0);

  // Use real-time option chain data
  const { data: optionChainData, loading, error, lastUpdated } = useMarketData({
    symbol,
    dataType: 'option_chain',
    refreshInterval: 3000 // Update every 3 seconds
  });

  const optionData: OptionData[] = optionChainData?.strikes || [];
  const spotPrice = optionChainData?.spotPrice || 0;

  useEffect(() => {
    if (optionData.length > 0) {
      const callOITotal = optionData.reduce((sum, item) => sum + item.callOI, 0);
      const putOITotal = optionData.reduce((sum, item) => sum + item.putOI, 0);
      setTotalCallOI(callOITotal);
      setTotalPutOI(putOITotal);
    }
  }, [optionData]);

  const formatNumber = (num: number) => {
    if (num >= 100000) {
      return (num / 100000).toFixed(1) + 'L';
    }
    return num.toLocaleString();
  };

  const getATMStrike = () => {
    return optionData.find(item => item.isATM)?.strike || spotPrice;
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
            <Badge className="bg-green-600 text-white">Live</Badge>
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

        {error && (
          <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
            <p className="text-red-400 text-sm">Error loading option chain: {error}</p>
          </div>
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
                      <span className="text-white font-medium">₹{row.callLTP.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        {row.callChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${row.callChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.callChange > 0 ? '+' : ''}{row.callChange.toFixed(2)}
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
                      <span className="text-white font-medium">₹{row.putLTP.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        {row.putChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={`text-xs ${row.putChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.putChange > 0 ? '+' : ''}{row.putChange.toFixed(2)}
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
