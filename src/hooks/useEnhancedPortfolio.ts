import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Trade {
  id: string;
  user_id: string;
  order_id: string;
  symbol: string;
  instrument_type: 'EQUITY' | 'OPTION' | 'FUTURE';
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  expiry_date?: string;
  strike_price?: number;
  option_type?: 'CE' | 'PE';
  executed_at: string;
  exchange: string;
  status: 'EXECUTED' | 'CANCELLED' | 'PENDING';
  brokerage: number;
  taxes: number;
  net_amount: number;
  pnl?: number;
  created_at: string;
}

export interface PortfolioPosition {
  symbol: string;
  instrument_type: 'EQUITY' | 'OPTION' | 'FUTURE';
  expiry_date?: string;
  strike_price?: number;
  option_type?: 'CE' | 'PE';
  total_quantity: number;
  avg_price: number;
  current_price: number;
  investment_value: number;
  current_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_pnl: number;
  day_change: number;
  day_change_percent: number;
  trades: Trade[];
}

export interface PortfolioSummary {
  total_investment: number;
  current_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  day_pnl: number;
  day_pnl_percent: number;
  realized_pnl: number;
  unrealized_pnl: number;
}

export const useEnhancedPortfolio = () => {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async (): Promise<Trade[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('executed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculatePortfolioPositions = useCallback((tradesList: Trade[]): PortfolioPosition[] => {
    const positionMap = new Map<string, PortfolioPosition>();

    tradesList.forEach(trade => {
      if (trade.status !== 'EXECUTED') return;

      const positionKey = `${trade.symbol}_${trade.instrument_type}_${trade.expiry_date || ''}_${trade.strike_price || ''}_${trade.option_type || ''}`;
      
      if (!positionMap.has(positionKey)) {
        positionMap.set(positionKey, {
          symbol: trade.symbol,
          instrument_type: trade.instrument_type,
          expiry_date: trade.expiry_date,
          strike_price: trade.strike_price,
          option_type: trade.option_type,
          total_quantity: 0,
          avg_price: 0,
          current_price: trade.price, // Would be updated with live data
          investment_value: 0,
          current_value: 0,
          unrealized_pnl: 0,
          realized_pnl: 0,
          total_pnl: 0,
          day_change: 0,
          day_change_percent: 0,
          trades: []
        });
      }

      const position = positionMap.get(positionKey)!;
      position.trades.push(trade);

      if (trade.transaction_type === 'BUY') {
        const newQuantity = position.total_quantity + trade.quantity;
        const newInvestment = position.investment_value + trade.net_amount;
        position.avg_price = newInvestment / newQuantity;
        position.total_quantity = newQuantity;
        position.investment_value = newInvestment;
      } else {
        position.total_quantity -= trade.quantity;
        position.realized_pnl += (trade.price - position.avg_price) * trade.quantity;
      }

      // Calculate current values (would use live prices in production)
      position.current_value = position.total_quantity * position.current_price;
      position.unrealized_pnl = position.current_value - (position.total_quantity * position.avg_price);
      position.total_pnl = position.realized_pnl + position.unrealized_pnl;
    });

    return Array.from(positionMap.values()).filter(pos => pos.total_quantity > 0);
  }, []);

  const calculatePortfolioSummary = useCallback((positionsList: PortfolioPosition[]): PortfolioSummary => {
    const total_investment = positionsList.reduce((sum, pos) => sum + pos.investment_value, 0);
    const current_value = positionsList.reduce((sum, pos) => sum + pos.current_value, 0);
    const realized_pnl = positionsList.reduce((sum, pos) => sum + pos.realized_pnl, 0);
    const unrealized_pnl = positionsList.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);
    const total_pnl = realized_pnl + unrealized_pnl;
    const day_pnl = positionsList.reduce((sum, pos) => sum + pos.day_change, 0);

    return {
      total_investment,
      current_value,
      total_pnl,
      total_pnl_percent: total_investment > 0 ? (total_pnl / total_investment) * 100 : 0,
      day_pnl,
      day_pnl_percent: current_value > 0 ? (day_pnl / current_value) * 100 : 0,
      realized_pnl,
      unrealized_pnl
    };
  }, []);

  const exportToCSV = useCallback((data: Trade[], filename: string = 'trade_history.csv') => {
    const headers = [
      'Date',
      'Symbol',
      'Instrument Type',
      'Transaction Type',
      'Quantity',
      'Price',
      'Amount',
      'Brokerage',
      'Taxes',
      'Net Amount',
      'P&L',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(trade => [
        new Date(trade.executed_at).toLocaleDateString(),
        trade.symbol,
        trade.instrument_type,
        trade.transaction_type,
        trade.quantity,
        trade.price,
        trade.amount,
        trade.brokerage,
        trade.taxes,
        trade.net_amount,
        trade.pnl || 0,
        trade.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const refreshPortfolio = useCallback(async () => {
    try {
      const tradesList = await fetchTrades();
      const positionsList = calculatePortfolioPositions(tradesList);
      const portfolioSummary = calculatePortfolioSummary(positionsList);

      setTrades(tradesList);
      setPositions(positionsList);
      setSummary(portfolioSummary);
    } catch (err) {
      console.error('Failed to refresh portfolio:', err);
    }
  }, [fetchTrades, calculatePortfolioPositions, calculatePortfolioSummary]);

  useEffect(() => {
    refreshPortfolio();
    
    // Set up real-time updates (every 5 seconds for now)
    const interval = setInterval(refreshPortfolio, 5000);
    return () => clearInterval(interval);
  }, [refreshPortfolio]);

  return {
    positions,
    trades,
    summary,
    loading,
    error,
    refreshPortfolio,
    exportToCSV
  };
};