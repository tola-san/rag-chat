# ----------------------------------------------------
# Stage 1: Build the TypeScript code
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source files and compile to /app/dist
COPY src ./src
RUN npm run build

# Prune devDependencies to keep only production modules
RUN npm prune --omit=dev

# ----------------------------------------------------
# Stage 2: Production Runtime
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Run as non-root user for security
USER node

# Copy production node_modules from builder
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 5000

# Health check matching your /healthz route
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/healthz || exit 1

CMD ["node", "dist/server.js"]