import { describe, expect, it, vi } from 'vitest';

import { runOcrUrl } from '../src/tools/ocrUrl.js';

describe('runOcrUrl', () => {
  it('runs OCR for an HTTPS URL through TextIn URL mode', async () => {
    const ocrUrl = vi.fn().mockResolvedValue({
      filePath: 'https://example.com/a.pdf',
      status: 'success' as const,
      lines: ['hello'],
      text: 'hello',
      markdown: '# a.pdf\n\nhello',
      pages: [],
      raw: { code: 200 },
    });

    const result = await runOcrUrl(
      {
        url: 'https://example.com/a.pdf',
        character: true,
        straighten: false,
      },
      { ocrUrl },
    );

    expect(result.text).toBe('hello');
    expect(ocrUrl).toHaveBeenCalledWith('https://example.com/a.pdf', {
      character: true,
      straighten: false,
    });
  });

  it('rejects non-http URLs', async () => {
    const ocrUrl = vi.fn();

    await expect(
      runOcrUrl({ url: 'file:///tmp/a.pdf' }, { ocrUrl }),
    ).rejects.toThrow('OCR URL must use http or https');

    expect(ocrUrl).not.toHaveBeenCalled();
  });
});
