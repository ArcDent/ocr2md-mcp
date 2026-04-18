import { describe, expect, it } from 'vitest';

import { buildMarkdownFromResults } from '../src/utils/markdown.js';

describe('buildMarkdownFromResults', () => {
  it('renders file headings and a fallback message for empty text', () => {
    const markdown = buildMarkdownFromResults(
      [
        {
          filePath: 'images/a.jpg',
          text: 'Hello\nWorld',
        },
        {
          filePath: 'images/b.jpg',
          text: '',
        },
      ],
      { headingLevel: 2 },
    );

    expect(markdown).toContain('## images/a.jpg');
    expect(markdown).toContain('Hello\nWorld');
    expect(markdown).toContain('## images/b.jpg');
    expect(markdown).toContain('_No text recognized._');
  });
});
