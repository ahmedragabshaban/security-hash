# API Service

NestJS service exposing health and configuration-driven endpoints.

## Running locally

Install dependencies from the repo root:

```bash
pnpm install
```

Start the API in development mode:

```bash
pnpm --filter @security-hash/api start:dev
```

The service listens on `PORT` (defaults to `3001`). Verify health:

```bash
curl http://localhost:3001/health
```

## Configuration

Environment variables accepted by the service:

- `HIBP_BASE_URL` (default: `https://api.pwnedpasswords.com`)
- `HIBP_ADD_PADDING` (default: `false`) — when enabled, sends `Add-Padding: true` to HIBP
- `CACHE_TTL_SECONDS` (default: `86400`)
- `REQUEST_TIMEOUT_MS` (default: `5000`)
- `RATE_LIMIT_TTL_SECONDS` (default: `60`)
- `RATE_LIMIT_MAX_REQUESTS` (default: `60`)
- `PORT` (default: `3001`)
