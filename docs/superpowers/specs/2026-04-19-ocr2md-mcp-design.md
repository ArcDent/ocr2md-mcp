# ocr2md-mcp Design Spec

## Goal

Build a lightweight Node.js + TypeScript MCP server named `ocr2md-mcp` that sends local files to TextIn over HTTP, supports batch OCR with bounded concurrency, and returns both structured OCR data and Markdown-friendly output.

## Scope

Initial scope includes three MCP tools:

1. `ocr_file` — OCR one local file and return raw response, text lines, merged text, and Markdown.
2. `ocr_batch` — OCR multiple files supplied explicitly or discovered from a directory pattern, processing files concurrently while isolating per-file failures.
3. `ocr_to_markdown` — OCR one or many files and return a combined Markdown document suitable for note-taking or downstream processing.

Out of scope for v0.1.0:

- Database storage
- Web UI
- Local OCR engine fallback
- PDF post-processing beyond TextIn response parsing

## Runtime and Dependencies

- Runtime: Node.js 20+
- Language: TypeScript
- MCP SDK: `@modelcontextprotocol/server`
- Validation: `zod`
- Directory/file pattern resolution: `fast-glob`
- Local env loading: `dotenv`
- Test runner: `vitest`

## Configuration

The server reads credentials from environment variables:

- `TEXTIN_APP_ID` (required)
- `TEXTIN_SECRET_CODE` (required)
- `TEXTIN_BASE_URL` (optional, defaults to `https://api.textin.com`)
- `OCR2MD_DEFAULT_CONCURRENCY` (optional, defaults to `3`)

Credentials must never be committed. The repository will include `.env.example` only.

## Data Flow

1. MCP tool receives arguments.
2. Input is validated with Zod.
3. Files are resolved from explicit paths and/or directory globbing.
4. Each file is read from local disk.
5. File bytes are posted to TextIn `POST /ai/service/v2/recognize/multipage` with `application/octet-stream`.
6. Response JSON is normalized into:
   - `lines: string[]`
   - `text: string`
   - `markdown: string`
   - `raw` TextIn payload
7. Batch mode aggregates per-file success/error objects and preserves partial success.

## Error Handling

The server must distinguish:

- Missing configuration
- Missing/unreadable local files
- Invalid batch input (no files resolved)
- TextIn HTTP failure status
- Invalid/unknown TextIn JSON shape

Batch operations must continue when one file fails. Each file result must include a clear `status` and human-readable `error` when applicable.

## Output Shape

For single-file OCR:

- `filePath`
- `status`
- `lines`
- `text`
- `markdown`
- `raw`
- `requestId` if available from headers or body

For batch OCR:

- `results[]`
- `summary.total`
- `summary.succeeded`
- `summary.failed`
- optional combined `markdown`

## Verification Plan

Verification requires:

1. Automated tests for Markdown rendering, file resolution, TextIn client parsing, and batch error isolation.
2. Type-checking and production build.
3. Real API smoke test against at least one JPG using provided TextIn credentials.
4. Real batch smoke test against multiple JPGs in the current workspace.

## Repository Deliverables

- Bilingual `README.md` (English + 中文)
- `.env.example`
- TypeScript source
- Tests
- Spec and implementation plan under `docs/superpowers/`
