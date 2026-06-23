import { describe, it, expect } from 'vitest';
import { ChiefArchitectAgent } from './agent.js';
import { MockProvider } from '../../providers/mock.js';
import type { ProjectBlueprint } from '../../types/index.js';

const validBlueprint: ProjectBlueprint = {
  _version: '1.0',
  id: 'proj-test-001',
  createdAt: '2026-06-22T00:00:00.000Z',
  name: 'todo-api',
  description: 'REST API for managing todo items',
  projectType: 'api',
  outputLevel: 'scaffold',
  difficulty: 'low',
  estimatedMinutes: 3,
  estimatedCostUSD: 0.15,
  stack: {
    language: 'TypeScript',
    runtime: 'Node.js 20',
    framework: 'Express',
  },
  agentPlan: [
    {
      agentId: 'chief-architect',
      role: 'orchestrator',
      dependsOn: [],
      canRunParallel: false,
      context: 'Evaluate brief and produce blueprint',
    },
    {
      agentId: 'backend-dev',
      role: 'developer',
      dependsOn: ['chief-architect'],
      canRunParallel: false,
      context: 'Generate Express API',
    },
  ],
  architectureDecisions: ['Use Express for simplicity'],
  risks: ['No auth in scaffold'],
};

describe('ChiefArchitectAgent', () => {
  describe('Level 1 — structure', () => {
    it('returns a blueprint with all required fields', async () => {
      const provider = new MockProvider([JSON.stringify(validBlueprint)]);
      const agent = new ChiefArchitectAgent(provider);
      const result = await agent.run('Build a todo API', 'scaffold');

      expect(result.blueprint._version).toBe('1.0');
      expect(result.blueprint.name).toBe('todo-api');
      expect(result.blueprint.projectType).toBe('api');
      expect(result.blueprint.outputLevel).toBe('scaffold');
      expect(result.blueprint.stack).toHaveProperty('language');
      expect(result.blueprint.stack).toHaveProperty('runtime');
      expect(result.blueprint.stack).toHaveProperty('framework');
      expect(Array.isArray(result.blueprint.agentPlan)).toBe(true);
      expect(result.blueprint.agentPlan.length).toBeGreaterThan(0);
    });

    it('records metrics', async () => {
      const provider = new MockProvider([JSON.stringify(validBlueprint)]);
      const agent = new ChiefArchitectAgent(provider);
      const result = await agent.run('Build a todo API', 'scaffold');

      expect(result.metrics).toHaveProperty('latencyMs');
      expect(result.metrics).toHaveProperty('inputTokens');
      expect(result.metrics).toHaveProperty('outputTokens');
      expect(result.metrics).toHaveProperty('costUSD');
      expect(result.metrics.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('handles JSON wrapped in markdown code blocks', async () => {
      const wrapped = '```json\n' + JSON.stringify(validBlueprint) + '\n```';
      const provider = new MockProvider([wrapped]);
      const agent = new ChiefArchitectAgent(provider);
      const result = await agent.run('Build a todo API', 'scaffold');

      expect(result.blueprint.name).toBe('todo-api');
    });
  });

  describe('Level 2 — contracts', () => {
    it('agentPlan always includes chief-architect', async () => {
      const provider = new MockProvider([JSON.stringify(validBlueprint)]);
      const agent = new ChiefArchitectAgent(provider);
      const result = await agent.run('Build a todo API', 'scaffold');

      const ids = result.blueprint.agentPlan.map((s) => s.agentId);
      expect(ids).toContain('chief-architect');
    });

    it('rejects invalid blueprint missing _version', async () => {
      const invalid = { ...validBlueprint, _version: '2.0' };
      const provider = new MockProvider([JSON.stringify(invalid)]);
      const agent = new ChiefArchitectAgent(provider);

      await expect(agent.run('Build a todo API', 'scaffold')).rejects.toThrow('version');
    });

    it('rejects blueprint missing name', async () => {
      const { name: _, ...noName } = validBlueprint;
      const provider = new MockProvider([JSON.stringify({ ...noName })]);
      const agent = new ChiefArchitectAgent(provider);

      await expect(agent.run('Build a todo API', 'scaffold')).rejects.toThrow('name');
    });
  });
});
