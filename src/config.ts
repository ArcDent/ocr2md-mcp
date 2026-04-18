import 'dotenv/config';

export type AppConfig = {
  appId: string;
  secretCode: string;
  baseUrl: string;
  defaultConcurrency: number;
};

export function getConfig(): AppConfig {
  const appId = process.env.TEXTIN_APP_ID?.trim();
  const secretCode = process.env.TEXTIN_SECRET_CODE?.trim();

  if (!appId || !secretCode) {
    throw new Error('Missing TEXTIN_APP_ID or TEXTIN_SECRET_CODE');
  }

  const baseUrl = process.env.TEXTIN_BASE_URL?.trim() || 'https://api.textin.com';
  const defaultConcurrency = Number.parseInt(
    process.env.OCR2MD_DEFAULT_CONCURRENCY?.trim() || '3',
    10,
  );

  return {
    appId,
    secretCode,
    baseUrl,
    defaultConcurrency: Number.isFinite(defaultConcurrency) && defaultConcurrency > 0 ? defaultConcurrency : 3,
  };
}
