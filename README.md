# ocr2md-mcp

Lightweight MCP server for sending local files to TextIn OCR and returning structured text plus Markdown.

---

## English

### What it does

`ocr2md-mcp` is a small MCP server built with Node.js + TypeScript. It reads local files, sends them to the TextIn OCR HTTP API, and returns:

- structured OCR results
- merged plain text
- Markdown output
- batch processing results with partial-failure isolation

### Features

- `ocr_file`: OCR a single local file
- `ocr_batch`: OCR multiple files with bounded concurrency
- `ocr_to_markdown`: OCR files and combine results into Markdown
- Uses TextIn HTTP API directly
- Supports local directory scanning via glob pattern

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
OCR2MD_DEFAULT_CONCURRENCY=3
```

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
        "OCR2MD_DEFAULT_CONCURRENCY": "3"
      }
    }
  },
  "permission": {
    "ocr2md_": "ask"
  }
}
```

After saving the config, you can verify that OpenCode has loaded the MCP server:

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
        "TEXTIN_SECRET_CODE": "your_secret_code"
      }
    }
  }
}
```

### Tool examples

#### `ocr_file`

Input:

```json
{
  "filePath": "/absolute/path/to/file.jpg"
}
```

#### `ocr_batch`

Input:

```json
{
  "directory": "/absolute/path/to/images",
  "pattern": "**/*.{jpg,jpeg,png}",
  "concurrency": 3
}
```

#### `ocr_to_markdown`

Input:

```json
{
  "filePaths": [
    "/absolute/path/to/a.jpg",
    "/absolute/path/to/b.jpg"
  ],
  "headingLevel": 2
}
```

### Development commands

```bash
npm test
npm run typecheck
npm run build
```

---

## 中文

### 项目说明

`ocr2md-mcp` 是一个基于 Node.js + TypeScript 的轻量 MCP 服务。它负责读取本地文件，调用 TextIn OCR HTTP 接口，并返回：

- 结构化 OCR 结果
- 合并后的纯文本
- Markdown 输出
- 支持部分失败隔离的批量 OCR 结果

### 功能

- `ocr_file`：识别单个本地文件
- `ocr_batch`：按并发限制批量识别多个文件
- `ocr_to_markdown`：识别后直接合并输出 Markdown
- 直接调用 TextIn HTTP API
- 支持按目录 + glob 模式扫描文件

### 运行要求

- Node.js 20+
- 需要配置 TextIn 凭证：
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
OCR2MD_DEFAULT_CONCURRENCY=3
```

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
        "OCR2MD_DEFAULT_CONCURRENCY": "3"
      }
    }
  },
  "permission": {
    "ocr2md_": "ask"
  }
}
```

保存配置后，可以用下面的命令确认 OpenCode 已加载该 MCP：

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
        "TEXTIN_SECRET_CODE": "your_secret_code"
      }
    }
  }
}
```

### 工具调用示例

#### `ocr_file`

```json
{
  "filePath": "/absolute/path/to/file.jpg"
}
```

#### `ocr_batch`

```json
{
  "directory": "/absolute/path/to/images",
  "pattern": "**/*.{jpg,jpeg,png}",
  "concurrency": 3
}
```

#### `ocr_to_markdown`

```json
{
  "filePaths": [
    "/absolute/path/to/a.jpg",
    "/absolute/path/to/b.jpg"
  ],
  "headingLevel": 2
}
```

### 开发命令

```bash
npm test
npm run typecheck
npm run build
```
