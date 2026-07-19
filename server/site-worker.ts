import type { ContextItem } from '../src/types.js';
import { defaultDiagnosticProject, findDiagnosticProject, type DiagnosticProjectId } from '../src/projects.js';
import { checkContextGuard, isContextGuard } from './context-guard.js';
import { fixtureReport } from './experiment-engine.js';

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

type SiteEnvironment = {
  ASSETS: AssetsBinding;
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: JSON_HEADERS });
}

async function withRequestMetadata(response: Response, request: Request) {
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  const imageUrl = new URL('/og.png', request.url).href;
  const html = (await response.text()).replaceAll('__CONTEXT_MRI_OG_IMAGE__', imageUrl);
  return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
}

export function validContexts(value: unknown): value is ContextItem[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12) return false;
  const ids = new Set<string>();
  return value.every(item => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<ContextItem>;
    const valid = typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= 64 &&
      typeof candidate.name === 'string' && candidate.name.length > 0 && candidate.name.length <= 160 &&
      typeof candidate.content === 'string' && candidate.content.length <= 20_000 &&
      typeof candidate.tokens === 'number' && Number.isFinite(candidate.tokens) && candidate.tokens >= 0;
    if (!valid || ids.has(candidate.id!)) return false;
    ids.add(candidate.id!);
    return true;
  });
}

function validProjectId(value: unknown): value is DiagnosticProjectId {
  return Boolean(findDiagnosticProject(value));
}

const worker = {
  async fetch(request: Request, env: SiteEnvironment): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({
        ok: true,
        model: 'gpt-5.6-sol',
        keyConfigured: false,
        experimentEngine: 'v3',
        deploymentMode: 'public-fixture',
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/live-status') {
      return json({
        available: false,
        model: 'gpt-5.6-sol',
        suiteRuns: 21,
        reason: 'This public no-login demo intentionally has no stored API key. Run a funded live audit from a self-hosted copy, then publish its raw artifact separately.',
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/live/experiments') {
      return json({ error: 'Fresh live runs are unavailable on this public fixture host. No fixture replay was substituted.' }, 503);
    }

    if (request.method === 'POST' && (url.pathname === '/api/experiments' || url.pathname === '/api/fixture')) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Request body must be valid JSON.' }, 400);
      }
      const payload = body as { contexts?: unknown; projectId?: unknown } | null;
      const contexts = payload?.contexts;
      if (!validContexts(contexts)) return json({ error: 'Supply 2–12 valid context items.' }, 400);
      const projectId = payload?.projectId ?? defaultDiagnosticProject.id;
      if (!validProjectId(projectId)) return json({ error: 'Supply a supported diagnostic project id.' }, 400);
      return json(fixtureReport(contexts, projectId));
    }

    if (request.method === 'POST' && url.pathname === '/api/guard/check') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Request body must be valid JSON.' }, 400);
      }
      const payload = body as { contexts?: unknown; guard?: unknown } | null;
      if (!validContexts(payload?.contexts)) return json({ error: 'Supply 2–12 valid context items.' }, 400);
      if (!isContextGuard(payload?.guard)) return json({ error: 'Supply a valid Context Guard created by Context MRI.' }, 400);
      try {
        return json(await checkContextGuard(payload.guard, payload.contexts));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Context Guard check failed.';
        return json({ error: message }, 400);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== 'GET') return withRequestMetadata(asset, request);
    if (!(request.headers.get('accept') ?? '').includes('text/html')) return asset;

    const fallbackUrl = new URL('/index.html', request.url);
    const fallback = await env.ASSETS.fetch(new Request(fallbackUrl, request));
    return withRequestMetadata(fallback, request);
  },
};

export default worker;
