
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base market data - will be modified with realistic fluctuations
const baseMarketData = {
  'NIFTY': {
    basePrice: 24500,
    open: 24450,
    high: 24580,
    low: 24420,
    volume: 850000,
    trend: 0.002 // slight upward trend
  },
  'BANKNIFTY': {
    basePrice: 51200,
    open: 51150,
    high: 51350,
    low: 51100,
    volume: 650000,
    trend: -0.001 // slight downward trend
  },
  'RELIANCE': {
    basePrice: 2850,
    open: 2835,
    high: 2865,
    low: 2825,
    volume: 120000,
    trend: 0.003 // moderate upward trend
  },
  'TCS': {
    basePrice: 4250,
    open: 4230,
    high: 4270,
    low: 4220,
    volume: 95000,
    trend: 0.001 // slight upward trend
  }
};

// Function to generate realistic price movements
function generateRealisticPrice(symbol: string, baseData: any) {
  const now = new Date();
  const timeBasedVariation = Math.sin(now.getMinutes() * 0.1) * 0.005; // Time-based oscillation
  const randomVariation = (Math.random() - 0.5) * 0.008; // ±0.4% random movement
  const trendComponent = baseData.trend;
  
  const totalVariation = timeBasedVariation + randomVariation + trendComponent;
  const currentPrice = baseData.basePrice * (1 + totalVariation);
  
  // Update high/low based on current price
  const adjustedHigh = Math.max(baseData.high, currentPrice);
  const adjustedLow = Math.min(baseData.low, currentPrice);
  
  // Generate volume with some variation
  const volumeVariation = 0.7 + (Math.random() * 0.6); // 70% to 130% of base volume
  const currentVolume = Math.floor(baseData.volume * volumeVariation);
  
  return {
    last_price: Number(currentPrice.toFixed(2)),
    change: Number((currentPrice - baseData.open).toFixed(2)),
    change_percent: Number(((currentPrice - baseData.open) / baseData.open * 100).toFixed(2)),
    volume: currentVolume,
    ohlc: {
      open: baseData.open,
      high: Number(adjustedHigh.toFixed(2)),
      low: Number(adjustedLow.toFixed(2)),
      close: Number(currentPrice.toFixed(2))
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Zerodha market data function called at:', new Date().toISOString());
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    let requestBody;
    
    // Handle different content types properly
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        requestBody = await req.json();
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
      try {
        const textBody = await req.text();
        
        if (textBody) {
          requestBody = JSON.parse(textBody);
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

    let responseData: any = {};

    // Fetch data based on type with no caching for real-time feel
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

    console.log(`Generated fresh ${dataType} data for ${symbol}:`, responseData);

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
  console.log('Generating fresh quote data for', symbol);
  
  // Get base data for the symbol
  const baseData = baseMarketData[symbol as keyof typeof baseMarketData] || baseMarketData['NIFTY'];
  
  // Generate realistic current price
  const priceData = generateRealisticPrice(symbol, baseData);
  
  const mockData = {
    instrument_token: 256265,
    ...priceData,
    timestamp: new Date().toISOString()
  };

  console.log(`Fresh realistic data for ${symbol}:`, mockData);
  return mockData;
}

async function fetchOHLCVData(symbol: string, timeframe: string) {
  console.log('Fetching OHLCV data for', symbol, timeframe);
  
  const baseData = baseMarketData[symbol as keyof typeof baseMarketData] || baseMarketData['NIFTY'];
  const candles = [];
  const basePrice = baseData.basePrice;
  
  // Generate 100 candles with realistic price movements
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * 5);
    
    // Create trending price movement with realistic volatility
    const trend = Math.sin(i * 0.05) * baseData.trend * 50; // Amplify trend for historical data
    const noise = (Math.random() - 0.5) * 0.015; // 1.5% random noise
    const priceMultiplier = 1 + trend + noise;
    
    const open = basePrice * priceMultiplier;
    const closeVariation = (Math.random() - 0.5) * 0.008; // 0.8% candle variation
    const close = open * (1 + closeVariation);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = Math.floor(baseData.volume * (0.3 + Math.random() * 1.4));
    
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
  
  const baseData = baseMarketData[symbol as keyof typeof baseMarketData] || baseMarketData['NIFTY'];
  const strikes = [];
  const currentPrice = generateRealisticPrice(symbol, baseData).last_price;
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
