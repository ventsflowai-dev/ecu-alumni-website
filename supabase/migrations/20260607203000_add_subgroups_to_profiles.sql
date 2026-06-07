-- Migration: Add subgroups column to profiles and update handle_new_user trigger to save metadata
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subgroups TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    department,
    faculty,
    graduation_year,
    subgroups
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'faculty',
    NULLIF(NEW.raw_user_meta_data->>'graduation_year', '')::integer,
    NEW.raw_user_meta_data->>'subgroups'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
