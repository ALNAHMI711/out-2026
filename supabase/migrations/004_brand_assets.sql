INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('brand-assets','brand-assets',true,2097152,ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public=true,file_size_limit=2097152,allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'];
DROP POLICY IF EXISTS brand_assets_public_read ON storage.objects;
CREATE POLICY brand_assets_public_read ON storage.objects FOR SELECT USING (bucket_id='brand-assets');
-- Uploads go through the role-checked server route; no direct client writes.
CREATE TABLE IF NOT EXISTS public.brand_settings (
 id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),
 brand_logo_url text, brand_title text NOT NULL DEFAULT '', contact_email text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brand_settings_no_client_access ON public.brand_settings;
CREATE POLICY brand_settings_no_client_access ON public.brand_settings FOR ALL USING(false) WITH CHECK(false);
