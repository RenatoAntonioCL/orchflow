import { describe, it, expect } from 'vitest';
import { DevOpsAgent } from './agent.js';
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
  stack: { language: 'TypeScript', runtime: 'Node.js 20', framework: 'Express' },
  agentPlan: [],
  architectureDecisions: [],
  risks: [],
};

const validFiles: GeneratedFile[] = [
  { path: 'Dockerfile', content: 'FROM node:20-alpine\nWORKDIR /app', language: 'dockerfile', description: 'Production image' },
  { path: 'docker-compose.yml', content: 'version: "3.8"', language: 'yaml', description: 'Compose file' },
  { path: '.github/workflows/ci.yml', content: 'name: CI', language: 'yaml', description: 'CI pipeline' },
  { path: '.dockerignore', content: 'node_modules', language: 'text', description: 'Docker ignore' },
];

describe('DevOpsAgent', () => {
  describe('Level 1 — structure', () => {
    it('returns files with all required fields', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new DevOpsAgent(provider);
      const result = await agent.run(mockBlueprint);

      expect(result.files.length).toBeGreaterThan(0);
      for (const file of result.files) {
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('content');
      }
    });

    it('records metrics', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new DevOpsAgent(provider);
      const result = await agent.run(mockBlueprint);
      expect(result.metrics).toHaveProperty('latencyMs');
    });
  });

  describe('Level 2 — contracts', () => {
    it('generates Dockerfile and docker-compose.yml', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new DevOpsAgent(provider);
      const result = await agent.run(mockBlueprint);

      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('Dockerfile');
      expect(paths).toContain('docker-compose.yml');
    });

    it('generates CI workflow', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new DevOpsAgent(provider);
      const result = await agent.run(mockBlueprint);

      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('.github/workflows/ci.yml');
    });

    it('rejects empty file array', async () => {
      const provider = new MockProvider(['[]']);
      const agent = new DevOpsAgent(provider);
      await expect(agent.run(mockBlueprint)).rejects.toThrow('No files generated');
    });
  });
});
