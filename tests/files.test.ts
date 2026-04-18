import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveInputFiles } from '../src/utils/files.js';

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
});
