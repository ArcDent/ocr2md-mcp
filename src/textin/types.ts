export type TextInLine = {
  text?: string;
  score?: number;
  type?: string;
  position?: unknown;
  angle?: number;
  direction?: number;
  handwritten?: number | boolean;
  char_scores?: unknown;
  char_centers?: unknown;
  char_positions?: unknown;
  char_candidates?: unknown;
  char_candidates_score?: unknown;
};

export type TextInPage = {
  angle?: number;
  width?: number;
  height?: number;
  lines?: TextInLine[];
};

export type TextInApiResponse = {
  code?: number;
  message?: string;
  version?: string;
  duration?: number;
  x_request_id?: string;
  result?: {
    pages?: TextInPage[];
  };
};

export type TextInClientConfig = {
  appId: string;
  secretCode: string;
  baseUrl: string;
  requestTimeoutMs?: number;
};

export type OcrFileRequest = {
  fileBuffer: Buffer;
  fileName: string;
  character?: boolean;
  straighten?: boolean;
  displayPath?: 'absolute' | 'basename' | 'relative';
  relativeTo?: string;
};

export type OcrUrlRequest = {
  url: string;
  character?: boolean;
  straighten?: boolean;
  displayPath?: 'absolute' | 'basename' | 'relative';
  relativeTo?: string;
};

export type OcrPageLine = {
  text: string;
  score?: number;
  type?: string;
  position?: unknown;
  angle?: number;
  direction?: number;
  handwritten?: boolean;
  charScores?: unknown;
  charCenters?: unknown;
  charPositions?: unknown;
  charCandidates?: unknown;
  charCandidatesScore?: unknown;
};

export type OcrPage = {
  index: number;
  width?: number;
  height?: number;
  angle?: number;
  lines: OcrPageLine[];
};

export type OcrSuccessResult = {
  filePath: string;
  status: 'success';
  lines: string[];
  text: string;
  markdown: string;
  pages: OcrPage[];
  raw: TextInApiResponse;
  requestId?: string;
};

export type OcrErrorResult = {
  filePath: string;
  status: 'error';
  error: string;
};

export type OcrResult = OcrSuccessResult | OcrErrorResult;

export type OcrBatchSummary = {
  total: number;
  succeeded: number;
  failed: number;
};

export type OcrBatchResult = {
  results: OcrResult[];
  summary: OcrBatchSummary;
};
