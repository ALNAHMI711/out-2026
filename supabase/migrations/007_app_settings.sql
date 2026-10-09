-- OUT 2026: encrypted application integration settings.
-- Values are encrypted by the server with AES-256-GCM before they reach this table.
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_value text,
  is_encrypted boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint app_settings_key_allowed check (setting_key in (
    'LEONARDO_API_KEY','HUGGINGFACE_API_KEY','PRINTFUL_API_KEY','PRINTIFY_API_KEY',
    'STRIPE_SECRET_KEY','STRIPE_PUBLISHABLE_KEY','TIKTOK_ACCESS_TOKEN',
    'INSTAGRAM_ACCESS_TOKEN','FACEBOOK_ACCESS_TOKEN','PINTEREST_ACCESS_TOKEN'
  ))
);
alter table public.app_settings enable row level security;
drop policy if exists app_settings_no_client_access on public.app_settings;
create policy app_settings_no_client_access on public.app_settings
  for all using (false) with check (false);
