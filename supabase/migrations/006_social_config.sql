CREATE TABLE IF NOT EXISTS public.social_platforms_config (
 id UUID DEFAULT gen_random_uuid() PRIMARY KEY, platform_name TEXT UNIQUE NOT NULL,
 access_token TEXT, account_name TEXT, is_active BOOLEAN DEFAULT false,
 last_post TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.social_platforms_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS social_config_admin_only ON public.social_platforms_config;
-- App uses its own signed JWT; direct Supabase client access is intentionally denied.
CREATE POLICY social_config_admin_only ON public.social_platforms_config FOR ALL USING(false) WITH CHECK(false);
