# ==============================
# Stage 1: Install dependencies (build-time only, includes devDependencies)
# ==============================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ==============================
# Stage 2: Build Next.js app
# ==============================
FROM deps AS builder
WORKDIR /app

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (creates .next/standalone with a self-contained node_modules)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ==============================
# Stage 3: Production runtime
# Standalone output already bundles the exact node_modules the server needs,
# so nothing is copied from `deps`/`builder` node_modules here.
# ==============================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

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
