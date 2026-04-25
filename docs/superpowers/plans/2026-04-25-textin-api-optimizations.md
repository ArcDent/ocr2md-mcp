# TextIn API Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve TextIn API correctness, reliability, diagnostics, URL-mode support, Markdown privacy, and bilingual documentation for `ocr2md-mcp`.

**Architecture:** Keep the MCP server thin while moving provider-specific behavior into the TextIn client and small focused utilities. Preserve the existing local-file tools, add a separate remote URL tool, and keep batch partial-failure behavior intact.

**Tech Stack:** Node.js 20+, TypeScript ESM with NodeNext `.js` imports, `@modelcontextprotocol/server`, `zod`, `fast-glob`, `dotenv`, `vitest`.

---

## File Structure

- Modify `src/textin/types.ts`: official TextIn response types, normalized OCR page/line types, boolean TextIn options, URL request type, client config fields.
- Modify `src/textin/client.ts`: official `0`/`1` query encoding, timeout handling, HTTP body diagnostics, URL-mode request body, request ID extraction, error-code hints, page normalization.
- Modify `src/config.ts`: validate base URL and numeric env vars; expose request timeout and max file bytes.
- Modify `src/utils/files.ts`: enforce readable regular files and configurable file-size limit before reading.
- Modify `src/utils/markdown.ts`: support safe display path modes for Markdown headings.
- Modify `src/tools/ocrFile.ts`: pass max file size and Markdown display options into local-file OCR.
- Create `src/tools/ocrUrl.ts`: validate and run official TextIn URL-mode OCR without overloading local file tools.
- Modify `src/tools/ocrBatch.ts`: validate input sources and cap concurrency while preserving per-file failures.
- Modify `src/tools/ocrToMarkdown.ts`: pass Markdown display options into combined Markdown output.
- Modify `src/server.ts`: register updated schemas plus new `ocr_url` tool and pass config to dependencies.
- Modify `.env.example`, `README.md`, `package.json`, `package-lock.json`: document new settings/tools and remove unused dependency.
- Add/modify tests under `tests/`: client, config, files, markdown, batch, URL tool.

## Execution Order Required by User

Implement tasks in this exact priority order: first priority, third priority, second priority, fourth priority. After each task, run focused tests and inspect the relevant diff before moving on. Do not include the untracked root-worktree `AGENTS.md`; this global worktree does not contain it.

---

### Task 1: First Priority — Official Parameters, Timeout, HTTP Diagnostics, File Size Guard

**Files:**
- Modify: `src/textin/types.ts`
- Modify: `src/textin/client.ts`
- Modify: `src/config.ts`
- Modify: `src/utils/files.ts`
- Modify: `src/tools/ocrFile.ts`
- Modify: `src/server.ts`
- Modify: `.env.example`
- Test: `tests/textin.client.test.ts`
- Test: `tests/files.test.ts`
- Test: `tests/config.test.ts`

- [ ] **Step 1: Write failing tests for official query parameters and HTTP diagnostics**

Add tests asserting `character: true` and `straighten: false` produce `?character=1&straighten=0`, non-2xx errors include a truncated response body, and aborted fetches throw `TextIn request timed out after 1ms`.

- [ ] **Step 2: Write failing tests for config validation and file size precheck**

Add tests asserting invalid `TEXTIN_BASE_URL` throws, `TEXTIN_REQUEST_TIMEOUT_MS` and `OCR2MD_MAX_FILE_BYTES` parse as positive integers capped at official limits, and `readLocalFile(path, { maxFileBytes })` rejects files larger than the configured limit before reading.

- [ ] **Step 3: Implement official options and timeout-aware TextIn fetch**

Use `character?: boolean` and `straighten?: boolean` in request types. Encode booleans as `1` or `0` in `URLSearchParams`. Add `requestTimeoutMs` to `TextInClientConfig`, use `AbortController`, clear the timer in `finally`, and translate aborts to a readable timeout error.

- [ ] **Step 4: Implement HTTP body diagnostics and max-file-size plumbing**

Read `response.text()` for non-2xx responses, truncate to 1000 characters, and include it in the thrown error. Add `requestTimeoutMs` and `maxFileBytes` to `getConfig()`, pass them through `createDependencies()`, and call `readLocalFile(filePath, { maxFileBytes })` in the local file runner.

- [ ] **Step 5: Self-check Task 1**

Run: `npm test -- tests/textin.client.test.ts tests/files.test.ts tests/config.test.ts`

Expected: all focused tests pass. Then run `git diff -- src/textin src/config.ts src/utils/files.ts src/tools/ocrFile.ts src/server.ts .env.example tests/textin.client.test.ts tests/files.test.ts tests/config.test.ts` and verify the changes only implement Task 1 behavior.

---

### Task 2: Third Priority — URL Mode, Page Metadata, Markdown Display Mode, Coverage

**Files:**
- Modify: `src/textin/types.ts`
- Modify: `src/textin/client.ts`
- Create: `src/tools/ocrUrl.ts`
- Modify: `src/utils/markdown.ts`
- Modify: `src/tools/ocrFile.ts`
- Modify: `src/tools/ocrToMarkdown.ts`
- Modify: `src/server.ts`
- Test: `tests/textin.client.test.ts`
- Test: `tests/ocr-url.test.ts`
- Test: `tests/markdown.test.ts`
- Test: `tests/ocr-file.test.ts`

