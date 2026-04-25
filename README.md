# ocr2md-mcp

Lightweight MCP server for sending local files or remote URLs to TextIn OCR and returning structured text plus Markdown.

---

## English

### What it does

`ocr2md-mcp` is a small Node.js + TypeScript MCP server. It calls TextIn's official `POST /ai/service/v2/recognize/multipage` OCR API and returns:

- structured OCR results, including normalized pages and line metadata
- merged plain text
- Markdown output
- batch processing results that preserve per-file partial failures

### Features

- `ocr_file`: OCR a single local file with `application/octet-stream` upload mode.
- `ocr_url`: OCR one remote `http(s)` file URL with TextIn's official `text/plain` URL mode.
- `ocr_batch`: OCR multiple local files with bounded concurrency and partial-failure isolation.
- `ocr_to_markdown`: OCR local files and combine successful results into one Markdown document.
- Supports local directory scanning via glob pattern.
- Defaults Markdown headings to safe basenames instead of absolute local paths.

### Requirements

- Node.js 20+
- TextIn credentials:
  - `TEXTIN_APP_ID`
  - `TEXTIN_SECRET_CODE`

### Installation

```bash
npm install
npm run build
```

### Environment variables

Create a `.env` file based on `.env.example`:

```env
TEXTIN_APP_ID=your_app_id_here
TEXTIN_SECRET_CODE=your_secret_code_here
TEXTIN_BASE_URL=https://api.textin.com
TEXTIN_REQUEST_TIMEOUT_MS=30000
OCR2MD_DEFAULT_CONCURRENCY=3
OCR2MD_MAX_FILE_BYTES=524288000
```

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `TEXTIN_APP_ID` | Yes | - | TextIn app ID. |
| `TEXTIN_SECRET_CODE` | Yes | - | TextIn secret code. |
| `TEXTIN_BASE_URL` | No | `https://api.textin.com` | Must be an `http` or `https` URL. |
| `TEXTIN_REQUEST_TIMEOUT_MS` | No | `30000` | Aborts TextIn requests after this many milliseconds. |
| `OCR2MD_DEFAULT_CONCURRENCY` | No | `3` | Batch default concurrency, capped at `10`. |
| `OCR2MD_MAX_FILE_BYTES` | No | `524288000` | Local upload precheck; capped at TextIn's official 500MB limit. |

### TextIn request constraints

- Official endpoint: `POST https://api.textin.com/ai/service/v2/recognize/multipage`.
- Local upload mode uses `Content-Type: application/octet-stream`.
- Remote URL mode uses `Content-Type: text/plain` and the request body is an `http`/`https` URL.
- Supported file types include jpg, png, bmp, pdf, tiff, and single-frame gif.
- Official file size limit is 500MB (`524288000` bytes).
- Official image dimension range is 20..10000 px for width and height.
- `character` and `straighten` are boolean tool inputs and are encoded for TextIn as official `0`/`1` query parameters.
- Provider errors include actionable hints for known codes such as `40302` (file size) and `40306` (QPS limit; do not retry immediately).

### Run the server

```bash
npm run build
npm start
```

Or during development:

```bash
npm run dev
```

### OpenCode configuration example (`opencode.jsonc`)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "ocr2md": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/ocr2md-mcp/dist/index.js"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "TEXTIN_APP_ID": "your_app_id",
        "TEXTIN_SECRET_CODE": "your_secret_code",
        "TEXTIN_BASE_URL": "https://api.textin.com",
        "TEXTIN_REQUEST_TIMEOUT_MS": "30000",
        "OCR2MD_DEFAULT_CONCURRENCY": "3",
        "OCR2MD_MAX_FILE_BYTES": "524288000"
      }
    }
  },
  "permission": {
    "ocr2md_": "ask"
  }
}
```

After saving the config, verify that OpenCode has loaded the MCP server:

```bash
opencode mcp list
```

### Generic MCP configuration example

```json
{
  "mcpServers": {
    "ocr2md": {
      "command": "node",
      "args": ["/absolute/path/to/ocr2md-mcp/dist/index.js"],
      "env": {
        "TEXTIN_APP_ID": "your_app_id",
        "TEXTIN_SECRET_CODE": "your_secret_code",
        "TEXTIN_BASE_URL": "https://api.textin.com"
      }
    }
  }
}
```

### Tool examples

#### `ocr_file`

```json
{
  "filePath": "/absolute/path/to/file.jpg",
  "character": false,
  "straighten": true,
  "displayPath": "basename"
}
```

#### `ocr_url`

```json
{
  "url": "https://example.com/file.pdf",
  "character": false,
  "straighten": true,
  "displayPath": "basename"
}
```

#### `ocr_batch`

```json
{
  "directory": "/absolute/path/to/images",
  "pattern": "**/*.{jpg,jpeg,png}",
  "concurrency": 3,
  "displayPath": "relative",
  "relativeTo": "/absolute/path/to/images"
}
```

#### `ocr_to_markdown`

```json
{
  "filePaths": [
    "/absolute/path/to/a.jpg",
    "/absolute/path/to/b.jpg"
  ],
  "headingLevel": 2,
  "displayPath": "basename"
}
```

### Markdown heading paths

Markdown output supports these `displayPath` modes:

- `basename` (default): show only the file or URL basename, avoiding absolute local path leaks.
- `absolute`: preserve the original local path or URL in headings.
- `relative`: show paths relative to `relativeTo`; useful for batch directory output.

### Development commands

```bash
npm test
npm run typecheck
npm run build
npm run check
```

`npm run check` runs tests, typecheck, and production build in sequence.

---

## 中文

### 项目说明

`ocr2md-mcp` 是一个基于 Node.js + TypeScript 的轻量 MCP 服务。它调用 TextIn 官方 `POST /ai/service/v2/recognize/multipage` OCR 接口，并返回：

- 结构化 OCR 结果，包括标准化后的页面与文本行元数据
- 合并后的纯文本
- Markdown 输出
- 支持逐文件保留失败信息的批量处理结果

### 功能

- `ocr_file`：用 `application/octet-stream` 上传模式识别单个本地文件。
- `ocr_url`：用 TextIn 官方 `text/plain` URL 模式识别一个远程 `http(s)` 文件 URL。
- `ocr_batch`：按并发上限批量识别多个本地文件，并保留部分失败结果。
- `ocr_to_markdown`：识别本地文件，并把成功结果合并成一个 Markdown 文档。
- 支持按本地目录和 glob 模式扫描文件。
- Markdown 标题默认只显示安全的文件名，不暴露本机绝对路径。

### 运行要求

- Node.js 20+
- TextIn 凭证：
  - `TEXTIN_APP_ID`
  - `TEXTIN_SECRET_CODE`

### 安装

```bash
npm install
npm run build
```

### 环境变量

可参考 `.env.example` 创建 `.env`：

```env
TEXTIN_APP_ID=your_app_id_here
TEXTIN_SECRET_CODE=your_secret_code_here
TEXTIN_BASE_URL=https://api.textin.com
TEXTIN_REQUEST_TIMEOUT_MS=30000
OCR2MD_DEFAULT_CONCURRENCY=3
OCR2MD_MAX_FILE_BYTES=524288000
```

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `TEXTIN_APP_ID` | 是 | - | TextIn App ID。 |
| `TEXTIN_SECRET_CODE` | 是 | - | TextIn Secret Code。 |
| `TEXTIN_BASE_URL` | 否 | `https://api.textin.com` | 必须是 `http` 或 `https` URL。 |
| `TEXTIN_REQUEST_TIMEOUT_MS` | 否 | `30000` | 超过该毫秒数后中止 TextIn 请求。 |
| `OCR2MD_DEFAULT_CONCURRENCY` | 否 | `3` | 批量识别默认并发数，上限为 `10`。 |
| `OCR2MD_MAX_FILE_BYTES` | 否 | `524288000` | 本地上传前的文件大小预检查；不会超过 TextIn 官方 500MB 上限。 |

