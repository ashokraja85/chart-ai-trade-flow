
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketDataOptions {
  symbol: string;
  dataType: 'quote' | 'ohlcv' | 'option_chain';
  timeframe?: string;
  refreshInterval?: number;
}

interface MarketDataResponse {
  data: any;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useMarketData = ({
  symbol,
  dataType,
  timeframe,
  refreshInterval = 3000 // Reduced to 3 seconds for more frequent updates
}: MarketDataOptions): MarketDataResponse => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`Fetching ${dataType} data for ${symbol}...`);
      
      const requestBody = {
        symbol,
        dataType,
        timeframe: timeframe || 'live'
      };

      console.log('Request body:', requestBody);

      const { data: response, error: functionError } = await supabase.functions.invoke(
        'zerodha-market-data',
        {
          body: requestBody,
        }
      );

      console.log('Function response:', response);
      console.log('Function error:', functionError);

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(`API Error: ${functionError.message}`);
      }

      if (!response) {
        throw new Error('No data received from API');
      }

      // Check if response contains an error
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response);
      setLastUpdated(new Date());
      console.log(`Successfully fetched ${dataType} data for ${symbol}`, response);
    } catch (err) {
      console.error(`Error fetching ${dataType} data for ${symbol}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Set fallback data only if no data exists
      if (!data && dataType === 'quote') {
        console.log('Setting fallback quote data');
        const fallbackData = {
          instrument_token: 256265,
          last_price: symbol === 'NIFTY' ? 19674.25 : symbol === 'BANKNIFTY' ? 43892.15 : 2450.75,
          volume: Math.floor(Math.random() * 1000000),
          ohlc: {
            open: symbol === 'NIFTY' ? 19580 : symbol === 'BANKNIFTY' ? 43800 : 2420,
            high: symbol === 'NIFTY' ? 19720 : symbol === 'BANKNIFTY' ? 44050 : 2480,
            low: symbol === 'NIFTY' ? 19550 : symbol === 'BANKNIFTY' ? 43750 : 2400,
            close: symbol === 'NIFTY' ? 19674.25 : symbol === 'BANKNIFTY' ? 43892.15 : 2450.75
          },
          change: symbol === 'NIFTY' ? 124.85 : symbol === 'BANKNIFTY' ? -89.45 : 15.75,
          timestamp: new Date().toISOString()
        };
        setData(fallbackData);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, dataType, timeframe, data]);

  useEffect(() => {
    if (!symbol) return;

    // Initial fetch
    fetchData();

    // Set up interval for real-time updates
    let interval: NodeJS.Timeout;
    if (refreshInterval > 0) {
      interval = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdated };
};
