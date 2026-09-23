# ==============================
# Stage 1: Install dependencies (build-time only, includes devDependencies)
# ==============================
FROM node:22-slim AS deps
WORKDIR /app

# Install openssl and ca-certificates for Prisma and secure package fetching
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile --no-audit --no-fund

# ==============================
# Stage 2: Build Next.js app
# ==============================
FROM deps AS builder
WORKDIR /app

# 1. Copy prisma schema first for better caching
# (Changes to source code won't invalidate prisma generate)
COPY prisma ./prisma
RUN npx prisma generate

# 2. Copy the rest of the application code
COPY . .

# Build Next.js (creates .next/standalone with a self-contained node_modules)
ARG NEXT_PUBLIC_CARTO_API_KEY
ENV NEXT_PUBLIC_CARTO_API_KEY=$NEXT_PUBLIC_CARTO_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Mount .next/cache for incremental compilation across Docker rebuilds
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ==============================
# Stage 3: Production runtime
# Standalone output already bundles the exact node_modules the server needs,
# so nothing is copied from `deps`/`builder` node_modules here.
# ==============================
FROM node:22-slim AS runner
WORKDIR /app

# Install openssl and curl for Prisma runtime and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

# ==============================
# Stage 4: Tools image — Prisma CLI / tsx for one-off ops commands
# (migrate deploy, db push, db seed) run via:
#   docker compose run --rm tools npx prisma migrate deploy
# Not part of the `runner` image, so the app image stays minimal.
# ==============================
FROM deps AS tools
WORKDIR /app

ENV NODE_ENV=production

COPY prisma ./prisma
COPY prisma.config.js ./prisma.config.js
COPY tsconfig.json ./tsconfig.json

RUN npx prisma generate

CMD ["npx", "prisma", "migrate", "deploy"]
