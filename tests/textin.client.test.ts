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
    ).rejects.toThrow('TextIn request failed with status 400');
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
});
