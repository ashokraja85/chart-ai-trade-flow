import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useZerodhaAuth } from './useZerodhaAuth';

export interface OrderRequest {
  tradingsymbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
  product: 'MIS' | 'NRML' | 'CNC';
  variety?: 'regular' | 'amo' | 'co' | 'iceberg';
}

export interface Position {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  buy_quantity: number;
  buy_price: number;
  buy_value: number;
  sell_quantity: number;
  sell_price: number;
  sell_value: number;
  day_buy_quantity: number;
  day_buy_price: number;
  day_buy_value: number;
  day_sell_quantity: number;
  day_sell_price: number;
  day_sell_value: number;
}

export interface Holding {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  product: string;
  price: number;
  quantity: number;
  used_quantity: number;
  t1_quantity: number;
  realised_quantity: number;
  authorised_quantity: number;
  authorised_date: string;
  opening_quantity: number;
  collateral_quantity: number;
  collateral_type: string;
  discrepancy: boolean;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface Order {
  order_id: string;
  exchange_order_id: string;
  parent_order_id: string;
  status: string;
  status_message: string;
  order_timestamp: string;
  exchange_update_timestamp: string;
  exchange_timestamp: string;
  variety: string;
  exchange: string;
  tradingsymbol: string;
  instrument_token: number;
  order_type: string;
  transaction_type: string;
  validity: string;
  product: string;
  quantity: number;
  disclosed_quantity: number;
  price: number;
  trigger_price: number;
  average_price: number;
  filled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
  market_protection: number;
  meta: any;
  tag: string;
}

export const useZerodhaTrading = () => {
  const { accessToken } = useZerodhaAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callTradingAPI = useCallback(async (action: string, params: any = {}) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Calling trading API: ${action}`, params);

      const { data, error: functionError } = await supabase.functions.invoke(
        'zerodha-trading',
        {
          body: {
            action,
            accessToken,
            ...params
          }
        }
      );

      if (functionError) {
        console.error('Trading API function error:', functionError);
        throw new Error(`API Error: ${functionError.message}`);
      }

      if (!data) {
        throw new Error('No data received from trading API');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`${action} completed successfully`);
      return data;
    } catch (err) {
      console.error(`Trading API ${action} error:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const placeOrder = useCallback(async (orderData: OrderRequest) => {
    return await callTradingAPI('place_order', orderData);
  }, [callTradingAPI]);

  const getPositions = useCallback(async (): Promise<{ net: Position[], day: Position[] }> => {
    return await callTradingAPI('get_positions');
  }, [callTradingAPI]);

  const getHoldings = useCallback(async (): Promise<Holding[]> => {
    return await callTradingAPI('get_holdings');
  }, [callTradingAPI]);

  const getOrders = useCallback(async (): Promise<Order[]> => {
    return await callTradingAPI('get_orders');
  }, [callTradingAPI]);

  const modifyOrder = useCallback(async (orderId: string, orderData: Partial<OrderRequest>) => {
    return await callTradingAPI('modify_order', { order_id: orderId, ...orderData });
  }, [callTradingAPI]);

  const cancelOrder = useCallback(async (orderId: string) => {
    return await callTradingAPI('cancel_order', { order_id: orderId });
  }, [callTradingAPI]);

  return {
    placeOrder,
    getPositions,
    getHoldings,
    getOrders,
    modifyOrder,
    cancelOrder,
    loading,
    error
  };
};