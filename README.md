# OUT 2026

Secure Next.js 14 foundation for the OUT premium POD platform.

Security: bcrypt password hashes, signed HttpOnly JWT sessions, server-only Supabase service role, RLS, server-side order pricing, and no committed production secrets.

Setup: copy .env.local.example to .env.local; generate password hashes with `node scripts/hash-password.mjs '<password>'`; generate JWT_SECRET with `openssl rand -base64 32`; run migrations `supabase/migrations/001_init.sql` through `006_social_config.sql` in order; configure `APP_ENCRYPTION_KEY` using `openssl rand -base64 32` before saving POD/social API credentials. Keep that key private and stable: rotating it without re-encrypting stored credentials makes them unreadable; then run `npm install && npm run build`.

<!-- Vercel deploy trigger: 2026-10-09 -->
