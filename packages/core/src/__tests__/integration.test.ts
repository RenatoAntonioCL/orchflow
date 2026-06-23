import { describe, it, expect, beforeAll } from 'vitest';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { OllamaProvider } from '../providers/ollama.js';
import { ChiefArchitectAgent } from '../agents/chief-architect/agent.js';
import { BackendDevAgent } from '../agents/backend-dev/agent.js';

const OUTPUT_DIR = '/tmp/orchflow-test';

describe('Integration: brief → files on disk', () => {
  beforeAll(() => {
    if (existsSync(OUTPUT_DIR)) {
      rmSync(OUTPUT_DIR, { recursive: true });
    }
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it('generates a project from a brief using Ollama', async () => {
    const provider = new OllamaProvider('qwen2.5-coder:7b');

    const architect = new ChiefArchitectAgent(provider);
    const architectResult = await architect.run(
      'Simple REST API for task management with Express and TypeScript',
      'scaffold',
    );

    console.log('Blueprint:', JSON.stringify(architectResult.blueprint, null, 2));
    console.log('Architect metrics:', architectResult.metrics);

    expect(architectResult.blueprint._version).toBe('1.0');
    expect(architectResult.blueprint.name).toBeTruthy();
    expect(architectResult.blueprint.agentPlan.length).toBeGreaterThan(0);

    const dev = new BackendDevAgent(provider);
    const devResult = await dev.run(architectResult.blueprint);

    console.log('Generated files:', devResult.files.map((f) => f.path));
    console.log('Dev metrics:', devResult.metrics);

    expect(devResult.files.length).toBeGreaterThan(0);

    for (const file of devResult.files) {
      const filePath = join(OUTPUT_DIR, file.path);
      const dir = join(filePath, '..');
      mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, file.content, 'utf-8');
    }

    expect(existsSync(join(OUTPUT_DIR, 'package.json'))).toBe(true);
  });
});
