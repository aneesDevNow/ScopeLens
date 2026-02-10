FROM node:20-slim AS base

# ── Dependencies ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# ── Build ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1


ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_RESELLER_URL=https://reseller.scopelens.ai
ARG NEXT_PUBLIC_DIRECT_PAYMENT=false

# Build-time env vars (needed for Next.js build)
ARG SUPABASE_SERVICE_ROLE_KEY
ARG COOKIE_ENCRYPTION_KEY
ARG S3_ENDPOINT
ARG S3_ACCESS_KEY
ARG S3_SECRET_KEY
ARG S3_BUCKET_NAME
ARG S3_BUCKET_FOLDER_DOCUMENTS
ARG S3_BUCKET_FOLDER_REPORTS

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_RESELLER_URL=$NEXT_PUBLIC_RESELLER_URL
ENV NEXT_PUBLIC_DIRECT_PAYMENT=$NEXT_PUBLIC_DIRECT_PAYMENT

RUN npm run build

# ── Production ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
