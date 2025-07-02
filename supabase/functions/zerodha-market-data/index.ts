
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Correct symbol mappings as per Kite Connect v3 documentation
// Use exchange:tradingsymbol format as per official docs
const symbolMappings: Record<string, string> = {
  'NIFTY': 'NSE:NIFTY 50',        // Correct symbol for NIFTY 50 index
  'BANKNIFTY': 'NSE:NIFTY BANK',  // Correct symbol for BANK NIFTY index  
  'RELIANCE': 'NSE:RELIANCE',     // Equity symbol
  'TCS': 'NSE:TCS',               // Equity symbol
};

// Instrument token mappings (for reference, but we use exchange:symbol format)
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
      console.log(`Returning mock data for development - ${symbol} (${dataType})`);
      
      const mockData = generateMockData(symbol, dataType);
      return new Response(
        JSON.stringify(mockData),
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
  // Get the correct exchange:symbol format
  const exchangeSymbol = symbolMappings[symbol.toUpperCase()];
  if (!exchangeSymbol) {
    throw new Error(`Symbol mapping not found for: ${symbol}`);
  }

  console.log(`Making API call to Zerodha for ${symbol} (${exchangeSymbol})`);
  console.log(`API URL: https://api.kite.trade/quote?i=${encodeURIComponent(exchangeSymbol)}`);
  console.log(`Authorization header: token ${apiKey}:${accessToken.substring(0, 10)}...`);

  const response = await fetch(`https://api.kite.trade/quote?i=${encodeURIComponent(exchangeSymbol)}`, {
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
  
  // The response data is keyed by exchange:symbol format
  const quoteData = data.data[exchangeSymbol];

  if (!quoteData) {
    throw new Error(`No quote data found for ${symbol} (${exchangeSymbol})`);
  }

  // Map the response to our expected format
  return {
    instrument_token: quoteData.instrument_token,
    last_price: quoteData.last_price,
    change: quoteData.net_change,
    change_percent: ((quoteData.net_change / quoteData.ohlc.close) * 100),
    volume: quoteData.volume,
    ohlc: {
      open: quoteData.ohlc.open,
      high: quoteData.ohlc.high,
      low: quoteData.ohlc.low,
      close: quoteData.ohlc.close
    },
    timestamp: quoteData.timestamp || new Date().toISOString()
  };
}

async function fetchLiveOHLCVData(symbol: string, timeframe: string, accessToken: string, apiKey: string) {
  // Get the correct exchange:symbol format
  const exchangeSymbol = symbolMappings[symbol.toUpperCase()];
  if (!exchangeSymbol) {
    throw new Error(`Symbol mapping not found for: ${symbol}`);
  }

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
  // Get the correct exchange:symbol format
  const exchangeSymbol = symbolMappings[symbol.toUpperCase()];
  if (!exchangeSymbol) {
    throw new Error(`Symbol mapping not found for: ${symbol}`);
  }

  // For options, we need to construct the option symbols
  // This is a simplified version - you might need to enhance based on your needs
  console.log(`Making option chain API call to Zerodha for ${symbol} (${exchangeSymbol})`);
  
  const response = await fetch(`https://api.kite.trade/quote?i=${encodeURIComponent(exchangeSymbol)}`, {
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
  const quoteData = data.data[exchangeSymbol];
  const spotPrice = quoteData?.last_price;

  if (!spotPrice) {

    throw new Error(`No spot price data found for ${symbol} (${exchangeSymbol})`);
  }
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

function generateMockData(symbol: string, dataType: string) {
  const basePrice = getBasePriceForSymbol(symbol);
  const change = (Math.random() * 200) - 100; // -100 to +100
  const changePercent = (change / basePrice) * 100;
  
  switch (dataType) {
    case 'quote':
      return {
        last_price: Math.round(basePrice + change),
        change: Math.round(change * 100) / 100,
        change_percent: Math.round(changePercent * 100) / 100,
        volume: Math.floor(Math.random() * 10000000),
        ohlc: {
          open: Math.round(basePrice),
          high: Math.round(basePrice + Math.abs(change) + (Math.random() * 50)),
          low: Math.round(basePrice - Math.abs(change) - (Math.random() * 50)),
          close: Math.round(basePrice + change)
        },
        timestamp: new Date().toISOString(),
        mock: true
      };
    case 'option_chain':
      const spotPrice = basePrice + change;
      const baseStrike = Math.round(spotPrice / 50) * 50;
      const strikes = [];
      
      for (let i = -10; i <= 10; i++) {
        const strike = baseStrike + (i * 50);
        strikes.push({
          strike,
          callOI: Math.floor(Math.random() * 100000),
          callLTP: Math.max(1, Math.max(0, spotPrice - strike) + (Math.random() * 10)),
          callChange: (Math.random() * 20) - 10,
          callVolume: Math.floor(Math.random() * 50000),
          putOI: Math.floor(Math.random() * 100000),
          putLTP: Math.max(1, Math.max(0, strike - spotPrice) + (Math.random() * 10)),
          putChange: (Math.random() * 20) - 10,
          putVolume: Math.floor(Math.random() * 50000),
          isATM: Math.abs(strike - spotPrice) < 25
        });
      }
      
      return { strikes, symbol, spotPrice, mock: true };
    case 'ohlcv':
      const candles = [];
      const now = Date.now();
      for (let i = 0; i < 20; i++) {
        const time = now - (i * 5 * 60 * 1000); // 5 minute intervals
        const open = basePrice + (Math.random() * 100) - 50;
        const close = open + (Math.random() * 50) - 25;
        const high = Math.max(open, close) + (Math.random() * 20);
        const low = Math.min(open, close) - (Math.random() * 20);
        
        candles.unshift({
          time: Math.floor(time / 1000),
          open: Math.round(open),
          high: Math.round(high),
          low: Math.round(low),
          close: Math.round(close),
          volume: Math.floor(Math.random() * 1000000)
        });
      }
      return { candles, symbol, timeframe: 'live', mock: true };
    default:
      return generateMockData(symbol, 'quote');
  }
}

function getBasePriceForSymbol(symbol: string): number {
  const basePrices: Record<string, number> = {
    'NIFTY': 19650,
    'BANKNIFTY': 44800,
    'RELIANCE': 2850,
    'TCS': 3950,
  };
  return basePrices[symbol.toUpperCase()] || 1000;
}
