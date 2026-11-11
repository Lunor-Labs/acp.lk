# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install all dependencies (including drizzle-kit for migrations)
COPY package.json package-lock.json ./
RUN npm ci

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Copy drizzle config for migrations
COPY drizzle.config.js ./

EXPOSE 3001

CMD ["node", "dist/api/express/server.js"]