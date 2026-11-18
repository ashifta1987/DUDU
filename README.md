# DuDu™ – Your AI Buddy

Monorepo for everything that is not device firmware: marketing site, parent web app, child companion,
admin dashboard, Supabase backend, device WebSocket gateway and AI pipeline.

```
apps/
  web/        Next.js 15 (App Router) · Tailwind v4 · shadcn/ui
              route groups: (marketing) /  ·  (parent) /app  ·  (child) /kid  ·  (admin) /admin
  gateway/    Fastify + ws device gateway (audio streaming) → Fly.io
packages/
  config/     shared ESLint / TypeScript configs
  ui/         design tokens (tokens.ts) + shared components (<DuDuFace/>, <DuDuWordmark/>)
  db/         Supabase migrations, generated types, seed, server client
  ai/         STT / LLM / TTS / vision adapters + cost metering
docs/         runbooks
```

## Requirements

- Node 20+ (`.nvmrc`), pnpm (`corepack enable`)
- Supabase project `hhfczwecdgdfxgxalsfl` (or your own), Supabase CLI for migrations

## Setup

```bash
pnpm install
cp .env.example .env.local      # fill in keys; apps/web and apps/gateway symlink to it
pnpm dev                        # web on :3000, gateway on :8787
```

`NEXT_PUBLIC_SUPABASE_URL` is the project base URL (`https://<ref>.supabase.co`) — **not** the `/rest/v1/` URL.
`NEXT_PUBLIC_SUPABASE_ANON_KEY` takes the publishable key (`sb_publishable_…`);
`SUPABASE_SERVICE_ROLE_KEY` takes the secret key (`sb_secret_…`, server/gateway only).

## Scripts

| Command          | What it does                         |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Run all apps in dev mode (Turborepo) |
| `pnpm build`     | Production builds                    |
| `pnpm lint`      | ESLint across the workspace          |
| `pnpm typecheck` | `tsc --noEmit` across the workspace  |
| `pnpm test`      | Vitest unit tests                    |
| `pnpm format`    | Prettier                             |

Useful routes in dev: `/`, `/brand` (tokens + all 39 face states), `/app`, `/kid`, `/admin`,
gateway `http://localhost:8787/healthz`.

## Deploy

- **Web** → Vercel (root directory `apps/web`).
- **Gateway** → Fly.io, from the repo root:
  `fly deploy --config apps/gateway/fly.toml --dockerfile apps/gateway/Dockerfile .`
- **DB** → `supabase db push` (GitHub Actions on `main`).
