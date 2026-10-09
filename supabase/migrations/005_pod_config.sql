CREATE TABLE IF NOT EXISTS public.pod_platforms_config (
 id UUID DEFAULT gen_random_uuid() PRIMARY KEY, platform_name TEXT UNIQUE NOT NULL,
 api_type TEXT NOT NULL CHECK(api_type IN ('api','rpa')), api_key TEXT,
 is_active BOOLEAN DEFAULT false, last_tested TIMESTAMPTZ, test_status TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pod_platforms_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pod_config_admin_only ON public.pod_platforms_config;
-- App uses its own signed JWT; direct Supabase client access is intentionally denied.
CREATE POLICY pod_config_admin_only ON public.pod_platforms_config FOR ALL USING(false) WITH CHECK(false);
