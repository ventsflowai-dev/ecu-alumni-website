REVOKE EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_profile_status(uuid, profile_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_status(uuid, profile_status) TO authenticated;