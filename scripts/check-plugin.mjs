import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('plugins/context-mri');
const manifestPath = resolve(root, '.codex-plugin/plugin.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const errors = [];

if (manifest.name !== 'context-mri') errors.push('Manifest name must be context-mri.');
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version ?? '')) errors.push('Manifest version must be semver.');
if (manifest.mcpServers !== './.mcp.json') errors.push('Manifest must point to ./.mcp.json.');
if (manifest.skills !== './skills/') errors.push('Manifest must point to ./skills/.');
if (manifest.interface?.category !== 'Developer Tools') errors.push('Plugin category must be Developer Tools.');
if (!manifest.interface?.capabilities?.includes('Read')) errors.push('Plugin must declare its read capability.');
if (manifest.interface?.capabilities?.includes('Write')) errors.push('The free beta must not declare write capability.');

const requiredFiles = [
  '.mcp.json',
  'mcp/server.mjs',
  'skills/audit-agent-context/SKILL.md',
  'skills/audit-agent-context/agents/openai.yaml',
  'assets/icon.svg',
  'assets/logo.png',
  'assets/codex-workflow.png',
  'assets/security-diagnostic.png',
  'assets/public-ci-proof.png',
];

for (const file of requiredFiles) {
  try {
    await access(resolve(root, file));
  } catch {
    errors.push(`Missing packaged file: ${file}`);
  }
}

const bundle = await readFile(resolve(root, 'mcp/server.mjs'), 'utf8').catch(() => '');
if (!bundle.includes('diagnose_context_pack')) errors.push('Bundled MCP server does not expose diagnose_context_pack.');
if (!bundle.includes('verify_context_pack')) errors.push('Bundled MCP server does not expose verify_context_pack.');
if (bundle.includes('OPENAI_API_KEY')) errors.push('Free-beta MCP bundle must not depend on OPENAI_API_KEY.');

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Context MRI plugin package check passed: manifest, local MCP bundle, skill, and assets are complete.');
