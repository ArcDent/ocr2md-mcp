import path from 'node:path';

export type MarkdownInputResult = {
  filePath: string;
  text: string;
};

export type MarkdownDisplayPath = 'absolute' | 'basename' | 'relative';

export type MarkdownOptions = {
  headingLevel?: number;
  displayPath?: MarkdownDisplayPath;
  relativeTo?: string;
};

function basenameForDisplay(filePath: string): string {
  try {
    const url = new URL(filePath);
    return path.posix.basename(url.pathname) || url.hostname || filePath;
  } catch {
    return path.basename(filePath) || filePath;
  }
}

function formatDisplayPath(filePath: string, options: MarkdownOptions): string {
  const displayPath = options.displayPath ?? 'basename';

  if (displayPath === 'absolute') {
    return filePath;
  }

  if (displayPath === 'relative' && options.relativeTo) {
    const relativePath = path.relative(options.relativeTo, filePath);
    return relativePath || basenameForDisplay(filePath);
  }

  return basenameForDisplay(filePath);
}

export function buildMarkdownFromResults(
  results: MarkdownInputResult[],
  options: MarkdownOptions = {},
): string {
  const headingLevel = Math.max(1, Math.min(options.headingLevel ?? 1, 6));
  const headingPrefix = '#'.repeat(headingLevel);

  return results
    .map((result) => {
      const body = result.text.trim() ? result.text : '_No text recognized._';
      return `${headingPrefix} ${formatDisplayPath(result.filePath, options)}\n\n${body}`;
    })
    .join('\n\n');
}

export function buildMarkdownForSingleFile(
  filePath: string,
  text: string,
  options: MarkdownOptions = {},
): string {
  return buildMarkdownFromResults([{ filePath, text }], options);
}
