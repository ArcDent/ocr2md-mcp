import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createOcrFileRunner } from '../src/tools/ocrFile.js';

describe('createOcrFileRunner', () => {
  it('keeps the markdown heading path unchanged', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ocr2md-file-'));
    const filePath = join(dir, 'a.jpg');
    await writeFile(filePath, 'image');

    const fakeClient = {
      ocrFile: async () => ({
        filePath,
        status: 'success' as const,
        lines: ['hello'],
        text: 'hello',
        markdown: `# ${filePath}\n\nhello`,
        raw: { code: 200, message: 'success' },
      }),
    };

    const runner = createOcrFileRunner(fakeClient as never);
    const result = await runner(filePath);

    expect(result.markdown).toBe(`# ${filePath}\n\nhello`);
  });

  it('passes display path options to the TextIn client request', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ocr2md-file-'));
    const filePath = join(dir, 'a.jpg');
    await writeFile(filePath, 'image');

    const fakeClient = {
      ocrFile: async (request: { displayPath?: 'absolute' | 'basename' | 'relative'; relativeTo?: string }) => ({
        filePath,
        status: 'success' as const,
        lines: ['hello'],
        text: 'hello',
        markdown: request.displayPath === 'relative' ? '# a.jpg\n\nhello' : `# ${filePath}\n\nhello`,
        pages: [],
        raw: { code: 200, message: 'success' },
      }),
    };

    const runner = createOcrFileRunner(fakeClient as never);
    const result = await runner(filePath, { displayPath: 'relative', relativeTo: dir });

    expect(result.markdown).toBe('# a.jpg\n\nhello');
  });
});
