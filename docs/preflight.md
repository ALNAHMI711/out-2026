# OUT 2026 — Pre-Flight Checklist

## CI / Code
- [ ] Latest GitHub Actions run is green
- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds or is explicitly tracked
- [ ] Static scan passes
- [ ] No production secrets committed

## Supabase
- [ ] Migration 001 applied
- [ ] Migration 002 applied
- [ ] RLS enabled on application tables
- [ ] `locks` contains required lock rows
- [ ] Storage bucket configuration verified

## Functional
- [ ] Public homepage and shop load
- [ ] Products API returns real database data
- [ ] Admin authentication works
- [ ] Lock verification works
- [ ] Design generation returns a real provider result
- [ ] Order creation validates server-side prices
- [ ] Order appears in admin history

## Deployment
- [ ] Production environment variables configured outside Git
- [ ] HTTPS enabled
- [ ] Production smoke test passes
- [ ] Logs contain no credentials/tokens
