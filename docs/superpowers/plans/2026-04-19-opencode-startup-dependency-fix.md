# ocr2md-mcp OpenCode Startup Dependency Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the OpenCode startup failure so `ocr2md` can connect successfully instead of crashing with `ERR_MODULE_NOT_FOUND` for `@cfworker/json-schema`.

**Architecture:** Keep the existing MCP server architecture unchanged. Treat this as a packaging/runtime dependency bug: add a regression test that imports the server module, then explicitly declare the missing runtime dependency so installs produce a bootable server in both local development and OpenCode-managed execution.

**Tech Stack:** Node.js, TypeScript, Vitest, MCP TypeScript SDK, npm, OpenCode MCP local server integration

---

### Task 1: Reproduce the startup failure in tests

**Files:**
- Create: `tests/server-runtime.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

describe('server runtime dependencies', () => {
  it('can import the MCP server module without missing runtime packages', async () => {
    const mod = await import('../src/server.js');
    expect(mod).toHaveProperty('startServer');
    expect(typeof mod.startServer).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/server-runtime.test.ts`
Expected: FAIL with an import error mentioning `@cfworker/json-schema`.

### Task 2: Fix the missing runtime dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/server-runtime.test.ts`

- [ ] **Step 1: Add the missing runtime dependency**

Add this dependency entry to `package.json`:

```json
"@cfworker/json-schema": "^4.1.1"
```

Place it under `dependencies` alongside `@modelcontextprotocol/server`.

- [ ] **Step 2: Refresh the lockfile**

Run: `npm install`
Expected: `package-lock.json` updates and `node_modules/@cfworker/json-schema` is installed.

- [ ] **Step 3: Run the targeted test to verify it passes**

Run: `npm test -- tests/server-runtime.test.ts`
Expected: PASS

### Task 3: Verify the real startup path and OpenCode integration

**Files:**
- Modify: none unless verification reveals another root cause

- [ ] **Step 1: Run the full verification suite**

Run: `npm test && npm run typecheck && npm run build`
Expected: all commands pass

- [ ] **Step 2: Verify the MCP entrypoint starts**

Run: `node dist/index.js`
Expected: no immediate `ERR_MODULE_NOT_FOUND` crash; process stays alive waiting for stdio until terminated by timeout.

- [ ] **Step 3: Verify OpenCode sees the server as connected**

Run: `opencode mcp list`
Expected: `ocr2md` shows `connected` instead of `failed`

### Task 4: Commit and create PR

**Files:**
- Modify: git metadata only

- [ ] **Step 1: Commit the fix**

Run:

```bash
git add package.json package-lock.json tests/server-runtime.test.ts docs/superpowers/plans/2026-04-19-opencode-startup-dependency-fix.md
git commit -m "fix: add missing MCP runtime dependency"
```

- [ ] **Step 2: Push and create PR**

Run:

```bash
git push -u origin fix/opencode-startup-dependency
gh pr create --title "fix: restore ocr2md OpenCode startup" --body "$(cat <<'EOF'
## Summary
- add a regression test that imports the server module to catch startup dependency regressions
- add the missing runtime dependency required by the MCP SDK at runtime
- verify OpenCode can connect to the local `ocr2md` MCP server again

## Test Plan
- [x] npm test
- [x] npm run typecheck
- [x] npm run build
- [x] node dist/index.js
- [x] opencode mcp list
EOF
)"
```
