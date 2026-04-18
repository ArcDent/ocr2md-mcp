import { buildMarkdownFromResults, type MarkdownOptions } from '../utils/markdown.js';
import { runOcrBatch, type OcrBatchDependencies, type OcrBatchInput } from './ocrBatch.js';

export type OcrToMarkdownInput = OcrBatchInput & MarkdownOptions;

export async function runOcrToMarkdown(
  input: OcrToMarkdownInput,
  deps: OcrBatchDependencies,
) {
  const batchResult = await runOcrBatch(input, deps);
  const successfulResults = batchResult.results
    .filter((result) => result.status === 'success')
    .map((result) => ({ filePath: result.filePath, text: result.text }));

  return {
    ...batchResult,
    markdown: buildMarkdownFromResults(successfulResults, {
      ...(input.headingLevel !== undefined ? { headingLevel: input.headingLevel } : {}),
    }),
  };
}
