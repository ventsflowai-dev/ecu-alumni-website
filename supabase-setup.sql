-- =====================================================================
-- ECU Alumni Fellowship — Complete Schema for External Supabase Project
-- =====================================================================
-- INSTRUCTIONS:
-- 1. Create a new Supabase project at https://supabase.com
-- 2. Open the SQL Editor (left sidebar)
-- 3. Paste this entire file and click "Run"
-- 4. Then go to Authentication → Providers and enable Email + Google
-- 5. Copy your project URL and anon (publishable) key into your .env file:
--      VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
--      VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
-- =====================================================================

-- ---------- 1. ENUMS ----------
CREATE TYPE public.app_role         AS ENUM ('admin', 'member');
CREATE TYPE public.profile_status   AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE public.post_status      AS ENUM ('draft', 'published');
CREATE TYPE public.event_timing     AS ENUM ('upcoming', 'past');
CREATE TYPE public.campaign_status  AS ENUM ('active', 'inactive');
CREATE TYPE public.payment_status   AS ENUM ('pending', 'successful', 'failed');
CREATE TYPE public.message_status   AS ENUM ('unread', 'read');

-- ---------- 2. UTILITY FUNCTIONS ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- 3. PROFILES ----------
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE,
  full_name           TEXT NOT NULL DEFAULT '',
  email               TEXT NOT NULL DEFAULT '',
  phone               TEXT,
  graduation_year     INTEGER,
  department          TEXT,
  faculty             TEXT,
  current_city        TEXT,
  current_country     TEXT,
  profession          TEXT,
  workplace           TEXT,
  bio                 TEXT,
  profile_photo_url   TEXT,
  social_links        JSONB DEFAULT '{}'::jsonb,
  show_email_publicly BOOLEAN NOT NULL DEFAULT false,
  show_phone_publicly BOOLEAN NOT NULL DEFAULT false,
  directory_consent   BOOLEAN NOT NULL DEFAULT false,
  subgroups           TEXT,
  status              public.profile_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 4. USER ROLES ----------
CREATE TABLE public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  role        public.app_role NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- has_role() — security-definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ---------- 5. AUTO-CREATE PROFILE + ROLE ON SIGNUP ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- 6. ADMIN RPCs ----------
CREATE OR REPLACE FUNCTION public.set_user_admin(_user_id UUID, _make_admin BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  IF _make_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.set_profile_status(_user_id UUID, _status public.profile_status)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change profile status';
  END IF;
  UPDATE public.profiles SET status = _status, updated_at = now() WHERE user_id = _user_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.set_user_admin(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_profile_status(UUID, public.profile_status) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_user_admin(UUID, BOOLEAN) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.set_profile_status(UUID, public.profile_status) TO authenticated;

-- ---------- 7. CONTENT TABLES ----------
CREATE TABLE public.blog_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  excerpt             TEXT,
  content             TEXT,
  category            TEXT,
  featured_image_url  TEXT,
  author_id           UUID,
  status              public.post_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  short_description   TEXT,
  full_description    TEXT,
  event_date          DATE,
  event_time          TEXT,
  location            TEXT,
  registration_link   TEXT,
  featured_image_url  TEXT,
  event_status        public.event_timing NOT NULL DEFAULT 'upcoming',
  status              public.post_status  NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gallery_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  event_date        DATE,
  location          TEXT,
  cover_image_url   TEXT,
  status            public.post_status NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER gallery_events_set_updated_at BEFORE UPDATE ON public.gallery_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gallery_images (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_event_id  UUID NOT NULL REFERENCES public.gallery_events(id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  caption           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.donation_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  featured_image_url  TEXT,
  target_amount       NUMERIC,
  amount_raised       NUMERIC NOT NULL DEFAULT 0,
  suggested_amounts   NUMERIC[] DEFAULT ARRAY[]::NUMERIC[],
  status              public.campaign_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER donation_campaigns_set_updated_at BEFORE UPDATE ON public.donation_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.donations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID,
  campaign_id                 UUID REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
  donor_name                  TEXT NOT NULL,
  donor_email                 TEXT NOT NULL,
  donor_phone                 TEXT,
  donor_message               TEXT,
  amount                      NUMERIC NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'NGN',
  payment_reference           TEXT,
  flutterwave_transaction_id  TEXT,
  payment_status              public.payment_status NOT NULL DEFAULT 'pending',
  receipt_number              TEXT,
  receipt_pdf_url             TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER donations_set_updated_at BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      public.post_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  message     TEXT NOT NULL,
  status      public.message_status NOT NULL DEFAULT 'unread',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 8. ENABLE RLS ----------
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages    ENABLE ROW LEVEL SECURITY;

-- ---------- 9. RLS POLICIES ----------

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Public can view approved consenting profiles" ON public.profiles
  FOR SELECT TO anon, authenticated USING (status = 'approved' AND directory_consent = true);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()
    AND status = (SELECT status FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blog_posts
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- events
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- gallery_events
CREATE POLICY "Anyone can view published gallery events" ON public.gallery_events
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage gallery events" ON public.gallery_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- gallery_images
CREATE POLICY "Anyone can view images of published galleries" ON public.gallery_images
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.gallery_events ge
            WHERE ge.id = gallery_images.gallery_event_id AND ge.status = 'published')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins manage gallery images" ON public.gallery_images
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- donation_campaigns
CREATE POLICY "Anyone can view active campaigns" ON public.donation_campaigns
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage campaigns" ON public.donation_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- donations
CREATE POLICY "Anyone can create donation" ON public.donations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    payment_status = 'pending' AND amount > 0
    AND char_length(donor_name) BETWEEN 1 AND 200
    AND char_length(donor_email) BETWEEN 3 AND 320
    AND (user_id IS NULL OR user_id = auth.uid())
  );
CREATE POLICY "Users view own donations" ON public.donations
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all donations" ON public.donations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage donations" ON public.donations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- announcements
CREATE POLICY "Authenticated members view published announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- contact_messages
CREATE POLICY "Anyone can submit contact message" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 320
    AND char_length(message) BETWEEN 1 AND 5000
    AND status = 'unread'
  );
CREATE POLICY "Admins view contact messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contact messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------- 10. STORAGE BUCKETS ----------
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-photos',  'profile-photos',  true),
  ('blog-images',     'blog-images',     true),
  ('event-images',    'event-images',    true),
  ('gallery-images',  'gallery-images',  true),
  ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all buckets
CREATE POLICY "Public read all media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('profile-photos','blog-images','event-images','gallery-images','campaign-images'));

-- Authenticated users can upload to their own folder in profile-photos (folder = user_id)
CREATE POLICY "Users upload own profile photo" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users update own profile photo" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users delete own profile photo" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins manage all CMS media buckets
CREATE POLICY "Admins manage CMS media" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('blog-images','event-images','gallery-images','campaign-images')
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id IN ('blog-images','event-images','gallery-images','campaign-images')
    AND public.has_role(auth.uid(), 'admin')
  );

-- ---------- 11. PROMOTE YOUR FIRST ADMIN ----------
-- After signing up your first user via the app, run this in SQL Editor (replace the email):
--
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
--   ON CONFLICT (user_id, role) DO NOTHING;
--
-- =====================================================================
-- DONE. Now go to Authentication → Providers and enable Email + Google.
-- =====================================================================
