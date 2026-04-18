export type TextInLine = {
  text?: string;
};

export type TextInPage = {
  lines?: TextInLine[];
};

export type TextInApiResponse = {
  code?: number;
  message?: string;
  result?: {
    pages?: TextInPage[];
  };
};

export type TextInClientConfig = {
  appId: string;
  secretCode: string;
  baseUrl: string;
};

export type OcrFileRequest = {
  fileBuffer: Buffer;
  fileName: string;
  character?: string;
  straighten?: boolean;
};

export type OcrSuccessResult = {
  filePath: string;
  status: 'success';
  lines: string[];
  text: string;
  markdown: string;
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
