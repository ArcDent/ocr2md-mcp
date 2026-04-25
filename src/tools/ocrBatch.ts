import type { OcrBatchResult, OcrResult } from '../textin/types.js';
import type { OcrFileByPathRunner } from './ocrFile.js';
import { resolveInputFiles } from '../utils/files.js';

export type OcrBatchInput = {
  filePaths?: string[];
  directory?: string;
  pattern?: string;
  concurrency?: number;
  character?: boolean;
  straighten?: boolean;
  displayPath?: 'absolute' | 'basename' | 'relative';
  relativeTo?: string;
};

export type OcrBatchDependencies = {
  resolveInputFiles: typeof resolveInputFiles;
  ocrFileByPath: OcrFileByPathRunner;
  defaultConcurrency?: number;
  maxConcurrency?: number;
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const normalizedConcurrency = Math.max(1, concurrency);
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function consume(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const item = items[currentIndex]!;
      results[currentIndex] = await worker(item, currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(normalizedConcurrency, items.length) }, () => consume()),
  );

  return results;
}

function hasInputSource(input: OcrBatchInput): boolean {
  return Boolean(input.directory?.trim()) || Boolean(input.filePaths?.some((filePath) => filePath.trim()));
}

function normalizeConcurrency(concurrency: number, maxConcurrency: number): number {
  return Math.min(Math.max(1, concurrency), Math.max(1, maxConcurrency));
}

export async function runOcrBatch(
  input: OcrBatchInput,
  deps: OcrBatchDependencies,
): Promise<OcrBatchResult> {
  if (!hasInputSource(input)) {
    throw new Error('Provide filePaths or directory');
  }

  const files = await deps.resolveInputFiles({
    ...(input.filePaths !== undefined ? { filePaths: input.filePaths } : {}),
    ...(input.directory !== undefined ? { directory: input.directory } : {}),
    ...(input.pattern !== undefined ? { pattern: input.pattern } : {}),
  });

  if (files.length === 0) {
    throw new Error('No input files found');
  }

  const concurrency = normalizeConcurrency(
    input.concurrency ?? deps.defaultConcurrency ?? 3,
    deps.maxConcurrency ?? 10,
  );

  const results = await mapWithConcurrency(files, concurrency, async (filePath) => {
    try {
      return await deps.ocrFileByPath(filePath, {
        ...(input.character !== undefined ? { character: input.character } : {}),
        ...(input.straighten !== undefined ? { straighten: input.straighten } : {}),
        ...(input.displayPath !== undefined ? { displayPath: input.displayPath } : {}),
        ...(input.relativeTo !== undefined ? { relativeTo: input.relativeTo } : {}),
      });
    } catch (error) {
      return {
        filePath,
        status: 'error' as const,
        error: toErrorMessage(error),
      };
    }
  });

  const summary = {
    total: results.length,
    succeeded: results.filter((result) => result.status === 'success').length,
    failed: results.filter((result) => result.status === 'error').length,
  };

  return { results, summary };
}
