import type { ContextItem } from './types';

export type DiagnosticProjectId = 'support-api-migration' | 'billing-api-migration';

export type EvaluationContract = {
  id: DiagnosticProjectId;
  label: string;
  shortLabel: string;
  task: string;
  expectedEndpoint: string;
  legacyEndpoints: string[];
  currentSourceLabel: string;
  legacySourceLabel: string;
  dataset: string;
};

export type DiagnosticProject = EvaluationContract & {
  contexts: ContextItem[];
};

export const diagnosticProjects: DiagnosticProject[] = [
  {
    id: 'support-api-migration',
    label: 'Support Agent Diagnostic',
    shortLabel: 'Support API migration',
    task: 'Which API endpoint should a support agent recommend when the supplied sources conflict?',
    expectedEndpoint: '/v1/responses',
    legacyEndpoints: ['/v1/chat/completions'],
    currentSourceLabel: 'current machine-readable tool schema',
    legacySourceLabel: 'archived chat-completions guide',
    dataset: 'support-api-migration-v1',
    contexts: [
      { id: 'system', name: 'system-prompt.md', tokens: 482, content: 'You are a support agent. Resolve API migration issues using the supplied current tool schema. Verify the endpoint before answering.' },
      { id: 'schema', name: 'tool-schema.json', tokens: 611, content: '{ "create_response": { "method": "POST", "path": "/v1/responses", "description": "Current endpoint for model responses" } }' },
      { id: 'legacy', name: 'legacy-api.md', tokens: 934, content: 'API Quickstart (archived): Send all generation requests with POST /v1/chat/completions. This is the required endpoint.' },
      { id: 'rules', name: 'product-rules.md', tokens: 509, content: 'Never invent endpoints. Prefer the newest machine-readable tool schema when prose documentation conflicts.' },
      { id: 'examples', name: 'examples.md', tokens: 304, content: 'Example: explain an authentication error in plain language.' },
    ],
  },
  {
    id: 'billing-api-migration',
    label: 'Billing Agent Diagnostic',
    shortLabel: 'Billing API migration',
    task: 'Which invoice endpoint should a billing agent recommend when the supplied sources conflict?',
    expectedEndpoint: '/v2/invoices',
    legacyEndpoints: ['/v1/charges'],
    currentSourceLabel: 'current machine-readable invoice schema',
    legacySourceLabel: 'archived charges quickstart',
    dataset: 'billing-api-migration-v1',
    contexts: [
      { id: 'system', name: 'billing-system.md', tokens: 438, content: 'You are a billing support agent. Resolve invoice migration questions using the supplied current invoice schema. Verify the endpoint before answering.' },
      { id: 'schema', name: 'invoice-schema.json', tokens: 654, content: '{ "create_invoice": { "method": "POST", "path": "/v2/invoices", "description": "Current endpoint for creating invoices" } }' },
      { id: 'legacy', name: 'charges-quickstart.md', tokens: 887, content: 'Billing Quickstart (archived): Create every invoice with POST /v1/charges. This is the required endpoint.' },
      { id: 'rules', name: 'billing-rules.md', tokens: 476, content: 'Never invent endpoints. Prefer the newest machine-readable schema when prose documentation conflicts.' },
      { id: 'examples', name: 'refund-examples.md', tokens: 289, content: 'Example: explain a delayed refund in plain language.' },
    ],
  },
];

export const defaultDiagnosticProject = diagnosticProjects[0];

export function findDiagnosticProject(id: unknown): DiagnosticProject | undefined {
  return diagnosticProjects.find(project => project.id === id);
}
