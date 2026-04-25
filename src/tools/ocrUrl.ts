import type { TextInClient } from '../textin/client.js';
import type { OcrSuccessResult } from '../textin/types.js';
import type { OcrFileOptions } from './ocrFile.js';

export type OcrUrlOptions = Omit<OcrFileOptions, 'maxFileBytes'>;

export type OcrUrlRunner = (
  url: string,
  options?: OcrUrlOptions,
) => Promise<OcrSuccessResult>;

function validateHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('OCR URL must use http or https');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('OCR URL must use http or https');
  }
}

export function createOcrUrlRunner(client: TextInClient): OcrUrlRunner {
  return async (url: string, options: OcrUrlOptions = {}) => {
    validateHttpUrl(url);
    return client.ocrUrl({
      url,
      ...(options.character !== undefined ? { character: options.character } : {}),
      ...(options.straighten !== undefined ? { straighten: options.straighten } : {}),
      ...(options.displayPath !== undefined ? { displayPath: options.displayPath } : {}),
      ...(options.relativeTo !== undefined ? { relativeTo: options.relativeTo } : {}),
    });
  };
}

export async function runOcrUrl(
  input: {
    url: string;
    character?: boolean;
    straighten?: boolean;
    displayPath?: 'absolute' | 'basename' | 'relative';
    relativeTo?: string;
  },
  deps: {
    ocrUrl: OcrUrlRunner;
  },
): Promise<OcrSuccessResult> {
  validateHttpUrl(input.url);
  return deps.ocrUrl(input.url, {
    ...(input.character !== undefined ? { character: input.character } : {}),
    ...(input.straighten !== undefined ? { straighten: input.straighten } : {}),
    ...(input.displayPath !== undefined ? { displayPath: input.displayPath } : {}),
    ...(input.relativeTo !== undefined ? { relativeTo: input.relativeTo } : {}),
  });
}
