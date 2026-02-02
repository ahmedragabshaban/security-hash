# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Install dependencies using workspace context
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --ignore-scripts

# Copy source code and build the API
COPY packages ./packages
COPY apps ./apps
RUN pnpm --filter @security-hash/api run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./

EXPOSE 3001
CMD ["pnpm", "--filter", "@security-hash/api", "start"]
