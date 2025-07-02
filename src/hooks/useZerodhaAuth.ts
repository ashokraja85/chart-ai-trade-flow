
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
    console.log('Stored token found:', storedToken ? 'Yes' : 'No');
    
    if (storedToken && storedToken.trim() !== '') {
      console.log('Setting authenticated state with stored token');
      setAuthState({
        isAuthenticated: true,
        accessToken: storedToken,
        loading: false,
        error: null
      });
    } else {
      console.log('No valid stored token found');
      setAuthState(prev => ({ ...prev, loading: false }));
    }

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

      if (error) throw error;
      if (data.error) throw new Error(data.error);

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

      // Store access token
      console.log('Storing access token in localStorage');
      localStorage.setItem('zerodha_access_token', data.access_token);
      
      setAuthState({
        isAuthenticated: true,
        accessToken: data.access_token,
        loading: false,
        error: null
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('Authentication successful!');
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
    console.log('Logging out and clearing stored token');
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
