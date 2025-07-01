import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BarChart3, TrendingUp, Volume2, Activity, RefreshCw } from "lucide-react";
import { useMarketData } from '@/hooks/useMarketData';
import { useZerodhaAuth } from '@/hooks/useZerodhaAuth';

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  enabled: boolean;
}

interface EnhancedStockChartProps {
  symbol: string;
}

export const EnhancedStockChart = ({ symbol }: EnhancedStockChartProps) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([
    { name: 'RSI', value: 68.5, signal: 'neutral', enabled: true },
    { name: 'MACD', value: 12.4, signal: 'bullish', enabled: true },
    { name: 'EMA 20', value: 19680, signal: 'bullish', enabled: false },
    { name: 'EMA 50', value: 19620, signal: 'bullish', enabled: false },
    { name: 'Bollinger Upper', value: 19750, signal: 'neutral', enabled: false },
    { name: 'Bollinger Lower', value: 19580, signal: 'neutral', enabled: false },
  ]);

  const { accessToken } = useZerodhaAuth();

  // Use real-time market data from Zerodha
  const { data: quoteData, loading: quoteLoading, error: quoteError, lastUpdated } = useMarketData({
    symbol,
    dataType: 'quote',
    refreshInterval: 2000,
    accessToken
  });

  const { data: ohlcvData, loading: ohlcvLoading } = useMarketData({
    symbol,
    dataType: 'ohlcv',
    timeframe: timeframe.toLowerCase(),
    refreshInterval: 10000,
    accessToken
  });

  const timeframes = [
    { value: '5M', label: '5 Min' },
    { value: '15M', label: '15 Min' },
    { value: '1H', label: '1 Hour' },
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' }
  ];

  const toggleIndicator = (indicatorName: string) => {
    setIndicators(prev => 
      prev.map(ind => 
        ind.name === indicatorName 
          ? { ...ind, enabled: !ind.enabled }
          : ind
      )
    );
  };

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'bg-green-600';
      case 'bearish': return 'bg-red-600';
      default: return 'bg-yellow-600';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {symbol} Chart
            {quoteLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {accessToken && <Badge className="bg-green-600 text-white text-xs ml-2">LIVE</Badge>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant="outline"
                size="sm"
                className={`h-8 px-3 ${
                  timeframe === tf.value 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Real-time Price Info from Zerodha */}
        {quoteData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-slate-400">Live Price</p>
                  <p className="text-lg font-bold text-white">₹{quoteData.last_price}</p>
                  <p className={`text-xs ${quoteData.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {quoteData.change > 0 ? '+' : ''}₹{quoteData.change.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Volume</p>
                  <p className="text-lg font-bold text-white">{formatNumber(quoteData.volume)}</p>
                  <p className="text-xs text-green-400">Zerodha Live</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg">
              <p className="text-xs text-slate-400">Day Range</p>
              <p className="text-sm font-medium text-white">
                ₹{quoteData.ohlc.low} - ₹{quoteData.ohlc.high}
              </p>
              <p className="text-xs text-slate-400">Open: ₹{quoteData.ohlc.open}</p>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg">
              <p className="text-xs text-slate-400">Status</p>
              <Badge className="bg-green-600 text-white">Live</Badge>
              {lastUpdated && (
                <p className="text-xs text-slate-400 mt-1">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}

        {quoteError && (
          <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
            <p className="text-red-400 text-sm">
              {quoteError.includes('authenticate') 
                ? 'Please connect to Zerodha to view live market data' 
                : `Error loading market data: ${quoteError}`
              }
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Chart Placeholder - Enhanced with Zerodha real-time data */}
        <div className="bg-slate-900 rounded-lg p-8 text-center border border-slate-700 min-h-[400px] flex items-center justify-center mb-6">
          <div className="text-slate-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Live Chart Integration</p>
            <p className="text-sm">Real-time {symbol} data from Zerodha Kite API</p>
            {ohlcvData && (
              <p className="text-xs mt-2 text-green-400">
                {ohlcvData.candles?.length} candles loaded • {timeframe} timeframe
              </p>
            )}
            {ohlcvLoading && (
              <p className="text-xs mt-2 text-blue-400">Loading chart data...</p>
            )}
            {!accessToken && (
              <p className="text-xs mt-2 text-orange-400">Connect to Zerodha for live data</p>
            )}
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Technical Indicators
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator) => (
              <div 
                key={indicator.name}
                className={`p-3 rounded-lg border ${
                  indicator.enabled 
                    ? 'bg-slate-700 border-slate-600' 
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{indicator.name}</span>
                  <Switch
                    checked={indicator.enabled}
                    onCheckedChange={() => toggleIndicator(indicator.name)}
                  />
                </div>
                
                {indicator.enabled && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">
                        {indicator.name.includes('EMA') || indicator.name.includes('Bollinger') 
                          ? `₹${indicator.value}` 
                          : indicator.value}
                      </span>
                      <Badge className={`text-xs ${getSignalBadge(indicator.signal)}`}>
                        {indicator.signal}
                      </Badge>
                    </div>
                    
                    {indicator.name === 'RSI' && (
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            indicator.value > 70 ? 'bg-red-500' : 
                            indicator.value < 30 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${indicator.value}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mt-6">
          <Button className="bg-green-600 hover:bg-green-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Buy
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            Sell
          </Button>
          <Button variant="outline" className="border-slate-600">
            Add Alert
          </Button>
          <Button variant="outline" className="border-slate-600">
            Screenshot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
