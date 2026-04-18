import { describe, expect, it } from 'vitest';

describe('server runtime dependencies', () => {
  it('can import the MCP server module without missing runtime packages', async () => {
    const mod = await import('../src/server.js');

    expect(mod).toHaveProperty('startServer');
    expect(typeof mod.startServer).toBe('function');
  });
});
