import { buildMarkdownForSingleFile } from '../utils/markdown.js';
import type {
  OcrFileRequest,
  OcrPage,
  OcrSuccessResult,
  OcrUrlRequest,
  TextInApiResponse,
  TextInClientConfig,
} from './types.js';

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_ERROR_BODY_LENGTH = 1000;

const TEXTIN_ERROR_HINTS = new Map<number, string>([
  [40302, 'TextIn supports files up to 500MB (524288000 bytes).'],
  [40306, 'QPS limit exceeded; do not retry immediately because repeated retries may trigger IP rate control.'],
]);

function normalizeLines(payload: TextInApiResponse): string[] {
  return (payload.result?.pages ?? [])
    .flatMap((page) => page.lines ?? [])
    .map((line) => line.text?.trim() ?? '')
    .filter(Boolean);
}

function normalizePages(payload: TextInApiResponse): OcrPage[] {
  return (payload.result?.pages ?? []).map((page, index) => ({
    index,
    ...(page.width !== undefined ? { width: page.width } : {}),
    ...(page.height !== undefined ? { height: page.height } : {}),
    ...(page.angle !== undefined ? { angle: page.angle } : {}),
    lines: (page.lines ?? [])
      .map((line) => {
        const text = line.text?.trim() ?? '';
        return {
          text,
          ...(line.score !== undefined ? { score: line.score } : {}),
          ...(line.type !== undefined ? { type: line.type } : {}),
          ...(line.position !== undefined ? { position: line.position } : {}),
          ...(line.angle !== undefined ? { angle: line.angle } : {}),
          ...(line.direction !== undefined ? { direction: line.direction } : {}),
          ...(line.handwritten !== undefined ? { handwritten: Boolean(line.handwritten) } : {}),
          ...(line.char_scores !== undefined ? { charScores: line.char_scores } : {}),
          ...(line.char_centers !== undefined ? { charCenters: line.char_centers } : {}),
          ...(line.char_positions !== undefined ? { charPositions: line.char_positions } : {}),
          ...(line.char_candidates !== undefined ? { charCandidates: line.char_candidates } : {}),
          ...(line.char_candidates_score !== undefined
            ? { charCandidatesScore: line.char_candidates_score }
            : {}),
        };
      })
      .filter((line) => Boolean(line.text)),
  }));
}

function buildQueryString(request: Pick<OcrFileRequest, 'character' | 'straighten'>): string {
  const params = new URLSearchParams();

  if (typeof request.character === 'boolean') {
    params.set('character', request.character ? '1' : '0');
  }

  if (typeof request.straighten === 'boolean') {
    params.set('straighten', request.straighten ? '1' : '0');
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function truncateErrorBody(body: string): string {
  return body.length > MAX_ERROR_BODY_LENGTH
    ? `${body.slice(0, MAX_ERROR_BODY_LENGTH)}...`
    : body;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export class TextInClient {
  constructor(private readonly config: TextInClientConfig) {}

  private async postToTextIn(
    request: OcrFileRequest | OcrUrlRequest,
    body: BodyInit,
    contentType: 'application/octet-stream' | 'text/plain',
  ): Promise<Response> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/ai/service/v2/recognize/multipage${buildQueryString(request)}`;
    const requestTimeoutMs = this.config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-ti-app-id': this.config.appId,
          'x-ti-secret-code': this.config.secretCode,
          'content-type': contentType,
        },
        body,
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(`TextIn request timed out after ${requestTimeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = truncateErrorBody(await response.text());
      throw new Error(`TextIn request failed with status ${response.status}${body ? `: ${body}` : ''}`);
    }

    return response;
  }

  private async handleResponse(
    response: Response,
    filePath: string,
    options: Pick<OcrFileRequest, 'displayPath' | 'relativeTo'> = {},
  ): Promise<OcrSuccessResult> {

    const payload = (await response.json()) as TextInApiResponse;

    if ((payload.code ?? 500) !== 200) {
      const code = payload.code ?? 'unknown';
      const hint = typeof code === 'number' ? TEXTIN_ERROR_HINTS.get(code) : undefined;
      throw new Error(
        `TextIn returned code ${code}: ${payload.message ?? 'unknown error'}${hint ? `. Hint: ${hint}` : ''}`,
      );
    }

    const lines = normalizeLines(payload);
    const text = lines.join('\n');
    const pages = normalizePages(payload);
    const requestId = payload.x_request_id ?? response.headers.get('x-request-id') ?? undefined;

    return {
      filePath,
      status: 'success',
      lines,
      text,
      markdown: buildMarkdownForSingleFile(filePath, text, options),
      pages,
      raw: payload,
      ...(requestId ? { requestId } : {}),
    };
  }

  async ocrFile(request: OcrFileRequest): Promise<OcrSuccessResult> {
    const response = await this.postToTextIn(
      request,
      new Uint8Array(request.fileBuffer),
      'application/octet-stream',
    );

    return this.handleResponse(response, request.fileName, {
      ...(request.displayPath !== undefined ? { displayPath: request.displayPath } : {}),
      ...(request.relativeTo !== undefined ? { relativeTo: request.relativeTo } : {}),
    });
  }

  async ocrUrl(request: OcrUrlRequest): Promise<OcrSuccessResult> {
    const response = await this.postToTextIn(request, request.url, 'text/plain');

    return this.handleResponse(response, request.url, {
      ...(request.displayPath !== undefined ? { displayPath: request.displayPath } : {}),
      ...(request.relativeTo !== undefined ? { relativeTo: request.relativeTo } : {}),
    });
  }
}
