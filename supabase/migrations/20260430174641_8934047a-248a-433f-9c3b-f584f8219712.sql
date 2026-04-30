
-- Fix: set search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke direct EXECUTE on SECURITY DEFINER helpers (still callable from RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Replace permissive contact_messages INSERT policy with one that has explicit length sanity checks
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 320
    AND char_length(message) BETWEEN 1 AND 5000
    AND status = 'unread'
  );

-- Replace permissive donations INSERT policy with stricter check
DROP POLICY IF EXISTS "Anyone can create donation" ON public.donations;
CREATE POLICY "Anyone can create donation"
  ON public.donations FOR INSERT TO anon, authenticated
  WITH CHECK (
    payment_status = 'pending'
    AND amount > 0
    AND char_length(donor_name) BETWEEN 1 AND 200
    AND char_length(donor_email) BETWEEN 3 AND 320
    AND (user_id IS NULL OR user_id = auth.uid())
  );
