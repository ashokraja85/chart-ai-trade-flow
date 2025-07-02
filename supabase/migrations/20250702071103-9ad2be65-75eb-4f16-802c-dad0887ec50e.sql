-- Create trades table for portfolio tracking
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('EQUITY', 'OPTION', 'FUTURE')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expiry_date DATE,
  strike_price DECIMAL(10,2),
  option_type TEXT CHECK (option_type IN ('CE', 'PE')),
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  exchange TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EXECUTED' CHECK (status IN ('EXECUTED', 'CANCELLED', 'PENDING')),
  brokerage DECIMAL(8,2) NOT NULL DEFAULT 0,
  taxes DECIMAL(8,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  pnl DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trades" 
ON public.trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" 
ON public.trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.trades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
ON public.trades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for timestamps
CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.trades (
  user_id, order_id, symbol, instrument_type, transaction_type, 
  quantity, price, amount, executed_at, exchange, brokerage, taxes, net_amount
) VALUES 
(
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  'ORD001', 'RELIANCE', 'EQUITY', 'BUY', 
  50, 2500.00, 125000.00, now() - interval '1 day', 'NSE', 25.00, 50.00, 124925.00
),
(
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  'ORD002', 'NIFTY', 'OPTION', 'BUY', 
  100, 150.00, 15000.00, now() - interval '2 hours', 'NSE', 15.00, 30.00, 14955.00
);