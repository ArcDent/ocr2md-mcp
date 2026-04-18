import { buildMarkdownForSingleFile } from '../utils/markdown.js';
import type {
  OcrFileRequest,
  OcrSuccessResult,
  TextInApiResponse,
  TextInClientConfig,
} from './types.js';

function normalizeLines(payload: TextInApiResponse): string[] {
  return (payload.result?.pages ?? [])
    .flatMap((page) => page.lines ?? [])
    .map((line) => line.text?.trim() ?? '')
    .filter(Boolean);
}

function buildQueryString(request: OcrFileRequest): string {
  const params = new URLSearchParams();

  if (request.character) {
    params.set('character', request.character);
  }

  if (typeof request.straighten === 'boolean') {
    params.set('straighten', String(request.straighten));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export class TextInClient {
  constructor(private readonly config: TextInClientConfig) {}

  async ocrFile(request: OcrFileRequest): Promise<OcrSuccessResult> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/ai/service/v2/recognize/multipage${buildQueryString(request)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-ti-app-id': this.config.appId,
        'x-ti-secret-code': this.config.secretCode,
        'content-type': 'application/octet-stream',
      },
      body: new Uint8Array(request.fileBuffer),
    });

    if (!response.ok) {
      throw new Error(`TextIn request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as TextInApiResponse;

    if ((payload.code ?? 500) !== 200) {
      throw new Error(`TextIn returned code ${payload.code ?? 'unknown'}: ${payload.message ?? 'unknown error'}`);
    }

    const lines = normalizeLines(payload);
    const text = lines.join('\n');
    const requestId = response.headers.get('x-request-id') ?? undefined;

    return {
      filePath: request.fileName,
      status: 'success',
      lines,
      text,
      markdown: buildMarkdownForSingleFile(request.fileName, text),
      raw: payload,
      ...(requestId ? { requestId } : {}),
    };
  }
}
