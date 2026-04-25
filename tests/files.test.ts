import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readLocalFile, resolveInputFiles } from '../src/utils/files.js';

describe('resolveInputFiles', () => {
  it('collects matching files from an explicit list and a directory glob', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ocr2md-files-'));
    const nested = join(dir, 'nested');
    await mkdir(nested);

    const first = join(dir, 'a.jpg');
    const second = join(nested, 'b.png');
    const ignored = join(dir, 'note.txt');

    await writeFile(first, 'a');
    await writeFile(second, 'b');
    await writeFile(ignored, 'c');

    const files = await resolveInputFiles({
      filePaths: [first],
      directory: dir,
      pattern: '**/*.{jpg,png}',
    });

    expect(files).toEqual([first, second]);
  });

  it('rejects files larger than the configured maximum before reading', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ocr2md-files-'));
    const filePath = join(dir, 'large.pdf');
    await writeFile(filePath, 'abcdef');

    await expect(readLocalFile(filePath, { maxFileBytes: 5 })).rejects.toThrow(
      'File exceeds maximum OCR upload size: 6 bytes > 5 bytes',
    );
  });
});
