import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { diagnosticProjects } from '../../../src/projects.js';
import { createContextMriMcpServer } from './server.js';

async function connectedPair() {
  const server = createContextMriMcpServer();
  const client = new Client({ name: 'context-mri-test-client', version: '0.1.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { server, client };
}

test('publishes three accurately annotated read-only tools', async t => {
  const { server, client } = await connectedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  const result = await client.listTools();
  assert.deepEqual(result.tools.map(tool => tool.name), [
    'describe_evaluators',
    'diagnose_context_pack',
    'verify_context_pack',
  ]);
  assert.ok(result.tools.every(tool => tool.annotations?.readOnlyHint === true));
  assert.ok(result.tools.every(tool => tool.annotations?.destructiveHint === false));
  assert.ok(result.tools.every(tool => tool.annotations?.openWorldHint === false));
});

test('completes the native diagnose and verify workflow through MCP', async t => {
  const security = diagnosticProjects.find(project => project.id === 'security-release-safety')!;
  const { server, client } = await connectedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });

  const diagnosis = await client.callTool({
    name: 'diagnose_context_pack',
    arguments: { projectId: security.id },
  });
  assert.equal(diagnosis.isError, undefined);
  const structured = diagnosis.structuredContent as Record<string, any>;
  assert.equal(structured.headline.harmfulItem, 'emergency-release-runbook.md');
  assert.equal(structured.headline.scoreDelta, 47);
  assert.equal(structured.privacy.networkUsed, false);
  assert.equal(structured.guardRef, structured.guard.guardFingerprint);

  const verification = await client.callTool({
    name: 'verify_context_pack',
    arguments: { guardRef: structured.guardRef, bundledPack: 'recommended' },
  });
  assert.equal(verification.isError, undefined);
  assert.equal((verification.structuredContent as Record<string, any>).status, 'pass');
  assert.equal((verification.structuredContent as Record<string, any>).inputSource, 'bundled-recommended');
});

test('returns an MCP tool error for unsupported input instead of mutating anything', async t => {
  const { server, client } = await connectedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  const result = await client.callTool({
    name: 'diagnose_context_pack',
    arguments: { projectId: 'not-real' },
  });
  assert.equal(result.isError, true);

  const missingGuard = await client.callTool({
    name: 'verify_context_pack',
    arguments: { guardRef: '0'.repeat(64), bundledPack: 'recommended' },
  });
  assert.equal(missingGuard.isError, true);
});
