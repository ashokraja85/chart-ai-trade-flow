
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
    
    // Check if token is an object (serialization issue) and extract value
    if (typeof token === 'object' && token !== null) {
      token = token.value || null;
    }
    
    // If no token from request, try to get from environment (for shared tokens)
    if (!token || token.trim() === '') {
      token = Deno.env.get("ZERODHA_ACCESS_TOKEN");
      console.log('Using environment token:', token ? 'Yes' : 'No');
    }
    
    // Get API key from environment - try multiple possible names
    let apiKey = Deno.env.get('ZERODHA_API_KEY') || Deno.env.get('u1qyy1g6dds0szr0');
    
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('Token available:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    // Enhanced debugging for credentials
    console.log('Using API Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'None');
    console.log('Using Access Token:', token ? token.substring(0, 10) + '...' : 'None');
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('No valid API key found in environment secrets');
      throw new Error('ZERODHA_API_KEY is required. Please set it in Supabase secrets.');
    }
    
    if (!token || token.trim() === '') {
      console.error('No valid access token provided in request or environment');
      // Return mock data when no token is available for development
      console.log('Returning mock data for development - no authentication available');
      return new Response(
        JSON.stringify({
          last_price: Math.floor(Math.random() * 1000) + 19000,
          change: Math.floor(Math.random() * 200) - 100,
          change_percent: (Math.random() * 4) - 2,
          volume: Math.floor(Math.random() * 10000000),
          ohlc: {
            open: Math.floor(Math.random() * 1000) + 19000,
            high: Math.floor(Math.random() * 1000) + 19500,
            low: Math.floor(Math.random() * 1000) + 18500,
            close: Math.floor(Math.random() * 1000) + 19000
          },
          timestamp: new Date().toISOString(),
          mock: true
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          } 
        }
      );
    }

    console.log(`Fetching live ${dataType} data for ${symbol} from Zerodha API`);

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
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

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
      // Test if it's an API key issue vs access token issue
      console.error('Authentication failed - checking if credentials are valid format');
      console.error('API Key format check:', /^[a-z0-9]{16}$/.test(apiKey) ? 'Valid format' : 'Invalid format');
      console.error('Access Token format check:', /^[a-z0-9]{32}$/.test(accessToken) ? 'Valid format' : 'Invalid format');
      
      throw new Error(`Authentication failed: ${errorData.message || 'Invalid API key or access token'}. Please check your Zerodha credentials.`);
    }
    
    throw new Error(`Quote API failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('Quote API successful - received data keys:', Object.keys(data));
  
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

  console.log(`Making historical data API call to Zerodha for ${symbol}`);
  const historyUrl = `https://api.kite.trade/instruments/historical/${instrumentToken}/${kiteTimeframe}?` +
    `from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}`;
  console.log(`Historical data URL: ${historyUrl}`);
  console.log(`Authorization header: token ${apiKey}:${accessToken.substring(0, 10)}...`);

  const response = await fetch(historyUrl, {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Zerodha historical data API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zerodha historical data API error response:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    if (response.status === 403) {
      console.error('Historical data authentication failed');
      console.error('API Key format check:', /^[a-z0-9]{16}$/.test(apiKey) ? 'Valid format' : 'Invalid format');
      console.error('Access Token format check:', /^[a-z0-9]{32}$/.test(accessToken) ? 'Valid format' : 'Invalid format');
      
      throw new Error(`Historical data authentication failed: ${errorData.message || 'Invalid API key or access token'}.`);
    }
    
    throw new Error(`Historical data API failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('Historical data response received, candles count:', data.data?.candles?.length || 0);
  
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
  console.log(`Making option chain API call to Zerodha for ${symbol}`);
  
  const response = await fetch(`https://api.kite.trade/quote?i=NSE:${symbol}`, {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Zerodha option chain API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zerodha option chain API error response:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    if (response.status === 403) {
      throw new Error(`Option chain authentication failed: ${errorData.message || 'Invalid API key or access token'}.`);
    }
    
    throw new Error(`Option chain API failed: ${errorData.message || response.statusText}`);
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
