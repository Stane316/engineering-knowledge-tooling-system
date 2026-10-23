import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { describe, expect, it } from 'vitest';

import { createStdioTransport } from '../../src/mcp/transport.js';

describe('createStdioTransport', () => {
  it('construit le transport stdio du SDK', () => {
    expect(createStdioTransport()).toBeInstanceOf(StdioServerTransport);
  });
});
