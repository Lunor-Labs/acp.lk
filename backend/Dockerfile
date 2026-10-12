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

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/api/express/server.js"]