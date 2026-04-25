import { access, readFile, stat } from 'node:fs/promises';
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
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }
}

export type ReadLocalFileOptions = {
  maxFileBytes?: number;
};

export async function readLocalFile(filePath: string, options: ReadLocalFileOptions = {}): Promise<Buffer> {
  await ensureReadableFile(filePath);
  if (options.maxFileBytes !== undefined) {
    const fileStat = await stat(filePath);
    if (fileStat.size > options.maxFileBytes) {
      throw new Error(
        `File exceeds maximum OCR upload size: ${fileStat.size} bytes > ${options.maxFileBytes} bytes`,
      );
    }
  }
  return readFile(filePath);
}
