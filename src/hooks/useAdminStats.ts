import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalTrades: number;
  totalAiAnalyses: number;
  activeUsers: number;
  systemHealth: {
    apiResponseTime: number;
    databaseStatus: 'healthy' | 'warning' | 'error';
    cacheHitRate: number;
    errorRate: number;
  };
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTrades: 0,
    totalAiAnalyses: 0,
    activeUsers: 0,
    systemHealth: {
      apiResponseTime: 0,
      databaseStatus: 'healthy',
      cacheHitRate: 0,
      errorRate: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();

      // Fetch all stats in parallel
      const [
        { count: usersCount },
        { count: tradesCount },
        { count: aiCount },
        { count: activeCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('trades').select('*', { count: 'exact', head: true }),
        supabase.from('ai_usage_logs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const apiResponseTime = Date.now() - startTime;

      // Get cache stats
      const { count: cacheCount } = await supabase
        .from('market_data_cache')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalTrades: tradesCount || 0,
        totalAiAnalyses: aiCount || 0,
        activeUsers: activeCount || 0,
        systemHealth: {
          apiResponseTime,
          databaseStatus: apiResponseTime < 500 ? 'healthy' : apiResponseTime < 1000 ? 'warning' : 'error',
          cacheHitRate: Math.min(95, Math.max(70, 85 + Math.random() * 10)), // Simulated cache hit rate
          errorRate: Math.random() * 2 // Simulated error rate
        }
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setStats(prev => ({
        ...prev,
        systemHealth: {
          ...prev.systemHealth,
          databaseStatus: 'error'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
};