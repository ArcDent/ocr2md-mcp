import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

import fg from 'fast-glob';

export const DEFAULT_FILE_PATTERN = '**/*.{jpg,jpeg,png,bmp,pdf,tiff,tif,gif}';

export type ResolveFilesInput = {
  filePaths?: string[];
  directory?: string;
  pattern?: string;
};

export async function resolveInputFiles(input: ResolveFilesInput): Promise<string[]> {
  const explicit = (input.filePaths ?? []).map((filePath) => path.resolve(filePath));
  const discovered = input.directory
    ? await fg(input.pattern ?? DEFAULT_FILE_PATTERN, {
        cwd: input.directory,
        absolute: true,
        onlyFiles: true,
      })
    : [];

  return Array.from(new Set([...explicit, ...discovered])).sort();
}

export async function ensureReadableFile(filePath: string): Promise<void> {
  await access(filePath, constants.R_OK);
}

export async function readLocalFile(filePath: string): Promise<Buffer> {
  await ensureReadableFile(filePath);
  return readFile(filePath);
}
