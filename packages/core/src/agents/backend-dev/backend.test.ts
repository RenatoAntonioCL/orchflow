import { describe, it, expect } from 'vitest';
import { BackendDevAgent } from './agent.js';
import { MockProvider } from '../../providers/mock.js';
import type { ProjectBlueprint, GeneratedFile } from '../../types/index.js';

const mockBlueprint: ProjectBlueprint = {
  _version: '1.0',
  id: 'proj-test-001',
  createdAt: '2026-06-22T00:00:00.000Z',
  name: 'todo-api',
  description: 'REST API for todos',
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
      context: 'Produce blueprint',
    },
    {
      agentId: 'backend-dev',
      role: 'developer',
      dependsOn: ['chief-architect'],
      canRunParallel: false,
      context: 'Generate API files',
    },
  ],
  architectureDecisions: ['Express for simplicity'],
  risks: [],
};

const validFiles: GeneratedFile[] = [
  {
    path: 'package.json',
    content: '{"name":"todo-api","version":"1.0.0","scripts":{"start":"node src/index.js"}}',
    language: 'json',
    description: 'Package manifest',
  },
  {
    path: 'src/index.js',
    content: 'const express = require("express"); const app = express(); app.listen(3000);',
    language: 'javascript',
    description: 'Entry point',
  },
  {
    path: '.env.example',
    content: 'PORT=3000\nNODE_ENV=development',
    language: 'env',
    description: 'Environment variables template',
  },
  {
    path: 'README.md',
    content: '# Todo API\n\nREST API for todos.',
    language: 'markdown',
    description: 'Project documentation',
  },
];

describe('BackendDevAgent', () => {
  describe('Level 1 — structure', () => {
    it('returns files with all required fields', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new BackendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      expect(result.files.length).toBeGreaterThan(0);
      for (const file of result.files) {
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('content');
        expect(file).toHaveProperty('language');
        expect(file).toHaveProperty('description');
      }
    });

    it('records metrics', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new BackendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      expect(result.metrics).toHaveProperty('latencyMs');
      expect(result.metrics).toHaveProperty('inputTokens');
      expect(result.metrics).toHaveProperty('outputTokens');
      expect(result.metrics).toHaveProperty('costUSD');
    });

    it('handles JSON wrapped in markdown code blocks', async () => {
      const wrapped = '```json\n' + JSON.stringify(validFiles) + '\n```';
      const provider = new MockProvider([wrapped]);
      const agent = new BackendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      expect(result.files.length).toBe(4);
    });
  });

  describe('Level 2 — contracts', () => {
    it('always generates package.json', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new BackendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('package.json');
    });

    it('always generates .env.example', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new BackendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('.env.example');
    });

    it('rejects empty file array', async () => {
      const provider = new MockProvider(['[]']);
      const agent = new BackendDevAgent(provider);

      await expect(agent.run(mockBlueprint)).rejects.toThrow('No files generated');
    });

    it('rejects files missing required fields', async () => {
      const invalid = [{ path: 'file.ts' }];
      const provider = new MockProvider([JSON.stringify(invalid)]);
      const agent = new BackendDevAgent(provider);

      await expect(agent.run(mockBlueprint)).rejects.toThrow('missing content');
    });
  });
});
