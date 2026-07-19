import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const pluginRoot = resolve(process.argv[2] ?? 'plugins/context-mri');
const serverPath = resolve(pluginRoot, 'mcp/server.mjs');
await access(serverPath);

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
  cwd: pluginRoot,
  stderr: 'pipe',
});
const stderr = [];
transport.stderr?.on('data', chunk => stderr.push(String(chunk)));

const client = new Client({ name: 'context-mri-package-smoke-test', version: '0.1.0' });

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const expected = ['describe_evaluators', 'diagnose_context_pack', 'verify_context_pack'];
  const names = tools.tools.map(tool => tool.name);
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected tools: ${names.join(', ')}`);
  }

  const diagnosis = await client.callTool({
    name: 'diagnose_context_pack',
    arguments: { projectId: 'security-release-safety' },
  });
  const result = diagnosis.structuredContent;
  if (diagnosis.isError || !result || result.headline?.harmfulItem !== 'emergency-release-runbook.md') {
    throw new Error('Installed package did not produce the expected Security Release diagnosis.');
  }
  const original = await client.callTool({
    name: 'verify_context_pack',
    arguments: { guardRef: result.guardRef, bundledPack: 'original' },
  });
  const repaired = await client.callTool({
    name: 'verify_context_pack',
    arguments: { guardRef: result.guardRef, bundledPack: 'recommended' },
  });
  if (original.isError || original.structuredContent?.status !== 'blocked') {
    throw new Error('Installed package did not block the original bundled pack.');
  }
  if (repaired.isError || repaired.structuredContent?.status !== 'pass') {
    throw new Error('Installed package did not pass the recommended bundled pack.');
  }

  console.log(JSON.stringify({
    ok: true,
    pluginRoot,
    tools: names,
    diagnosis: {
      baselineScore: result.headline.baselineScore,
      optimizedScore: result.headline.optimizedScore,
      scoreDelta: result.headline.scoreDelta,
      harmfulItem: result.headline.harmfulItem,
      evidenceMode: result.evidenceMode,
      networkUsed: result.privacy?.networkUsed,
      originalGuardStatus: original.structuredContent.status,
      repairedGuardStatus: repaired.structuredContent.status,
    },
  }, null, 2));
} catch (error) {
  if (stderr.length) console.error(stderr.join(''));
  throw error;
} finally {
  await client.close();
}
