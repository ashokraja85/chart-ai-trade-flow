
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZerodhaTickData {
  instrument_token: number;
  last_price: number;
  volume: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  change: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Zerodha market data function called');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    let requestBody;
    
    // Handle different content types properly
    const contentType = req.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      try {
        requestBody = await req.json();
        console.log('Parsed JSON request body:', requestBody);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Try to parse as text and then as JSON for Supabase invoke calls
      try {
        const textBody = await req.text();
        console.log('Raw request text:', textBody);
        
        if (textBody) {
          requestBody = JSON.parse(textBody);
          console.log('Parsed text as JSON:', requestBody);
        } else {
          console.error('Empty request body received');
          return new Response(
            JSON.stringify({ error: 'Empty request body' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid request body format' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const { symbol, dataType, timeframe } = requestBody;
    
    if (!symbol || !dataType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: symbol and dataType' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiKey = Deno.env.get('ZERODHA_API_KEY');
    const apiSecret = Deno.env.get('ZERODHA_API_SECRET');

    console.log('API Key present:', !!apiKey);
    console.log('API Secret present:', !!apiSecret);

    if (!apiKey || !apiSecret) {
      console.error('Zerodha API credentials not found');
      return new Response(
        JSON.stringify({ error: 'Zerodha API credentials not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check cache first
    try {
      const { data: cachedData } = await supabase
        .from('market_data_cache')
        .select('data, expires_at')
        .eq('symbol', symbol)
        .eq('data_type', dataType)
        .eq('timeframe', timeframe || 'live')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cachedData) {
        console.log('Returning cached data for', symbol);
        return new Response(
          JSON.stringify(cachedData.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (cacheError) {
      console.log('No cached data found or cache error:', cacheError);
    }

    let responseData: any = {};

    // Fetch data based on type
    try {
      switch (dataType) {
        case 'quote':
          responseData = await fetchQuoteData(symbol, apiKey);
          break;
        case 'ohlcv':
          responseData = await fetchOHLCVData(symbol, timeframe, apiKey);
          break;
        case 'option_chain':
          responseData = await fetchOptionChainData(symbol, apiKey);
          break;
        default:
          throw new Error('Invalid data type');
      }
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch ${dataType} data: ${fetchError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Cache the data
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (dataType === 'quote' ? 5 : 60)); // 5s for quotes, 1min for others

      await supabase
        .from('market_data_cache')
        .upsert({
          symbol,
          data_type: dataType,
          timeframe: timeframe || 'live',
          data: responseData,
          expires_at: expiresAt.toISOString()
        });
      
      console.log('Data cached successfully');
    } catch (cacheError) {
      console.error('Failed to cache data:', cacheError);
      // Don't fail the request if caching fails
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in zerodha-market-data:', error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fetchQuoteData(symbol: string, apiKey: string) {
  // Mock implementation - replace with actual Zerodha API call
  // In production, you'd need to handle authentication tokens
  console.log('Fetching quote data for', symbol);
  
  // For now, return mock data with realistic values
  const mockData = {
    instrument_token: 256265,
    last_price: symbol === 'NIFTY' ? 19674.25 + (Math.random() - 0.5) * 100 : 2450.75 + (Math.random() - 0.5) * 50,
    volume: Math.floor(Math.random() * 1000000),
    ohlc: {
      open: symbol === 'NIFTY' ? 19580 : 2420,
      high: symbol === 'NIFTY' ? 19720 : 2480,
      low: symbol === 'NIFTY' ? 19550 : 2400,
      close: symbol === 'NIFTY' ? 19674.25 : 2450.75
    },
    change: symbol === 'NIFTY' ? 124.85 + (Math.random() - 0.5) * 20 : 15.75 + (Math.random() - 0.5) * 10,
    timestamp: new Date().toISOString()
  };

  return mockData;
}

async function fetchOHLCVData(symbol: string, timeframe: string, apiKey: string) {
  console.log('Fetching OHLCV data for', symbol, timeframe);
  
  // Mock OHLCV data - replace with actual API call
  const candles = [];
  const basePrice = symbol === 'NIFTY' ? 19600 : 2400;
  
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * 5);
    
    const open = basePrice + Math.random() * 100 - 50;
    const close = open + Math.random() * 40 - 20;
    const high = Math.max(open, close) + Math.random() * 20;
    const low = Math.min(open, close) - Math.random() * 20;
    const volume = Math.floor(Math.random() * 10000);
    
    candles.push({
      time: Math.floor(timestamp.getTime() / 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });
  }
  
  return { candles, symbol, timeframe };
}

async function fetchOptionChainData(symbol: string, apiKey: string) {
  console.log('Fetching option chain for', symbol);
  
  // Mock option chain data - replace with actual API call
  const strikes = [];
  const baseStrike = symbol === 'NIFTY' ? 19700 : 2450;
  
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + (i * 50);
    strikes.push({
      strike,
      callOI: Math.floor(Math.random() * 200000),
      callLTP: Math.max(1, 100 - Math.abs(i) * 10 + Math.random() * 20),
      callChange: (Math.random() - 0.5) * 10,
      callVolume: Math.floor(Math.random() * 5000),
      putOI: Math.floor(Math.random() * 200000),
      putLTP: Math.max(1, Math.abs(i) * 10 + Math.random() * 20),
      putChange: (Math.random() - 0.5) * 10,
      putVolume: Math.floor(Math.random() * 5000),
      isATM: i === 0
    });
  }
  
  return { strikes, symbol, spotPrice: baseStrike };
}
