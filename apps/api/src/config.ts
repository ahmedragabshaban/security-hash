const DEFAULT_HIBP_BASE_URL = 'https://api.pwnedpasswords.com';
const DEFAULT_CACHE_TTL_SECONDS = 86400;
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_PORT = 3001;
const DEFAULT_RATE_LIMIT_TTL_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;
const DEFAULT_HIBP_ADD_PADDING = false;

const parseNumberOrDefault = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBooleanOrDefault = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

export interface AppConfig {
  hibpBaseUrl: string;
  hibpAddPadding: boolean;
  cacheTtlSeconds: number;
  requestTimeoutMs: number;
  rateLimitTtlSeconds: number;
  rateLimitMaxRequests: number;
  port: number;
}

export const APP_CONFIG = 'APP_CONFIG';

export const loadConfig = (): AppConfig => ({
  hibpBaseUrl: process.env.HIBP_BASE_URL ?? DEFAULT_HIBP_BASE_URL,
  hibpAddPadding: parseBooleanOrDefault(process.env.HIBP_ADD_PADDING, DEFAULT_HIBP_ADD_PADDING),
  cacheTtlSeconds: parseNumberOrDefault(
    process.env.CACHE_TTL_SECONDS,
    DEFAULT_CACHE_TTL_SECONDS,
  ),
  requestTimeoutMs: parseNumberOrDefault(
    process.env.REQUEST_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
  ),
  rateLimitTtlSeconds: parseNumberOrDefault(
    process.env.RATE_LIMIT_TTL_SECONDS,
    DEFAULT_RATE_LIMIT_TTL_SECONDS,
  ),
  rateLimitMaxRequests: parseNumberOrDefault(
    process.env.RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  ),
  port: parseNumberOrDefault(process.env.PORT, DEFAULT_PORT),
});
