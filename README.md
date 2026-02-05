# Security Hash Monorepo

This repository is a pnpm-managed monorepo with a web front end, API, and shared utilities.

## Production Demo

- URL: https://security-hash.ahmedmegahd.com
- Hosting: AWS EC2 behind Cloudflare

## Structure

- `apps/web`: Next.js front-end application.
- `apps/api`: NestJS backend API.
- `packages/shared`: Shared TypeScript types and utilities.

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

## Running without Docker

Start the API and web app together from the repo root:

```bash
pnpm dev
```

The API will be available at http://localhost:3001 and the web app at http://localhost:3000.

2. Run linting:

   ```bash
   pnpm -r lint
   ```

3. Run tests:

   ```bash
   pnpm -r test
   ```

Each workspace contains its own development scripts for running locally.

## Run with Docker Compose

Build and start the full stack with a single command:

```bash
docker compose up --build
```

The API will be available at http://localhost:3001 and the web app at http://localhost:3000.

## Phase 3: Latency Measurement

Start the stack first (e.g. `pnpm dev`), then run:

```bash
pnpm latency:test
```

Make sure ports `3000` (web) and `3001` (api) are free before running `pnpm dev`.

Results append to `docs/latency-results.md`.

## Tooling

- **pnpm workspaces** for dependency management.
- **ESLint** and **Prettier** for linting and formatting.
- **TypeScript** across all packages.
