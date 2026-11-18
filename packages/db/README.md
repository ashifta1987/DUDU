# @dudu/db

Supabase schema (SQL migrations), generated types, seed data and RLS tests.

```
migrations/            SQL migrations — the source of truth (supabase/migrations → ../migrations)
supabase/config.toml   Supabase CLI config
src/types.gen.ts       generated Database types (pnpm gen:types)
src/views.ts           typed payloads for v_family_dashboard / v_admin_overview
src/device-secret.ts   HMAC device-secret hashing used by the gateway
seed/                  deterministic demo data + sinks (Supabase, PGlite)
tests/                 migration, RLS (rls.test.sql) and seed tests on PGlite — no Docker needed
```

## Apply migrations to the remote project

```bash
cd packages/db
npx supabase@latest login                                   # opens the browser
npx supabase@latest link --project-ref hhfczwecdgdfxgxalsfl # prompts for the DB password
npx supabase@latest db push                                 # applies migrations/*.sql
```

Then load demo data (uses `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`):

```bash
SEED_OWNER_EMAIL=you@example.com pnpm --filter @dudu/db seed
```

`SEED_OWNER_EMAIL` should be the Google / magic-link email you will use for the admin dashboard.
Optional `SEED_PARENT_PASSWORD` gives seeded parents an email+password login for local testing.
Device credentials for the fake device are written to `packages/db/.seed-devices.local.json` (gitignored).

## Conventions

- Weekday: `0 = Sunday … 6 = Saturday`. Business timezone `Asia/Kolkata`.
- Storage paths start with the family id: `homework/{family}/{child}/…`, `snapshots/{family}/{device}/…`.
- `public.is_service()` authorises service-role callers; `public.is_trusted()` is only for guard triggers.
- Devices never use a user JWT: the gateway verifies `device_secret_hash` and uses the service role.

## Tests

```bash
pnpm --filter @dudu/db test          # migrations + rls.test.sql + seed, in PGlite
pnpm --filter @dudu/db gen:types     # regenerate src/types.gen.ts after changing migrations
```
