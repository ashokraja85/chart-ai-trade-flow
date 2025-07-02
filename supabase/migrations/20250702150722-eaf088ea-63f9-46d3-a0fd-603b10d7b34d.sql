-- Fix audit trigger to handle user creation during signup
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID, handle case where it might be NULL (during signup)
  current_user_id := auth.uid();
  
  -- Only log if we have a valid user ID (skip during initial user creation)
  IF current_user_id IS NOT NULL THEN
    PERFORM public.log_security_event(
      TG_OP,
      TG_TABLE_NAME,
      true,
      jsonb_build_object(
        'old', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
      )
    );
  END IF;
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$;

-- Also fix the log_security_event function to handle NULL user_id
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_resource TEXT,
  p_success BOOLEAN DEFAULT true,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Only log if we have a valid user ID
  IF current_user_id IS NOT NULL THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      resource,
      success,
      details
    ) VALUES (
      current_user_id,
      p_action,
      p_resource,
      p_success,
      p_details
    ) RETURNING id INTO audit_id;
  END IF;
  
  RETURN audit_id;
END;
$$;