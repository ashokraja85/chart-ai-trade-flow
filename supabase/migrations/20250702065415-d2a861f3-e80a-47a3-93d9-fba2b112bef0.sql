-- Create stock_master table for NSE/BSE stocks
CREATE TABLE public.stock_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL CHECK (exchange IN ('NSE', 'BSE')),
  sector TEXT,
  industry TEXT,
  isin TEXT,
  market_cap BIGINT,
  active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast symbol lookups
CREATE INDEX idx_stock_master_symbol ON public.stock_master(symbol);
CREATE INDEX idx_stock_master_exchange ON public.stock_master(exchange);
CREATE INDEX idx_stock_master_active ON public.stock_master(active);

-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wishlist_stocks table
CREATE TABLE public.wishlist_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL REFERENCES public.stock_master(symbol) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(wishlist_id, stock_symbol)
);

-- Create indexes for performance
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlist_stocks_wishlist_id ON public.wishlist_stocks(wishlist_id);
CREATE INDEX idx_wishlist_stocks_position ON public.wishlist_stocks(wishlist_id, position);

-- Enable RLS
ALTER TABLE public.stock_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_stocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_master (public read access)
CREATE POLICY "Anyone can view stocks" ON public.stock_master
  FOR SELECT USING (true);

-- RLS Policies for wishlists
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wishlists" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists" ON public.wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wishlist_stocks
CREATE POLICY "Users can view their own wishlist stocks" ON public.wishlist_stocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wishlists 
      WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add stocks to their wishlists" ON public.wishlist_stocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists 
      WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their wishlist stocks" ON public.wishlist_stocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.wishlists 
      WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their wishlist stocks" ON public.wishlist_stocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.wishlists 
      WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

-- Function to enforce wishlist limits
CREATE OR REPLACE FUNCTION public.check_wishlist_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has 3 wishlists (for INSERT on wishlists)
  IF TG_TABLE_NAME = 'wishlists' AND TG_OP = 'INSERT' THEN
    IF (SELECT COUNT(*) FROM public.wishlists WHERE user_id = NEW.user_id) >= 3 THEN
      RAISE EXCEPTION 'Maximum 3 wishlists allowed per user';
    END IF;
  END IF;
  
  -- Check if wishlist already has 50 stocks (for INSERT on wishlist_stocks)
  IF TG_TABLE_NAME = 'wishlist_stocks' AND TG_OP = 'INSERT' THEN
    IF (SELECT COUNT(*) FROM public.wishlist_stocks WHERE wishlist_id = NEW.wishlist_id) >= 50 THEN
      RAISE EXCEPTION 'Maximum 50 stocks allowed per wishlist';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce limits
CREATE TRIGGER enforce_wishlist_limits
  BEFORE INSERT ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.check_wishlist_limits();

CREATE TRIGGER enforce_wishlist_stock_limits
  BEFORE INSERT ON public.wishlist_stocks
  FOR EACH ROW EXECUTE FUNCTION public.check_wishlist_limits();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample NSE stocks to get started
INSERT INTO public.stock_master (symbol, name, exchange, sector, industry) VALUES
('RELIANCE', 'Reliance Industries Limited', 'NSE', 'Oil Gas & Consumable Fuels', 'Refineries'),
('TCS', 'Tata Consultancy Services Limited', 'NSE', 'IT Services', 'Software'),
('HDFCBANK', 'HDFC Bank Limited', 'NSE', 'Banks', 'Private Sector Bank'),
('ICICIBANK', 'ICICI Bank Limited', 'NSE', 'Banks', 'Private Sector Bank'),
('HINDUNILVR', 'Hindustan Unilever Limited', 'NSE', 'Personal Products', 'Personal Care'),
('INFY', 'Infosys Limited', 'NSE', 'IT Services', 'Software'),
('ITC', 'ITC Limited', 'NSE', 'Tobacco', 'Cigarettes'),
('SBIN', 'State Bank of India', 'NSE', 'Banks', 'Public Sector Bank'),
('BHARTIARTL', 'Bharti Airtel Limited', 'NSE', 'Diversified Telecommunication Services', 'Telecom'),
('KOTAKBANK', 'Kotak Mahindra Bank Limited', 'NSE', 'Banks', 'Private Sector Bank');