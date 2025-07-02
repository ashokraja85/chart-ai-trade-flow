import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector?: string;
  industry?: string;
  isin?: string;
  market_cap?: number;
  active: boolean;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistStock {
  id: string;
  wishlist_id: string;
  stock_symbol: string;
  position: number;
  added_at: string;
  stock?: Stock;
}

export const useWishlists = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchStocks = useCallback(async (query: string): Promise<Stock[]> => {
    try {
      setLoading(true);
      setError(null);
      console.log('Searching stocks with query:', query);

      const { data, error } = await supabase
        .from('stock_master')
        .select('*')
        .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
        .eq('active', true)
        .order('symbol')
        .limit(20);

      console.log('Stock search result:', { data, error });
      if (error) {
        console.error('Stock search error:', error);
        throw error;
      }
      return (data || []) as Stock[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search stocks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserWishlists = useCallback(async (): Promise<Wishlist[]> => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching user wishlists...');

      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .order('created_at', { ascending: true });

      console.log('Wishlists fetch result:', { data, error });
      if (error) {
        console.error('Wishlists fetch error:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wishlists';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWishlist = useCallback(async (name: string): Promise<Wishlist> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('wishlists')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wishlist';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWishlist = useCallback(async (id: string, name: string): Promise<Wishlist> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('wishlists')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update wishlist';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWishlist = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete wishlist';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWishlistStocks = useCallback(async (wishlistId: string): Promise<WishlistStock[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('wishlist_stocks')
        .select(`
          *,
          stock:stock_master(*)
        `)
        .eq('wishlist_id', wishlistId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as WishlistStock[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wishlist stocks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addStockToWishlist = useCallback(async (wishlistId: string, stockSymbol: string): Promise<WishlistStock> => {
    try {
      setLoading(true);
      setError(null);

      // Get the next position
      const { data: existingStocks } = await supabase
        .from('wishlist_stocks')
        .select('position')
        .eq('wishlist_id', wishlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (existingStocks?.[0]?.position || 0) + 1;

      const { data, error } = await supabase
        .from('wishlist_stocks')
        .insert([{
          wishlist_id: wishlistId,
          stock_symbol: stockSymbol,
          position: nextPosition
        }])
        .select(`
          *,
          stock:stock_master(*)
        `)
        .single();

      if (error) throw error;
      return data as WishlistStock;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add stock to wishlist';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeStockFromWishlist = useCallback(async (wishlistStockId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('wishlist_stocks')
        .delete()
        .eq('id', wishlistStockId);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove stock from wishlist';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderWishlistStocks = useCallback(async (wishlistId: string, stockIds: string[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Update positions for all stocks
      const updates = stockIds.map((stockId, index) => 
        supabase
          .from('wishlist_stocks')
          .update({ position: index + 1 })
          .eq('id', stockId)
      );

      await Promise.all(updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder stocks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    searchStocks,
    getUserWishlists,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    getWishlistStocks,
    addStockToWishlist,
    removeStockFromWishlist,
    reorderWishlistStocks
  };
};