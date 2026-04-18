import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import * as z from 'zod';

import { getConfig } from './config.js';
import { TextInClient } from './textin/client.js';
import { createOcrFileRunner, runOcrFile } from './tools/ocrFile.js';
import { runOcrBatch } from './tools/ocrBatch.js';
import { runOcrToMarkdown } from './tools/ocrToMarkdown.js';
import { resolveInputFiles } from './utils/files.js';

function createDependencies() {
  const config = getConfig();
  const client = new TextInClient({
    appId: config.appId,
    secretCode: config.secretCode,
    baseUrl: config.baseUrl,
  });
  const ocrFileByPath = createOcrFileRunner(client);

  return {
    config,
    resolveInputFiles,
    ocrFileByPath,
  };
}

export function createServer() {
  const deps = createDependencies();

  const server = new McpServer(
    {
      name: 'ocr2md-mcp',
      version: '0.1.0',
    },
    {
      instructions:
        'Use this server to OCR local files with TextIn. Prefer ocr_batch for multiple files and ocr_to_markdown when the caller wants Markdown output.',
    },
  );

  server.registerTool(
    'ocr_file',
    {
      title: 'OCR Single File',
      description: 'OCR one local file through TextIn and return structured text plus Markdown.',
      inputSchema: z.object({
        filePath: z.string().min(1).describe('Absolute or relative local file path.'),
        character: z.string().min(1).optional().describe('Optional TextIn character mode.'),
        straighten: z.boolean().optional().describe('Whether to request image straighten mode.'),
      }),
    },
    async (input) => {
      const result = await runOcrFile(
        {
          filePath: input.filePath,
          ...(input.character !== undefined ? { character: input.character } : {}),
          ...(input.straighten !== undefined ? { straighten: input.straighten } : {}),
        },
        { ocrFileByPath: deps.ocrFileByPath },
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: result.markdown,
          },
        ],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    'ocr_batch',
    {
      title: 'OCR Batch Files',
      description:
        'OCR multiple local files. Accepts explicit file paths and/or a directory plus glob pattern. Partial failures are preserved.',
      inputSchema: z.object({
        filePaths: z.array(z.string().min(1)).optional().describe('Optional explicit file paths.'),
        directory: z.string().min(1).optional().describe('Optional directory to search.'),
        pattern: z.string().min(1).optional().describe('Optional fast-glob pattern used with directory.'),
        concurrency: z.number().int().positive().optional().describe('Maximum concurrent OCR requests.'),
        character: z.string().min(1).optional(),
        straighten: z.boolean().optional(),
      }),
    },
    async (input) => {
      const result = await runOcrBatch(
        {
          ...(input.filePaths !== undefined ? { filePaths: input.filePaths } : {}),
          ...(input.directory !== undefined ? { directory: input.directory } : {}),
          ...(input.pattern !== undefined ? { pattern: input.pattern } : {}),
          ...(input.concurrency !== undefined ? { concurrency: input.concurrency } : {}),
          ...(input.character !== undefined ? { character: input.character } : {}),
          ...(input.straighten !== undefined ? { straighten: input.straighten } : {}),
        },
        {
          resolveInputFiles: deps.resolveInputFiles,
          ocrFileByPath: deps.ocrFileByPath,
          defaultConcurrency: deps.config.defaultConcurrency,
        },
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.summary, null, 2),
          },
        ],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    'ocr_to_markdown',
    {
      title: 'OCR To Markdown',
      description: 'OCR one or more local files and return a combined Markdown document.',
      inputSchema: z.object({
        filePaths: z.array(z.string().min(1)).optional(),
        directory: z.string().min(1).optional(),
        pattern: z.string().min(1).optional(),
        concurrency: z.number().int().positive().optional(),
        character: z.string().min(1).optional(),
        straighten: z.boolean().optional(),
        headingLevel: z.number().int().min(1).max(6).optional().describe('Markdown heading level for each file section.'),
      }),
    },
    async (input) => {
      const result = await runOcrToMarkdown(
        {
          ...(input.filePaths !== undefined ? { filePaths: input.filePaths } : {}),
          ...(input.directory !== undefined ? { directory: input.directory } : {}),
          ...(input.pattern !== undefined ? { pattern: input.pattern } : {}),
          ...(input.concurrency !== undefined ? { concurrency: input.concurrency } : {}),
          ...(input.character !== undefined ? { character: input.character } : {}),
          ...(input.straighten !== undefined ? { straighten: input.straighten } : {}),
          ...(input.headingLevel !== undefined ? { headingLevel: input.headingLevel } : {}),
        },
        {
          resolveInputFiles: deps.resolveInputFiles,
          ocrFileByPath: deps.ocrFileByPath,
          defaultConcurrency: deps.config.defaultConcurrency,
        },
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: result.markdown,
          },
        ],
        structuredContent: result,
      };
    },
  );

  return server;
}

export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
