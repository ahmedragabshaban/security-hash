export type HealthStatus = {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
};

export const createHealthStatus = (
  service: string,
  status: HealthStatus['status'],
): HealthStatus => ({
  service,
  status,
  timestamp: new Date().toISOString(),
});

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export const sha1Hex = async (text: string): Promise<string> => {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', encoded);
  return toHex(digest);
};

export const getPrefix = (hash: string): string => hash.slice(0, 5);

export const getSuffix = (hash: string): string => hash.slice(5);
