import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SecurityConfig {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  sessionTimeout: number;
  ipWhitelisting: boolean;
  allowedIPs: string[];
}

export const useSecurityManager = () => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    mfaEnabled: false,
    mfaRequired: false,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    ipWhitelisting: false,
    allowedIPs: []
  });
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkMFAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: factors } = await supabase.auth.mfa.listFactors();
      setMfaFactors(factors?.totp || []);
      
      const hasActiveMFA = factors?.totp?.some(factor => factor.status === 'verified');
      setSecurityConfig(prev => ({
        ...prev,
        mfaEnabled: hasActiveMFA || false
      }));
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const enrollMFA = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        throw new Error('MFA enrollment is only available for admin users');
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Trading Dashboard Admin'
      });

      if (error) throw error;

      toast({
        title: "MFA Enrollment Started",
        description: "Scan the QR code with your authenticator app",
      });

      return data;
    } catch (error) {
      console.error('MFA enrollment error:', error);
      toast({
        title: "MFA Enrollment Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async (factorId: string, code: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: factorId,
        code
      });

      if (error) throw error;

      await checkMFAStatus();
      
      toast({
        title: "MFA Verified Successfully",
        description: "Two-factor authentication is now active",
      });

      return data;
    } catch (error) {
      console.error('MFA verification error:', error);
      toast({
        title: "MFA Verification Failed",
        description: error instanceof Error ? error.message : 'Invalid code',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkSessionSecurity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const sessionAge = Date.now() - new Date(session.user.last_sign_in_at || 0).getTime();
      
      if (sessionAge > securityConfig.sessionTimeout) {
        await supabase.auth.signOut();
        toast({
          title: "Session Expired",
          description: "Please sign in again for security",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session security check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    checkMFAStatus();
    
    // Set up session monitoring
    const interval = setInterval(checkSessionSecurity, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  return {
    securityConfig,
    mfaFactors,
    loading,
    enrollMFA,
    verifyMFA,
    checkMFAStatus,
    checkSessionSecurity
  };
};