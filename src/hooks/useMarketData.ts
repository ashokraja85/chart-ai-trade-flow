
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketDataOptions {
  symbol: string;
  dataType: 'quote' | 'ohlcv' | 'option_chain';
  timeframe?: string;
  refreshInterval?: number;
  accessToken?: string | null;
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
  refreshInterval = 3000,
  accessToken
}: MarketDataOptions): MarketDataResponse => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching live ${dataType} data for ${symbol} from Zerodha...`);
      console.log('Access token available:', accessToken ? 'Yes' : 'No');
      console.log('Access token length:', accessToken ? accessToken.length : 0);
      
      const requestBody = {
        symbol,
        dataType,
        timeframe: timeframe || 'live',
        accessToken: accessToken && accessToken.trim() !== '' ? accessToken : null
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
        throw new Error('No data received from Zerodha API');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      setData(response);
      setLastUpdated(new Date());
      console.log(`Successfully received live ${dataType} data for ${symbol}`, response.last_price || response.spotPrice || 'OK');
    } catch (err) {
      console.error(`Error fetching ${dataType} data for ${symbol}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbol, dataType, timeframe, accessToken]);

  useEffect(() => {
    if (!symbol) return;

    // Always try to fetch data - the edge function will handle fallback to environment token
    console.log(`Setting up data fetch for ${symbol} with refresh interval: ${refreshInterval}`);
    
    // Initial fetch
    fetchData();

    // Set up interval for live updates
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
