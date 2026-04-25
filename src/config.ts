import 'dotenv/config';

export type AppConfig = {
  appId: string;
  secretCode: string;
  baseUrl: string;
  defaultConcurrency: number;
  requestTimeoutMs: number;
  maxFileBytes: number;
};

const DEFAULT_TEXTIN_BASE_URL = 'https://api.textin.com';
const DEFAULT_CONCURRENCY = 3;
export const OCR2MD_MAX_CONCURRENCY = 10;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export const TEXTIN_MAX_FILE_BYTES = 524_288_000;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value?.trim() || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function validateBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('TEXTIN_BASE_URL must be a valid http(s) URL');
  }
}

export function getConfig(): AppConfig {
  const appId = process.env.TEXTIN_APP_ID?.trim();
  const secretCode = process.env.TEXTIN_SECRET_CODE?.trim();

  if (!appId || !secretCode) {
    throw new Error('Missing TEXTIN_APP_ID or TEXTIN_SECRET_CODE');
  }

  const baseUrl = validateBaseUrl(process.env.TEXTIN_BASE_URL?.trim() || DEFAULT_TEXTIN_BASE_URL);
  const defaultConcurrency = parsePositiveInteger(
    process.env.OCR2MD_DEFAULT_CONCURRENCY,
    DEFAULT_CONCURRENCY,
  );
  const requestTimeoutMs = parsePositiveInteger(
    process.env.TEXTIN_REQUEST_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
  );
  const maxFileBytes = Math.min(
    parsePositiveInteger(process.env.OCR2MD_MAX_FILE_BYTES, TEXTIN_MAX_FILE_BYTES),
    TEXTIN_MAX_FILE_BYTES,
  );

  return {
    appId,
    secretCode,
    baseUrl,
    defaultConcurrency: Math.min(defaultConcurrency, OCR2MD_MAX_CONCURRENCY),
    requestTimeoutMs,
    maxFileBytes,
  };
}
