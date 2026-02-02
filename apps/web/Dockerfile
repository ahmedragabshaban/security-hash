# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Allow overriding the API base URL at build time
ARG API_BASE_URL=http://api:3001
ENV API_BASE_URL=${API_BASE_URL}

# Install dependencies across the workspace
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --ignore-scripts

# Copy source and build the web app
COPY packages ./packages
COPY apps ./apps
RUN pnpm --filter @security-hash/web run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ARG API_BASE_URL=http://api:3001
ENV NODE_ENV=production
ENV API_BASE_URL=${API_BASE_URL}

RUN corepack enable

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./

EXPOSE 3000
CMD ["pnpm", "--filter", "@security-hash/web", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
