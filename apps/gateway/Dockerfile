# syntax=docker/dockerfile:1
# Build from the monorepo root:  docker build -f apps/gateway/Dockerfile .
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @dudu/gateway... \
 && pnpm --filter @dudu/gateway build \
 && pnpm deploy --filter @dudu/gateway --prod --legacy /out

FROM node:20-slim AS runtime
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY --from=build /out .
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
USER node
CMD ["node", "dist/index.js"]
