
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ZerodhaAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export const useZerodhaAuth = () => {
  const [authState, setAuthState] = useState<ZerodhaAuthState>({
    isAuthenticated: false,
    accessToken: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check for stored access token
    const storedToken = localStorage.getItem('zerodha_access_token');
    if (storedToken) {
      setAuthState({
        isAuthenticated: true,
        accessToken: storedToken,
        loading: false,
        error: null
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }

    // Check for callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const status = urlParams.get('status');

    if (requestToken && status === 'success') {
      generateSession(requestToken);
    }
  }, []);

  const initiateLogin = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.functions.invoke('zerodha-auth', {
        body: { action: 'get_login_url' }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Redirect to Zerodha login
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

      const { data, error } = await supabase.functions.invoke('zerodha-auth', {
        body: { action: 'generate_session', request_token: requestToken }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Store access token
      localStorage.setItem('zerodha_access_token', data.access_token);
      
      setAuthState({
        isAuthenticated: true,
        accessToken: data.access_token,
        loading: false,
        error: null
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Session generation error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('zerodha_access_token');
    setAuthState({
      isAuthenticated: false,
      accessToken: null,
      loading: false,
      error: null
    });
  };

  return {
    ...authState,
    initiateLogin,
    logout
  };
};
