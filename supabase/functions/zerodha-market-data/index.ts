
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    trend: 0.002
  },
  'BANKNIFTY': {
    basePrice: 51200,
    open: 51150,
    high: 51350,
    low: 51100,
    volume: 650000,
    trend: -0.001
  },
  'RELIANCE': {
    basePrice: 2850,
    open: 2835,
    high: 2865,
    low: 2825,
    volume: 120000,
    trend: 0.003
  },
  'TCS': {
    basePrice: 4250,
    open: 4230,
    high: 4270,
    low: 4220,
    volume: 95000,
    trend: 0.001
  }
};

function generateRealisticPrice(symbol: string, baseData: any) {
  const now = new Date();
  const timestamp = now.getTime();
  
  const timeBasedVariation = Math.sin(timestamp / 60000) * 0.005;
  const secondVariation = Math.sin(timestamp / 1000) * 0.002;
  const randomComponent = (Math.random() - 0.5) * 0.008;
  
  const totalVariation = timeBasedVariation + secondVariation + randomComponent + baseData.trend;
  const currentPrice = baseData.basePrice * (1 + totalVariation);
  
  const adjustedHigh = Math.max(baseData.high, currentPrice);
  const adjustedLow = Math.min(baseData.low, currentPrice);
  
  const volumeVariation = 0.7 + (Math.random() * 0.6);
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
    },
    timestamp: now.toISOString()
  };
}

function fetchQuoteData(symbol: string) {
  const baseData = baseMarketData[symbol as keyof typeof baseMarketData] || baseMarketData['NIFTY'];
  const priceData = generateRealisticPrice(symbol, baseData);
  
  return {
    instrument_token: 256265,
    ...priceData
  };
}

function fetchOHLCVData(symbol: string, timeframe: string) {
  const baseData = baseMarketData[symbol as keyof typeof baseMarketData] || baseMarketData['NIFTY'];
  const candles = [];
  const basePrice = baseData.basePrice;
  
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * 5);
    
    const trend = Math.sin(i * 0.05) * baseData.trend * 50;
    const noise = (Math.random() - 0.5) * 0.015;
    const priceMultiplier = 1 + trend + noise;
    
    const open = basePrice * priceMultiplier;
    const closeVariation = (Math.random() - 0.5) * 0.008;
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

function fetchOptionChainData(symbol: string) {
  const baseData = baseMarketData[symbol as keyof typeof baseMarketData] || baseMarketData['NIFTY'];
  const strikes = [];
  const currentPrice = generateRealisticPrice(symbol, baseData).last_price;
  const baseStrike = Math.round(currentPrice / 50) * 50;
  
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + (i * 50);
    const distanceFromATM = Math.abs(strike - currentPrice);
    
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
      isATM: Math.abs(strike - currentPrice) < 25
    });
  }
  
  return { strikes, symbol, spotPrice: Number(currentPrice.toFixed(2)) };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fresh request at:', new Date().toISOString());
    
    let requestBody;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      requestBody = await req.json();
    } else {
      const textBody = await req.text();
      if (textBody) {
        requestBody = JSON.parse(textBody);
      } else {
        requestBody = {};
      }
    }

    const { symbol = 'NIFTY', dataType = 'quote', timeframe = 'live' } = requestBody;
    
    console.log(`Generating fresh ${dataType} for ${symbol}`);

    let responseData;
    
    switch (dataType) {
      case 'quote':
        responseData = fetchQuoteData(symbol);
        break;
      case 'ohlcv':
        responseData = fetchOHLCVData(symbol, timeframe);
        break;
      case 'option_chain':
        responseData = fetchOptionChainData(symbol);
        break;
      default:
        responseData = fetchQuoteData(symbol);
    }

    console.log(`Fresh data generated for ${symbol}:`, responseData.last_price || 'OK');

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
