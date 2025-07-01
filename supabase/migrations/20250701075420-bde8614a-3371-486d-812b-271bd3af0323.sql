
-- Create table for NSE stocks list (for autocomplete)
CREATE TABLE public.nse_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster search
CREATE INDEX idx_nse_stocks_symbol ON public.nse_stocks(symbol);
CREATE INDEX idx_nse_stocks_company_name ON public.nse_stocks(company_name);

-- Create table for caching market data
CREATE TABLE public.market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'option_chain', 'ohlcv', 'technical_indicators'
  timeframe TEXT, -- '5m', '15m', '1h', '1d' (for OHLCV data)
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cache table
CREATE INDEX idx_market_data_cache_symbol_type ON public.market_data_cache(symbol, data_type);
CREATE INDEX idx_market_data_cache_expires ON public.market_data_cache(expires_at);

-- Create table for user watchlists
CREATE TABLE public.user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  symbols TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nse_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

-- Policies for nse_stocks (public read access)
CREATE POLICY "Anyone can view stocks list" 
  ON public.nse_stocks 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policies for market_data_cache (authenticated users can read)
CREATE POLICY "Authenticated users can view market data cache" 
  ON public.market_data_cache 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policies for user_watchlists
CREATE POLICY "Users can manage their own watchlists" 
  ON public.user_watchlists 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.market_data_cache 
  WHERE expires_at < NOW();
END;
$$;

-- Insert sample NSE stocks data
INSERT INTO public.nse_stocks (symbol, company_name, sector) VALUES
('RELIANCE', 'Reliance Industries Limited', 'Oil & Gas'),
('TCS', 'Tata Consultancy Services Limited', 'Information Technology'),
('HDFCBANK', 'HDFC Bank Limited', 'Banking'),
('INFY', 'Infosys Limited', 'Information Technology'),
('ICICIBANK', 'ICICI Bank Limited', 'Banking'),
('HINDUNILVR', 'Hindustan Unilever Limited', 'FMCG'),
('ITC', 'ITC Limited', 'FMCG'),
('SBIN', 'State Bank of India', 'Banking'),
('BHARTIARTL', 'Bharti Airtel Limited', 'Telecom'),
('KOTAKBANK', 'Kotak Mahindra Bank Limited', 'Banking'),
('NIFTY', 'NIFTY 50', 'Index'),
('BANKNIFTY', 'BANK NIFTY', 'Index'),
('SENSEX', 'BSE SENSEX', 'Index');
