export type MarkdownInputResult = {
  filePath: string;
  text: string;
};

export type MarkdownOptions = {
  headingLevel?: number;
};

export function buildMarkdownFromResults(
  results: MarkdownInputResult[],
  options: MarkdownOptions = {},
): string {
  const headingLevel = Math.max(1, Math.min(options.headingLevel ?? 1, 6));
  const headingPrefix = '#'.repeat(headingLevel);

  return results
    .map((result) => {
      const body = result.text.trim() ? result.text : '_No text recognized._';
      return `${headingPrefix} ${result.filePath}\n\n${body}`;
    })
    .join('\n\n');
}

export function buildMarkdownForSingleFile(filePath: string, text: string): string {
  return buildMarkdownFromResults([{ filePath, text }]);
}
