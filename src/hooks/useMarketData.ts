
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
  refreshInterval = 5000
}: MarketDataOptions): MarketDataResponse => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      const { data: response, error: functionError } = await supabase.functions.invoke(
        'zerodha-market-data',
        {
          body: {
            symbol,
            dataType,
            timeframe
          }
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [symbol, dataType, timeframe]);

  useEffect(() => {
    if (!symbol) return;

    // Initial fetch
    fetchData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdated };
};
