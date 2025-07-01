
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Instrument token mappings (you may need to expand this)
const instrumentTokens: Record<string, string> = {
  'NIFTY': '256265',
  'BANKNIFTY': '260105',
  'RELIANCE': '738561',
  'TCS': '2953217',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fresh request at:', new Date().toISOString());
    
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { symbol = 'NIFTY', dataType = 'quote', timeframe = 'live', accessToken, access_token } = requestBody;
    
    // Handle both accessToken and access_token for compatibility
    let token = accessToken || access_token;
    
    // If no token from request, try to get from environment (for shared tokens)
    if (!token || token.trim() === '') {
      token = Deno.env.get("ZERODHA_ACCESS_TOKEN");
      console.log('Using environment token:', token ? 'Yes' : 'No');
    }
    
    // Get API key from environment
    const apiKey = Deno.env.get('ZERODHA_API_KEY');
    
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('Token available:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('ZERODHA_API_KEY not found in environment secrets');
      throw new Error('ZERODHA_API_KEY is required. Please set it in Supabase secrets.');
    }
    
    if (!token || token.trim() === '') {
      console.error('No valid access token provided in request or environment');
      throw new Error('Access token is required. Please authenticate with Zerodha first or set ZERODHA_ACCESS_TOKEN in secrets.');
    }

    console.log(`Fetching live ${dataType} data for ${symbol} from Zerodha API`);
    console.log(`Using API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`Using Access Token: ${token.substring(0, 10)}...`);

    let responseData;
    
    switch (dataType) {
      case 'quote':
        responseData = await fetchLiveQuoteData(symbol, token, apiKey);
        break;
      case 'ohlcv':
        responseData = await fetchLiveOHLCVData(symbol, timeframe, token, apiKey);
        break;
      case 'option_chain':
        responseData = await fetchLiveOptionChainData(symbol, token, apiKey);
        break;
      default:
        responseData = await fetchLiveQuoteData(symbol, token, apiKey);
    }

    console.log(`Live data fetched for ${symbol}:`, responseData?.last_price || responseData?.spotPrice || 'OK');

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
    console.error('Zerodha API error:', error);
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

async function fetchLiveQuoteData(symbol: string, accessToken: string, apiKey: string) {
  const instrumentToken = instrumentTokens[symbol.toUpperCase()];
  if (!instrumentToken) {
    throw new Error(`Instrument token not found for symbol: ${symbol}`);
  }

  console.log(`Making API call to Zerodha for ${symbol}`);
  console.log(`API URL: https://api.kite.trade/quote?i=NSE:${symbol}`);
  console.log(`Authorization header: token ${apiKey}:${accessToken.substring(0, 10)}...`);

  const response = await fetch(`https://api.kite.trade/quote?i=NSE:${symbol}`, {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Zerodha API response status: ${response.status}`);
  console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zerodha API error response:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    if (response.status === 403) {
      throw new Error(`Authentication failed: ${errorData.message || 'Invalid API key or access token'}. Please check your Zerodha credentials.`);
    }
    
    throw new Error(`Quote API failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('Raw API response:', JSON.stringify(data, null, 2));
  
  const quoteData = data.data[`NSE:${symbol}`];

  if (!quoteData) {
    throw new Error(`No quote data found for ${symbol}`);
  }

  return {
    instrument_token: parseInt(instrumentToken),
    last_price: quoteData.last_price,
    change: quoteData.net_change,
    change_percent: quoteData.change,
    volume: quoteData.volume,
    ohlc: {
      open: quoteData.ohlc.open,
      high: quoteData.ohlc.high,
      low: quoteData.ohlc.low,
      close: quoteData.ohlc.close || quoteData.last_price
    },
    timestamp: new Date().toISOString()
  };
}

async function fetchLiveOHLCVData(symbol: string, timeframe: string, accessToken: string, apiKey: string) {
  const instrumentToken = instrumentTokens[symbol.toUpperCase()];
  if (!instrumentToken) {
    throw new Error(`Instrument token not found for symbol: ${symbol}`);
  }

  // Convert timeframe to Zerodha format
  const kiteTimeframe = convertTimeframe(timeframe);
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 5); // Get last 5 days

  const response = await fetch(
    `https://api.kite.trade/instruments/historical/${instrumentToken}/${kiteTimeframe}?` +
    `from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}`,
    {
      headers: {
        'Authorization': `token ${apiKey}:${accessToken}`,
        'X-Kite-Version': '3',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Historical data API failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  
  const candles = data.data.candles.map((candle: any[]) => ({
    time: Math.floor(new Date(candle[0]).getTime() / 1000),
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5]
  }));

  return { candles, symbol, timeframe };
}

async function fetchLiveOptionChainData(symbol: string, accessToken: string, apiKey: string) {
  // For options, we need to construct the option symbols
  // This is a simplified version - you might need to enhance based on your needs
  const response = await fetch(`https://api.kite.trade/quote?i=NSE:${symbol}`, {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Quote API failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  const quoteData = data.data[`NSE:${symbol}`];
  const spotPrice = quoteData.last_price;

  // Generate option chain structure (you'll need to enhance this with actual option data)
  const baseStrike = Math.round(spotPrice / 50) * 50;
  const strikes = [];

  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + (i * 50);
    strikes.push({
      strike,
      callOI: 0, // You'll need to fetch actual option data
      callLTP: Math.max(1, Math.max(0, spotPrice - strike)),
      callChange: 0,
      callVolume: 0,
      putOI: 0,
      putLTP: Math.max(1, Math.max(0, strike - spotPrice)),
      putChange: 0,
      putVolume: 0,
      isATM: Math.abs(strike - spotPrice) < 25
    });
  }

  return { strikes, symbol, spotPrice };
}

function convertTimeframe(timeframe: string): string {
  const timeframeMap: Record<string, string> = {
    '5M': '5minute',
    '15M': '15minute',
    '1H': 'hour',
    '1D': 'day',
    '1W': 'week',
    'live': '5minute'
  };
  return timeframeMap[timeframe] || '5minute';
}
