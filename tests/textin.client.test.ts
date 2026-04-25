import { afterEach, describe, expect, it, vi } from 'vitest';

import { TextInClient } from '../src/textin/client.js';

describe('TextInClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes TextIn pages into lines and text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          message: 'success',
          result: {
            pages: [
              {
                lines: [{ text: 'line 1' }, { text: 'line 2' }],
              },
            ],
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'req-1',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    const result = await client.ocrFile({
      fileBuffer: Buffer.from('test-image'),
      fileName: 'sample.jpg',
    });

    expect(result.lines).toEqual(['line 1', 'line 2']);
    expect(result.text).toBe('line 1\nline 2');
    expect(result.requestId).toBe('req-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes TextIn page and line metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            message: 'success',
            x_request_id: 'body-req',
            result: {
              pages: [
                {
                  width: 800,
                  height: 600,
                  angle: 90,
                  lines: [
                    {
                      text: ' stamped ',
                      score: 0.98,
                      type: 'stamp',
                      position: [1, 2, 3, 4],
                      handwritten: 0,
                    },
                  ],
                },
              ],
            },
          }),
          {
            status: 200,
            headers: {
              'x-request-id': 'header-req',
            },
          },
        ),
      ),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    const result = await client.ocrFile({
      fileBuffer: Buffer.from('test-image'),
      fileName: 'sample.jpg',
    });

    expect(result.lines).toEqual(['stamped']);
    expect(result.text).toBe('stamped');
    expect(result.requestId).toBe('body-req');
    expect(result.pages).toEqual([
      {
        index: 0,
        width: 800,
        height: 600,
        angle: 90,
        lines: [
          {
            text: 'stamped',
            score: 0.98,
            type: 'stamp',
            position: [1, 2, 3, 4],
            handwritten: false,
          },
        ],
      },
    ]);
  });

  it('sends online URLs with text/plain content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          message: 'success',
          result: { pages: [{ lines: [{ text: 'remote' }] }] },
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    const result = await client.ocrUrl({
      url: 'https://example.com/a.pdf',
      character: false,
      straighten: true,
    });

    expect(result.text).toBe('remote');
    expect(result.filePath).toBe('https://example.com/a.pdf');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.textin.com/ai/service/v2/recognize/multipage?character=0&straighten=1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'text/plain',
        }),
        body: 'https://example.com/a.pdf',
      }),
    );
  });

  it('encodes TextIn boolean options as official numeric query parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          message: 'success',
          result: { pages: [] },
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    await client.ocrFile({
      fileBuffer: Buffer.from('test-image'),
      fileName: 'sample.jpg',
      character: true,
      straighten: false,
    });

    const requestedUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(requestedUrl.searchParams.get('character')).toBe('1');
    expect(requestedUrl.searchParams.get('straighten')).toBe('0');
  });

  it('throws a readable error when TextIn responds with a failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"message":"bad request"}', {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        }),
      ),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    await expect(
      client.ocrFile({
        fileBuffer: Buffer.from('test-image'),
        fileName: 'sample.jpg',
      }),
    ).rejects.toThrow('TextIn request failed with status 400: {"message":"bad request"}');
  });

  it('truncates long HTTP error bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('x'.repeat(1200), {
          status: 502,
        }),
      ),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    await expect(
      client.ocrFile({
        fileBuffer: Buffer.from('test-image'),
        fileName: 'sample.jpg',
      }),
    ).rejects.toThrow(`${'x'.repeat(1000)}...`);
  });

  it('throws a readable timeout error when the request is aborted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
      requestTimeoutMs: 1,
    });

    await expect(
      client.ocrFile({
        fileBuffer: Buffer.from('test-image'),
        fileName: 'sample.jpg',
      }),
    ).rejects.toThrow('TextIn request timed out after 1ms');
  });

  it('throws when TextIn returns HTTP 200 but a provider-level error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 500,
            message: 'provider failure',
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      ),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    await expect(
      client.ocrFile({
        fileBuffer: Buffer.from('test-image'),
        fileName: 'sample.jpg',
      }),
    ).rejects.toThrow('TextIn returned code 500: provider failure');
  });

  it('adds a non-retry hint when TextIn reports QPS limiting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 40306,
            message: 'qps limit exceeded',
          }),
          { status: 200 },
        ),
      ),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    await expect(
      client.ocrFile({
        fileBuffer: Buffer.from('test-image'),
        fileName: 'sample.jpg',
      }),
    ).rejects.toThrow(
      'TextIn returned code 40306: qps limit exceeded. Hint: QPS limit exceeded; do not retry immediately because repeated retries may trigger IP rate control.',
    );
  });

  it('adds the official file-size hint when TextIn rejects upload size', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 40302,
            message: 'file too large',
          }),
          { status: 200 },
        ),
      ),
    );

    const client = new TextInClient({
      appId: 'app',
      secretCode: 'secret',
      baseUrl: 'https://api.textin.com',
    });

    await expect(
      client.ocrFile({
        fileBuffer: Buffer.from('test-image'),
        fileName: 'sample.jpg',
      }),
    ).rejects.toThrow(
      'TextIn returned code 40302: file too large. Hint: TextIn supports files up to 500MB (524288000 bytes).',
    );
  });
});
