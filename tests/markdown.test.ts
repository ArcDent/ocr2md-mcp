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

    expect(markdown).toContain('## a.jpg');
    expect(markdown).toContain('Hello\nWorld');
    expect(markdown).toContain('## b.jpg');
    expect(markdown).toContain('_No text recognized._');
  });

  it('can render absolute Markdown heading paths', () => {
    const markdown = buildMarkdownFromResults(
      [
        {
          filePath: '/tmp/images/a.jpg',
          text: 'Hello',
        },
      ],
      { displayPath: 'absolute' },
    );

    expect(markdown).toContain('# /tmp/images/a.jpg');
  });

  it('can render paths relative to a configured directory', () => {
    const markdown = buildMarkdownFromResults(
      [
        {
          filePath: '/tmp/images/nested/a.jpg',
          text: 'Hello',
        },
      ],
      { displayPath: 'relative', relativeTo: '/tmp/images' },
    );

    expect(markdown).toContain('# nested/a.jpg');
  });
});
