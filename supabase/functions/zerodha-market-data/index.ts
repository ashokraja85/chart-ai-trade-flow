
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Market data with more realistic fluctuations
const marketData = {
  'NIFTY': {
    basePrice: 19674.25,
    open: 19580,
    high: 19720,
    low: 19550,
    volume: 850000
  },
  'BANKNIFTY': {
    basePrice: 43892.15,
    open: 43800,
    high: 44050,
    low: 43750,
    volume: 650000
  },
  'RELIANCE': {
    basePrice: 2450.75,
    open: 2420,
    high: 2480,
    low: 2400,
    volume: 120000
  },
  'TCS': {
    basePrice: 3850.50,
    open: 3820,
    high: 3880,
    low: 3800,
    volume: 95000
  },
  'HDFC': {
    basePrice: 1650.25,
    open: 1635,
    high: 1670,
    low: 1625,
    volume: 180000
  }
};

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
          responseData = await fetchQuoteData(symbol);
          break;
        case 'ohlcv':
          responseData = await fetchOHLCVData(symbol, timeframe);
          break;
        case 'option_chain':
          responseData = await fetchOptionChainData(symbol);
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

    // Cache the data (with shorter cache time for more frequent updates)
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (dataType === 'quote' ? 2 : 30)); // 2s for quotes, 30s for others

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

async function fetchQuoteData(symbol: string) {
  console.log('Fetching quote data for', symbol);
  
  // Get base data for the symbol
  const baseData = marketData[symbol as keyof typeof marketData] || marketData['NIFTY'];
  
  // Create realistic price movements (±0.5% from base price)
  const priceVariation = (Math.random() - 0.5) * 0.01; // ±0.5%
  const currentPrice = baseData.basePrice * (1 + priceVariation);
  
  // Calculate change from opening price
  const change = currentPrice - baseData.open;
  const changePercent = (change / baseData.open) * 100;
  
  // Add some volume variation
  const volumeVariation = 0.8 + (Math.random() * 0.4); // 80% to 120% of base volume
  const currentVolume = Math.floor(baseData.volume * volumeVariation);

  const mockData = {
    instrument_token: 256265,
    last_price: Number(currentPrice.toFixed(2)),
    volume: currentVolume,
    ohlc: {
      open: baseData.open,
      high: Math.max(baseData.high, currentPrice),
      low: Math.min(baseData.low, currentPrice),
      close: Number(currentPrice.toFixed(2))
    },
    change: Number(change.toFixed(2)),
    change_percent: Number(changePercent.toFixed(2)),
    timestamp: new Date().toISOString()
  };

  console.log(`Generated realistic data for ${symbol}:`, mockData);
  return mockData;
}

async function fetchOHLCVData(symbol: string, timeframe: string) {
  console.log('Fetching OHLCV data for', symbol, timeframe);
  
  const baseData = marketData[symbol as keyof typeof marketData] || marketData['NIFTY'];
  const candles = [];
  const basePrice = baseData.basePrice;
  
  // Generate 100 candles with realistic price movements
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * 5);
    
    // Create trending price movement instead of random
    const trend = Math.sin(i * 0.1) * 0.02; // 2% trend oscillation
    const noise = (Math.random() - 0.5) * 0.01; // 1% random noise
    const priceMultiplier = 1 + trend + noise;
    
    const open = basePrice * priceMultiplier;
    const closeVariation = (Math.random() - 0.5) * 0.005; // 0.5% candle variation
    const close = open * (1 + closeVariation);
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    const volume = Math.floor(baseData.volume * (0.5 + Math.random()));
    
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

async function fetchOptionChainData(symbol: string) {
  console.log('Fetching option chain for', symbol);
  
  const baseData = marketData[symbol as keyof typeof marketData] || marketData['NIFTY'];
  const strikes = [];
  const currentPrice = baseData.basePrice;
  const baseStrike = Math.round(currentPrice / 50) * 50; // Round to nearest 50
  
  // Generate option chain around current price
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + (i * 50);
    const isATM = Math.abs(strike - currentPrice) < 25;
    const distanceFromATM = Math.abs(strike - currentPrice);
    
    // Calculate option premiums based on distance from current price
    const callPremium = Math.max(1, Math.max(0, currentPrice - strike) + (50 - distanceFromATM * 0.1));
    const putPremium = Math.max(1, Math.max(0, strike - currentPrice) + (50 - distanceFromATM * 0.1));
    
    strikes.push({
      strike,
      callOI: Math.floor(50000 + Math.random() * 150000),
      callLTP: Number(callPremium.toFixed(2)),
      callChange: Number(((Math.random() - 0.5) * 10).toFixed(2)),
      callVolume: Math.floor(Math.random() * 5000),
      putOI: Math.floor(50000 + Math.random() * 150000),
      putLTP: Number(putPremium.toFixed(2)),
      putChange: Number(((Math.random() - 0.5) * 10).toFixed(2)),
      putVolume: Math.floor(Math.random() * 5000),
      isATM
    });
  }
  
  return { strikes, symbol, spotPrice: Number(currentPrice.toFixed(2)) };
}
