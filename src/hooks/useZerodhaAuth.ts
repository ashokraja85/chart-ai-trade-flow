
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ZerodhaAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

interface ZerodhaTokenData {
  id: string;
  user_id: string;
  access_token: string;
  api_key: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export const useZerodhaAuth = () => {
  const [authState, setAuthState] = useState<ZerodhaAuthState>({
    isAuthenticated: false,
    accessToken: null,
    loading: true,
    error: null
  });

  const fetchTokenFromSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('Fetching Zerodha token from Supabase for user:', user.id);
      
      const { data: tokenData, error } = await supabase
        .from('zerodha_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching token from Supabase:', error);
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }

      if (tokenData) {
        console.log('Found Zerodha token in Supabase');
        setAuthState({
          isAuthenticated: true,
          accessToken: tokenData.access_token,
          loading: false,
          error: null
        });
      } else {
        console.log('No Zerodha token found in Supabase');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error in fetchTokenFromSupabase:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch token'
      }));
    }
  };

  useEffect(() => {
    // Fetch token from Supabase on component mount
    fetchTokenFromSupabase();

    // Check for callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const status = urlParams.get('status');

    if (requestToken && status === 'success') {
      console.log('Found request token in URL, generating session...');
      generateSession(requestToken);
    }
  }, []);

  const initiateLogin = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Initiating Zerodha login...');

      const { data, error } = await supabase.functions.invoke('zerodha-auth', {
        body: { action: 'get_login_url' }
      });

      console.log('Login URL response:', data, error);

      if (error) {
        console.error('Login URL error:', error);
        throw new Error(`Failed to get login URL: ${error.message}`);
      }
      
      if (data?.error) {
        console.error('Login URL data error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.login_url) {
        console.error('No login URL received:', data);
        throw new Error('No login URL received from server');
      }

      // Redirect to Zerodha login
      console.log('Redirecting to Zerodha login:', data.login_url);
      window.location.href = data.login_url;
    } catch (error) {
      console.error('Login initiation error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  };

  const generateSession = async (requestToken: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Generating session with request token:', requestToken);

      const { data, error } = await supabase.functions.invoke('zerodha-auth', {
        body: { action: 'generate_session', request_token: requestToken }
      });

      console.log('Session generation response:', data, error);

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const accessToken = data.access_token;
      console.log('Access token received, storing in Supabase');

      // Store access token in Supabase instead of localStorage
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error: insertError } = await supabase
        .from('zerodha_tokens')
        .upsert({
          user_id: user.id,
          access_token: accessToken,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error storing token in Supabase:', insertError);
        throw new Error('Failed to store access token');
      }
      
      setAuthState({
        isAuthenticated: true,
        accessToken: accessToken,
        loading: false,
        error: null
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('Authentication successful! Token stored in Supabase');
    } catch (error) {
      console.error('Session generation error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out and clearing stored token from Supabase');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Deactivate token in Supabase
        await supabase
          .from('zerodha_tokens')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }
      
      // Also clear localStorage for backward compatibility
      localStorage.removeItem('zerodha_access_token');
      
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    ...authState,
    initiateLogin,
    logout
  };
};
