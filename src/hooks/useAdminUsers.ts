import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string;
  email_confirmed_at: string;
  trade_count: number;
  ai_usage_count: number;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with trade and AI usage counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get trade counts for each user
      const userIds = profiles?.map(p => p.id) || [];
      const { data: tradeCounts } = await supabase
        .from('trades')
        .select('user_id')
        .in('user_id', userIds);

      // Get AI usage counts
      const { data: aiCounts } = await supabase
        .from('ai_usage_logs')
        .select('user_id')
        .in('user_id', userIds);

      // Combine data
      const enrichedUsers: AdminUser[] = profiles?.map(profile => {
        const tradeCount = tradeCounts?.filter(t => t.user_id === profile.id).length || 0;
        const aiUsageCount = aiCounts?.filter(a => a.user_id === profile.id).length || 0;
        
        return {
          ...profile,
          trade_count: tradeCount,
          ai_usage_count: aiUsageCount,
          last_sign_in_at: profile.created_at, // Placeholder since we can't access auth.users
          email_confirmed_at: profile.created_at // Placeholder
        };
      }) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: "User role updated successfully"
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users: filteredUsers,
    loading,
    searchTerm,
    setSearchTerm,
    updateUserRole,
    refetch: fetchUsers
  };
};