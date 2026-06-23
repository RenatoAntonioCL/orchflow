import { describe, it, expect } from 'vitest';
import { FrontendDevAgent } from './agent.js';
import { MockProvider } from '../../providers/mock.js';
import type { ProjectBlueprint, GeneratedFile } from '../../types/index.js';

const mockBlueprint: ProjectBlueprint = {
  _version: '1.0',
  id: 'proj-test-001',
  createdAt: '2026-06-22T00:00:00.000Z',
  name: 'todo-app',
  description: 'Fullstack todo app',
  projectType: 'fullstack',
  outputLevel: 'scaffold',
  difficulty: 'low',
  estimatedMinutes: 4,
  estimatedCostUSD: 0.2,
  stack: {
    language: 'TypeScript',
    runtime: 'Node.js 20',
    framework: 'Express',
    frontend: 'React',
  },
  agentPlan: [],
  architectureDecisions: [],
  risks: [],
};

const validFiles: GeneratedFile[] = [
  {
    path: 'frontend/package.json',
    content: '{"name":"todo-frontend","version":"1.0.0"}',
    language: 'json',
    description: 'Frontend package manifest',
  },
  {
    path: 'frontend/index.html',
    content: '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
    language: 'html',
    description: 'HTML entry point',
  },
  {
    path: 'frontend/src/main.tsx',
    content: 'import React from "react";',
    language: 'typescript',
    description: 'React entry point',
  },
];

describe('FrontendDevAgent', () => {
  describe('Level 1 — structure', () => {
    it('returns files with all required fields', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new FrontendDevAgent(provider);
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
      const agent = new FrontendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      expect(result.metrics).toHaveProperty('latencyMs');
      expect(result.metrics).toHaveProperty('inputTokens');
      expect(result.metrics).toHaveProperty('outputTokens');
      expect(result.metrics).toHaveProperty('costUSD');
    });
  });

  describe('Level 2 — contracts', () => {
    it('generates frontend/package.json', async () => {
      const provider = new MockProvider([JSON.stringify(validFiles)]);
      const agent = new FrontendDevAgent(provider);
      const result = await agent.run(mockBlueprint);

      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('frontend/package.json');
    });

    it('rejects empty file array', async () => {
      const provider = new MockProvider(['[]']);
      const agent = new FrontendDevAgent(provider);
      await expect(agent.run(mockBlueprint)).rejects.toThrow('No files generated');
    });
  });
});
