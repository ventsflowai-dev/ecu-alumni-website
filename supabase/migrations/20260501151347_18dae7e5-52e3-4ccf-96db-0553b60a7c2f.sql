-- Helper: admins can promote/demote members to admin role
CREATE OR REPLACE FUNCTION public.set_user_admin(_user_id uuid, _make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;

  IF _make_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'::app_role;
  END IF;
END;
$$;

-- Helper: admins can change a profile's status (approved / pending / rejected)
CREATE OR REPLACE FUNCTION public.set_profile_status(_user_id uuid, _status profile_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change profile status';
  END IF;
  UPDATE public.profiles SET status = _status, updated_at = now() WHERE user_id = _user_id;
END;
$$;