import type { TextInClient } from '../textin/client.js';
import type { OcrSuccessResult } from '../textin/types.js';
import { readLocalFile } from '../utils/files.js';

export type OcrFileOptions = {
  character?: string;
  straighten?: boolean;
};

export type OcrFileByPathRunner = (
  filePath: string,
  options?: OcrFileOptions,
) => Promise<OcrSuccessResult>;

export function createOcrFileRunner(client: TextInClient): OcrFileByPathRunner {
  return async (filePath: string, options: OcrFileOptions = {}) => {
    const fileBuffer = await readLocalFile(filePath);
    const result = await client.ocrFile({
      fileBuffer,
      fileName: filePath,
      ...(options.character !== undefined ? { character: options.character } : {}),
      ...(options.straighten !== undefined ? { straighten: options.straighten } : {}),
    });

    return {
      ...result,
      filePath,
    };
  };
}

export async function runOcrFile(
  input: {
    filePath: string;
    character?: string;
    straighten?: boolean;
  },
  deps: {
    ocrFileByPath: OcrFileByPathRunner;
  },
): Promise<OcrSuccessResult> {
  return deps.ocrFileByPath(input.filePath, {
    ...(input.character !== undefined ? { character: input.character } : {}),
    ...(input.straighten !== undefined ? { straighten: input.straighten } : {}),
  });
}
