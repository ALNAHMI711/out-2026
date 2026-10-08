# OUT 2026

Secure Next.js 14 foundation for the OUT premium POD platform.

Security: bcrypt password hashes, signed HttpOnly JWT sessions, server-only Supabase service role, RLS, server-side order pricing, and no committed production secrets.

Setup: copy .env.local.example to .env.local; generate password hashes with `node scripts/hash-password.mjs '<password>'`; generate JWT_SECRET with `openssl rand -base64 32`; run `supabase/migrations/001_init.sql`; then run `npm install && npm run build`.