- [ ] **Step 1: Write failing tests for official URL-mode OCR**

Add tests asserting `runOcrUrl({ url: 'https://example.com/a.pdf' }, deps)` calls the client with text/plain URL mode, rejects non-http(s) URLs, and returns normalized OCR output.

- [ ] **Step 2: Write failing tests for normalized page metadata**

Extend TextIn client tests with a payload containing `x_request_id`, page `width`, `height`, `angle`, and line `score`, `type`, `position`, `handwritten`; assert `result.pages` preserves normalized metadata while `lines` and `text` remain backward-compatible.

- [ ] **Step 3: Write failing tests for Markdown heading display modes**

Add tests for default basename headings, explicit `displayPath: 'absolute'`, and `displayPath: 'relative'` with `relativeTo`.

- [ ] **Step 4: Implement URL-mode client and tool**

Add `TextInClient.ocrUrl()` that posts the URL string as `content-type: text/plain` to the same official endpoint. Create `src/tools/ocrUrl.ts` with `runOcrUrl()` that validates `http:` and `https:` only.

- [ ] **Step 5: Implement normalized pages and Markdown display options**

Add normalized `pages` to `OcrSuccessResult`. Update `buildMarkdownFromResults()` and `buildMarkdownForSingleFile()` to default to basename headings and support absolute/relative modes. Thread `displayPath` and `relativeTo` through local file and Markdown tools.

- [ ] **Step 6: Register `ocr_url` MCP tool and self-check Task 2**

Register `ocr_url` in `src/server.ts` with `url`, `character`, `straighten`, `displayPath`, and `relativeTo`. Run: `npm test -- tests/textin.client.test.ts tests/ocr-url.test.ts tests/markdown.test.ts tests/ocr-file.test.ts`. Inspect `git diff -- src/textin src/tools src/utils/markdown.ts src/server.ts tests/textin.client.test.ts tests/ocr-url.test.ts tests/markdown.test.ts tests/ocr-file.test.ts`.

---

### Task 3: Second Priority — Request IDs, Provider Hints, Batch/Input Validation, Config Hardening

**Files:**
- Modify: `src/textin/types.ts`
- Modify: `src/textin/client.ts`
- Modify: `src/config.ts`
- Modify: `src/tools/ocrBatch.ts`
- Modify: `src/server.ts`
- Test: `tests/textin.client.test.ts`
- Test: `tests/config.test.ts`
- Test: `tests/ocr-batch.test.ts`

- [ ] **Step 1: Write failing tests for body request ID and provider error hints**

Assert `payload.x_request_id` is preferred over the `x-request-id` header. Assert TextIn code `40306` includes a QPS/non-retry hint and code `40302` includes the official 500MB size hint.

- [ ] **Step 2: Write failing tests for batch source validation and concurrency normalization**

Assert `runOcrBatch({})` throws `Provide filePaths or directory`. Assert excessive concurrency is capped to the configured maximum and zero/negative concurrency falls back to one.

- [ ] **Step 3: Implement request ID extraction and provider error hints**

Add `x_request_id?: string` to `TextInApiResponse`. Prefer `payload.x_request_id`, then the HTTP header. Add an internal TextIn error hint map for known official codes.

- [ ] **Step 4: Implement batch validation and config hardening**

Validate at least one non-empty input source in `runOcrBatch()` and MCP schemas. Cap concurrency to a small safe maximum in config and batch execution. Keep partial failures as per-file `{ status: 'error', error }`.

- [ ] **Step 5: Self-check Task 3**

Run: `npm test -- tests/textin.client.test.ts tests/config.test.ts tests/ocr-batch.test.ts`. Inspect `git diff -- src/textin src/config.ts src/tools/ocrBatch.ts src/server.ts tests/textin.client.test.ts tests/config.test.ts tests/ocr-batch.test.ts`.

---

### Task 4: Fourth Priority — Engineering Hygiene and Bilingual README

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Remove unused dependency and add unified check script**

Remove `@cfworker/json-schema` from dependencies and add `"check": "npm test && npm run typecheck && npm run build"` to `package.json`. Run `npm install` so `package-lock.json` matches.

- [ ] **Step 2: Update bilingual README**

Keep English and Chinese sections. Document `ocr_url`, boolean `character`/`straighten`, timeout and file size env vars, Markdown display path behavior, development `npm run check`, and the TextIn official file-size/request constraints.

- [ ] **Step 3: Self-check Task 4**

Run: `npm test -- tests/server-runtime.test.ts`. Inspect `git diff -- package.json package-lock.json README.md .env.example`.

---

### Task 5: Final Verification, Commit, Push, PR

**Files:**
- Review all modified tracked files.

- [ ] **Step 1: Run full verification**

Run: `npm test && npm run typecheck && npm run build`.

- [ ] **Step 2: Verify PR contents and branch state**

Run: `git status --short --branch` and `git diff --name-only main...HEAD`. Confirm `AGENTS.md` is absent and only this worktree's intended files are included.

- [ ] **Step 3: Commit to `ArcDev`**

Stage only intended files and commit with a concise message such as `feat: improve TextIn API integration`.

- [ ] **Step 4: Push and create PR**

Push `ArcDev` to origin and create a PR targeting `main` with a summary of API correctness, URL OCR support, diagnostics, tests, and README updates.
