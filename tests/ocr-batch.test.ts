import { describe, expect, it, vi } from 'vitest';

import { runOcrBatch } from '../src/tools/ocrBatch.js';

describe('runOcrBatch', () => {
  it('requires explicit file paths or a directory', async () => {
    const resolveInputFiles = vi.fn().mockResolvedValue([]);
    const ocrFileByPath = vi.fn();

    await expect(
      runOcrBatch(
        {},
        {
          resolveInputFiles,
          ocrFileByPath,
        },
      ),
    ).rejects.toThrow('Provide filePaths or directory');

    expect(resolveInputFiles).not.toHaveBeenCalled();
    expect(ocrFileByPath).not.toHaveBeenCalled();
  });

  it('keeps partial success when one file fails', async () => {
    const resolveInputFiles = vi
      .fn()
      .mockResolvedValue(['/tmp/a.jpg', '/tmp/b.jpg']);

    const ocrFileByPath = vi.fn(async (filePath: string) => {
      if (filePath.endsWith('a.jpg')) {
        return {
          filePath,
          status: 'success' as const,
          lines: ['hello'],
          text: 'hello',
          markdown: '# /tmp/a.jpg\n\nhello',
          raw: { code: 200 },
          requestId: 'req-a',
        };
      }

      throw new Error('network down');
    });

    const result = await runOcrBatch(
      {
        filePaths: ['/tmp/a.jpg', '/tmp/b.jpg'],
        concurrency: 2,
      },
      {
        resolveInputFiles,
        ocrFileByPath,
      },
    );

    expect(result.summary).toEqual({ total: 2, succeeded: 1, failed: 1 });
    expect(result.results[0]).toMatchObject({
      filePath: '/tmp/a.jpg',
      status: 'success',
    });
    expect(result.results[1]).toMatchObject({
      filePath: '/tmp/b.jpg',
      status: 'error',
      error: 'network down',
    });
  });

  it('uses the configured default concurrency when input concurrency is omitted', async () => {
    const resolveInputFiles = vi
      .fn()
      .mockResolvedValue(['/tmp/a.jpg', '/tmp/b.jpg', '/tmp/c.jpg']);

    let active = 0;
    let maxActive = 0;

    const ocrFileByPath = vi.fn(async (filePath: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;

      return {
        filePath,
        status: 'success' as const,
        lines: [filePath],
        text: filePath,
        markdown: `# ${filePath}`,
        raw: { code: 200 },
      };
    });

    const result = await runOcrBatch(
      {
        filePaths: ['/tmp/a.jpg', '/tmp/b.jpg', '/tmp/c.jpg'],
      },
      {
        resolveInputFiles,
        ocrFileByPath,
        defaultConcurrency: 1,
      },
    );

    expect(result.summary).toEqual({ total: 3, succeeded: 3, failed: 0 });
    expect(maxActive).toBe(1);
  });

  it('normalizes zero or negative concurrency to one', async () => {
    const resolveInputFiles = vi
      .fn()
      .mockResolvedValue(['/tmp/a.jpg', '/tmp/b.jpg', '/tmp/c.jpg']);

    let active = 0;
    let maxActive = 0;

    const ocrFileByPath = vi.fn(async (filePath: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;

      return {
        filePath,
        status: 'success' as const,
        lines: [filePath],
        text: filePath,
        markdown: `# ${filePath}`,
        pages: [],
        raw: { code: 200 },
      };
    });

    const result = await runOcrBatch(
      {
        filePaths: ['/tmp/a.jpg', '/tmp/b.jpg', '/tmp/c.jpg'],
        concurrency: 0,
      },
      {
        resolveInputFiles,
        ocrFileByPath,
      },
    );

    expect(result.summary).toEqual({ total: 3, succeeded: 3, failed: 0 });
    expect(maxActive).toBe(1);
  });

  it('caps excessive concurrency to the configured maximum', async () => {
    const resolveInputFiles = vi
      .fn()
      .mockResolvedValue(['/tmp/a.jpg', '/tmp/b.jpg', '/tmp/c.jpg', '/tmp/d.jpg']);

    let active = 0;
    let maxActive = 0;

    const ocrFileByPath = vi.fn(async (filePath: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;

      return {
        filePath,
        status: 'success' as const,
        lines: [filePath],
        text: filePath,
        markdown: `# ${filePath}`,
        pages: [],
        raw: { code: 200 },
      };
    });

    const result = await runOcrBatch(
      {
        filePaths: ['/tmp/a.jpg', '/tmp/b.jpg', '/tmp/c.jpg', '/tmp/d.jpg'],
        concurrency: 999,
      },
      {
        resolveInputFiles,
        ocrFileByPath,
        maxConcurrency: 2,
      },
    );

    expect(result.summary).toEqual({ total: 4, succeeded: 4, failed: 0 });
    expect(maxActive).toBe(2);
  });
});
