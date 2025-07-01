
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { symbol, dataType, timeframe } = await req.json()
    
    const apiKey = Deno.env.get('ZERODHA_API_KEY')
    const apiSecret = Deno.env.get('ZERODHA_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error('Zerodha API credentials not found')
    }

    // Check cache first
    const { data: cachedData } = await supabase
      .from('market_data_cache')
      .select('data, expires_at')
      .eq('symbol', symbol)
      .eq('data_type', dataType)
      .eq('timeframe', timeframe || 'live')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cachedData) {
      console.log('Returning cached data for', symbol)
      return new Response(
        JSON.stringify(cachedData.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let responseData: any = {}

    // Fetch data based on type
    switch (dataType) {
      case 'quote':
        // Fetch current quote data
        responseData = await fetchQuoteData(symbol, apiKey)
        break
      case 'ohlcv':
        // Fetch historical OHLCV data
        responseData = await fetchOHLCVData(symbol, timeframe, apiKey)
        break
      case 'option_chain':
        // Fetch option chain data
        responseData = await fetchOptionChainData(symbol, apiKey)
        break
      default:
        throw new Error('Invalid data type')
    }

    // Cache the data
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (dataType === 'quote' ? 5 : 60)) // 5s for quotes, 1min for others

    await supabase
      .from('market_data_cache')
      .upsert({
        symbol,
        data_type: dataType,
        timeframe: timeframe || 'live',
        data: responseData,
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in zerodha-market-data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchQuoteData(symbol: string, apiKey: string) {
  // Mock implementation - replace with actual Zerodha API call
  // In production, you'd need to handle authentication tokens
  console.log('Fetching quote data for', symbol)
  
  // For now, return mock data with realistic values
  const mockData = {
    instrument_token: 256265,
    last_price: symbol === 'NIFTY' ? 19674.25 : 2450.75,
    volume: Math.floor(Math.random() * 1000000),
    ohlc: {
      open: symbol === 'NIFTY' ? 19580 : 2420,
      high: symbol === 'NIFTY' ? 19720 : 2480,
      low: symbol === 'NIFTY' ? 19550 : 2400,
      close: symbol === 'NIFTY' ? 19674.25 : 2450.75
    },
    change: symbol === 'NIFTY' ? 124.85 : 15.75,
    timestamp: new Date().toISOString()
  }

  return mockData
}

async function fetchOHLCVData(symbol: string, timeframe: string, apiKey: string) {
  console.log('Fetching OHLCV data for', symbol, timeframe)
  
  // Mock OHLCV data - replace with actual API call
  const candles = []
  const basePrice = symbol === 'NIFTY' ? 19600 : 2400
  
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date()
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * 5)
    
    const open = basePrice + Math.random() * 100 - 50
    const close = open + Math.random() * 40 - 20
    const high = Math.max(open, close) + Math.random() * 20
    const low = Math.min(open, close) - Math.random() * 20
    const volume = Math.floor(Math.random() * 10000)
    
    candles.push({
      time: Math.floor(timestamp.getTime() / 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    })
  }
  
  return { candles, symbol, timeframe }
}

async function fetchOptionChainData(symbol: string, apiKey: string) {
  console.log('Fetching option chain for', symbol)
  
  // Mock option chain data - replace with actual API call
  const strikes = []
  const baseStrike = symbol === 'NIFTY' ? 19700 : 2450
  
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + (i * 50)
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
    })
  }
  
  return { strikes, symbol, spotPrice: baseStrike }
}
