FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GMAPS_KEY
ARG NEXT_PUBLIC_LANDING_URL
ARG NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL
ARG NEXT_PUBLIC_PAYROLL_URL
ARG NEXT_PUBLIC_PROJECT_MANAGEMENT_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_GMAPS_KEY=$NEXT_PUBLIC_GMAPS_KEY
ENV NEXT_PUBLIC_LANDING_URL=$NEXT_PUBLIC_LANDING_URL
ENV NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL=$NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL
ENV NEXT_PUBLIC_PAYROLL_URL=$NEXT_PUBLIC_PAYROLL_URL
ENV NEXT_PUBLIC_PROJECT_MANAGEMENT_URL=$NEXT_PUBLIC_PROJECT_MANAGEMENT_URL

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