### TextIn 请求约束

- 官方接口：`POST https://api.textin.com/ai/service/v2/recognize/multipage`。
- 本地上传模式使用 `Content-Type: application/octet-stream`。
- 远程 URL 模式使用 `Content-Type: text/plain`，请求体是一个 `http`/`https` URL。
- 支持的文件类型包括 jpg、png、bmp、pdf、tiff、单帧 gif。
- 官方文件大小上限为 500MB（`524288000` 字节）。
- 官方图片宽高范围为 20..10000 px。
- `character` 和 `straighten` 在 MCP 工具输入中是布尔值，发送给 TextIn 时会按官方要求编码为 `0`/`1` 查询参数。
- 已知服务端错误会附带可操作提示，例如 `40302`（文件大小）和 `40306`（QPS 超限；不要立即重试）。

### 启动服务

```bash
npm run build
npm start
```

开发模式：

```bash
npm run dev
```

### OpenCode 配置示例（`opencode.jsonc`）

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "ocr2md": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/ocr2md-mcp/dist/index.js"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "TEXTIN_APP_ID": "your_app_id",
        "TEXTIN_SECRET_CODE": "your_secret_code",
        "TEXTIN_BASE_URL": "https://api.textin.com",
        "TEXTIN_REQUEST_TIMEOUT_MS": "30000",
        "OCR2MD_DEFAULT_CONCURRENCY": "3",
        "OCR2MD_MAX_FILE_BYTES": "524288000"
      }
    }
  },
  "permission": {
    "ocr2md_": "ask"
  }
}
```

保存配置后，可用下面命令确认 OpenCode 已加载该 MCP：

```bash
opencode mcp list
```

### 通用 MCP 配置示例

```json
{
  "mcpServers": {
    "ocr2md": {
      "command": "node",
      "args": ["/absolute/path/to/ocr2md-mcp/dist/index.js"],
      "env": {
        "TEXTIN_APP_ID": "your_app_id",
        "TEXTIN_SECRET_CODE": "your_secret_code",
        "TEXTIN_BASE_URL": "https://api.textin.com"
      }
    }
  }
}
```

### 工具调用示例

#### `ocr_file`

```json
{
  "filePath": "/absolute/path/to/file.jpg",
  "character": false,
  "straighten": true,
  "displayPath": "basename"
}
```

#### `ocr_url`

```json
{
  "url": "https://example.com/file.pdf",
  "character": false,
  "straighten": true,
  "displayPath": "basename"
}
```

#### `ocr_batch`

```json
{
  "directory": "/absolute/path/to/images",
  "pattern": "**/*.{jpg,jpeg,png}",
  "concurrency": 3,
  "displayPath": "relative",
  "relativeTo": "/absolute/path/to/images"
}
```

#### `ocr_to_markdown`

```json
{
  "filePaths": [
    "/absolute/path/to/a.jpg",
    "/absolute/path/to/b.jpg"
  ],
  "headingLevel": 2,
  "displayPath": "basename"
}
```

### Markdown 标题路径

Markdown 输出支持以下 `displayPath` 模式：

- `basename`（默认）：只显示文件名或 URL 文件名，避免泄露本机绝对路径。
- `absolute`：在标题中保留原始本地路径或 URL。
- `relative`：显示相对于 `relativeTo` 的路径，适合批量目录输出。

### 开发命令

```bash
npm test
npm run typecheck
npm run build
npm run check
```

`npm run check` 会依次运行测试、类型检查和生产构建。
