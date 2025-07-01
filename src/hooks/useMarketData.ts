
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
  refreshInterval = 2000 // Reduced to 2 seconds for truly live feel
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
      console.log(`Fetching fresh ${dataType} data for ${symbol}...`);
      
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
      console.log(`Successfully fetched fresh ${dataType} data for ${symbol}`, response);
    } catch (err) {
      console.error(`Error fetching ${dataType} data for ${symbol}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbol, dataType, timeframe]);

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
