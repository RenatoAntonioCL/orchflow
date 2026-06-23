import { describe, it, expect } from 'vitest';
import { TechWriterAgent } from './agent.js';
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

const existingFiles: GeneratedFile[] = [
  { path: 'package.json', content: '{}', language: 'json', description: 'Package manifest' },
  { path: 'src/index.ts', content: '', language: 'typescript', description: 'Entry point' },
];

const validOutput: GeneratedFile[] = [
  { path: 'README.md', content: '# Todo API\n\nREST API for todos.', language: 'markdown', description: 'Project README' },
  { path: 'CONTRIBUTING.md', content: '# Contributing\n\nHow to contribute.', language: 'markdown', description: 'Contribution guide' },
];

describe('TechWriterAgent', () => {
  describe('Level 1 — structure', () => {
    it('returns files with all required fields', async () => {
      const provider = new MockProvider([JSON.stringify(validOutput)]);
      const agent = new TechWriterAgent(provider);
      const result = await agent.run(mockBlueprint, existingFiles);

      expect(result.files.length).toBeGreaterThan(0);
      for (const file of result.files) {
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('content');
      }
    });

    it('records metrics', async () => {
      const provider = new MockProvider([JSON.stringify(validOutput)]);
      const agent = new TechWriterAgent(provider);
      const result = await agent.run(mockBlueprint, existingFiles);
      expect(result.metrics).toHaveProperty('latencyMs');
    });
  });

  describe('Level 2 — contracts', () => {
    it('generates README.md and CONTRIBUTING.md', async () => {
      const provider = new MockProvider([JSON.stringify(validOutput)]);
      const agent = new TechWriterAgent(provider);
      const result = await agent.run(mockBlueprint, existingFiles);

      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('README.md');
      expect(paths).toContain('CONTRIBUTING.md');
    });

    it('rejects empty file array', async () => {
      const provider = new MockProvider(['[]']);
      const agent = new TechWriterAgent(provider);
      await expect(agent.run(mockBlueprint, existingFiles)).rejects.toThrow('No files generated');
    });
  });
});
