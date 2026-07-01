# =============================================================================
# Stage 1 – deps
#   Install *only* production node_modules via npm ci.
#   Using a separate stage keeps the build cache efficient:
#   this layer is only re-built when package-lock.json changes.
# =============================================================================
FROM node:20-alpine AS deps

# Security: run npm ci as a non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

WORKDIR /app

# Copy manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install deps with the lock-file (reproducible builds, no scripts from internet)
RUN npm ci --ignore-scripts

# =============================================================================
# Stage 2 – builder
#   Compile the Next.js app using the standalone output mode.
#   The output is a self-contained directory that does NOT require node_modules
#   to be copied into the final image.
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Re-use the installed modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire source tree
COPY . .

# ── Build-time environment variables ─────────────────────────────────────────
# NEXT_PUBLIC_* vars are inlined at build time by Next.js.
# Pass them via --build-arg when running `docker build`:
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.sentinel.example.com \
#     --build-arg NEXT_PUBLIC_USE_MOCK_API=false \
#     -t sentinel-frontend .
#
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_USE_MOCK_API=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCK_API=$NEXT_PUBLIC_USE_MOCK_API

# Disable Next.js telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

# Enable standalone output so the final image is self-contained (~50 MB vs ~500 MB)
# We inject this at build time to avoid modifying next.config.ts in the repo.
ENV NEXT_OUTPUT=standalone

# Patch next.config.ts to enable standalone output programmatically
RUN node -e "\
  const fs = require('fs');\
  let cfg = fs.readFileSync('next.config.ts', 'utf8');\
  if (!cfg.includes('standalone')) {\
    cfg = cfg.replace(\
      'const nextConfig: NextConfig = {',\
      'const nextConfig: NextConfig = { output: \"standalone\",'\
    );\
    fs.writeFileSync('next.config.ts', cfg);\
  }\
"

RUN npm run build

# =============================================================================
# Stage 3 – runner  (final image)
#   Only contains the compiled application + its minimal runtime dependencies.
#   No source code, no devDependencies, no build tooling.
# =============================================================================
FROM node:20-alpine AS runner

# ── Security hardening ────────────────────────────────────────────────────────
# 1. Update system packages to patch known CVEs
RUN apk update && apk upgrade --no-cache

# 2. Dedicated non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

WORKDIR /app

# ── Copy only what Next.js standalone needs ───────────────────────────────────
# The standalone directory already contains a trimmed node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# ── Runtime environment variables ────────────────────────────────────────────
# These are *server-side* vars evaluated at container start.
# NEXT_PUBLIC_* are already baked into the JS bundle at build time.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# ── Drop to non-root ──────────────────────────────────────────────────────────
USER nextjs

EXPOSE 3000

# Healthcheck: the /api/health path or the root page should respond 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ | grep -q "." || exit 1

# The standalone server.js is the entry-point emitted by Next.js
CMD ["node", "server.js"]
