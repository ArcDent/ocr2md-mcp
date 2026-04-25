import { afterEach, describe, expect, it } from 'vitest';

import { getConfig } from '../src/config.js';

const ORIGINAL_ENV = { ...process.env };

describe('getConfig', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('validates the TextIn base URL', async () => {
    process.env.TEXTIN_APP_ID = 'app';
    process.env.TEXTIN_SECRET_CODE = 'secret';
    process.env.TEXTIN_BASE_URL = 'not-a-url';

    expect(() => getConfig()).toThrow('TEXTIN_BASE_URL must be a valid http(s) URL');
  });

  it('parses timeout and max file size environment variables', async () => {
    process.env.TEXTIN_APP_ID = 'app';
    process.env.TEXTIN_SECRET_CODE = 'secret';
    process.env.TEXTIN_REQUEST_TIMEOUT_MS = '12345';
    process.env.OCR2MD_MAX_FILE_BYTES = '1024';

    expect(getConfig()).toMatchObject({
      requestTimeoutMs: 12345,
      maxFileBytes: 1024,
    });
  });

  it('caps the max file size at the official TextIn 500MB limit', async () => {
    process.env.TEXTIN_APP_ID = 'app';
    process.env.TEXTIN_SECRET_CODE = 'secret';
    process.env.OCR2MD_MAX_FILE_BYTES = '999999999';

    expect(getConfig()).toMatchObject({
      maxFileBytes: 524_288_000,
    });
  });

  it('caps default concurrency at the configured safe maximum', async () => {
    process.env.TEXTIN_APP_ID = 'app';
    process.env.TEXTIN_SECRET_CODE = 'secret';
    process.env.OCR2MD_DEFAULT_CONCURRENCY = '999';

    expect(getConfig()).toMatchObject({
      defaultConcurrency: 10,
    });
  });
});
