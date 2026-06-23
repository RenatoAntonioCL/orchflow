import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OllamaProvider } from '../providers/ollama.js';
import { ChiefArchitectAgent } from '../agents/chief-architect/agent.js';
import { BackendDevAgent } from '../agents/backend-dev/agent.js';
import { FrontendDevAgent } from '../agents/frontend-dev/agent.js';
import { DevOpsAgent } from '../agents/devops/agent.js';
import { TechWriterAgent } from '../agents/tech-writer/agent.js';
import { assembleFiles } from '../assembler/assembler.js';
import { createZip } from '../assembler/zip.js';
import { MetricsStore } from '../metrics/store.js';
import type { GeneratedFile } from '../types/index.js';

const OUTPUT_DIR = '/tmp/orchflow-test';
const ZIP_PATH = '/tmp/orchflow-test.zip';
const DB_PATH = '/tmp/orchflow-integration-metrics.db';

describe('Integration: full pipeline → ZIP on disk', () => {
  beforeAll(() => {
    for (const p of [OUTPUT_DIR, ZIP_PATH, DB_PATH]) {
      if (existsSync(p)) rmSync(p, { recursive: true });
    }
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it('brief → all agents → assembled files → ZIP', async () => {
    const provider = new OllamaProvider('qwen2.5-coder:7b');
    const runId = `run-${Date.now()}`;
    const store = await MetricsStore.create(DB_PATH);

    // 1. Chief Architect
    const architect = new ChiefArchitectAgent(provider);
    const { blueprint, metrics: architectMetrics } = await architect.run(
      'Simple REST API for task management with Express and TypeScript',
      'scaffold',
    );
    console.log('Blueprint:', blueprint.name, '| Architect:', architectMetrics.latencyMs, 'ms');

    await store.record({
      id: `${runId}-chief-architect`,
      runId,
      agentId: 'chief-architect',
      promptVer: architect.promptVersion,
      projectType: blueprint.projectType,
      ...architectMetrics,
      costUsd: architectMetrics.costUSD,
    });

    expect(blueprint._version).toBe('1.0');

    // 2. Backend Dev
    const backendDev = new BackendDevAgent(provider);
    const backendResult = await backendDev.run(blueprint);
    console.log('Backend files:', backendResult.files.map((f) => f.path));

    await store.record({
      id: `${runId}-backend-dev`,
      runId,
      agentId: 'backend-dev',
      promptVer: backendDev.promptVersion,
      projectType: blueprint.projectType,
      ...backendResult.metrics,
      costUsd: backendResult.metrics.costUSD,
    });

    // 3. Frontend Dev (only if blueprint has frontend)
    let frontendFiles: GeneratedFile[] = [];
    if (blueprint.stack.frontend) {
      const frontendDev = new FrontendDevAgent(provider);
      const frontendResult = await frontendDev.run(blueprint);
      frontendFiles = frontendResult.files;
      console.log('Frontend files:', frontendFiles.map((f) => f.path));

      await store.record({
        id: `${runId}-frontend-dev`,
        runId,
        agentId: 'frontend-dev',
        promptVer: frontendDev.promptVersion,
        projectType: blueprint.projectType,
        ...frontendResult.metrics,
        costUsd: frontendResult.metrics.costUSD,
      });
    }

    // 4. DevOps
    const devops = new DevOpsAgent(provider);
    const devopsResult = await devops.run(blueprint);
    console.log('DevOps files:', devopsResult.files.map((f) => f.path));

    await store.record({
      id: `${runId}-devops`,
      runId,
      agentId: 'devops',
      promptVer: devops.promptVersion,
      projectType: blueprint.projectType,
      ...devopsResult.metrics,
      costUsd: devopsResult.metrics.costUSD,
    });

    // 5. Tech Writer
    const allCodeFiles = [...backendResult.files, ...frontendFiles, ...devopsResult.files];
    const writer = new TechWriterAgent(provider);
    const writerResult = await writer.run(blueprint, allCodeFiles);
    console.log('Writer files:', writerResult.files.map((f) => f.path));

    await store.record({
      id: `${runId}-tech-writer`,
      runId,
      agentId: 'tech-writer',
      promptVer: writer.promptVersion,
      projectType: blueprint.projectType,
      ...writerResult.metrics,
      costUsd: writerResult.metrics.costUSD,
    });

    // 6. Assemble
    const { writtenFiles, conflicts } = assembleFiles(OUTPUT_DIR, [
      backendResult.files,
      frontendFiles,
      devopsResult.files,
      writerResult.files,
    ]);
    console.log('Assembled:', writtenFiles.length, 'files |', conflicts.length, 'conflicts');

    expect(writtenFiles.length).toBeGreaterThan(0);
    expect(existsSync(join(OUTPUT_DIR, 'package.json'))).toBe(true);

    // 7. ZIP
    const zipPath = createZip(OUTPUT_DIR, ZIP_PATH);
    expect(existsSync(zipPath)).toBe(true);
    console.log('ZIP created:', zipPath);

    // 8. Verify metrics recorded
    const recorded = await store.getByRun(runId);
    expect(recorded.length).toBeGreaterThanOrEqual(4);
    console.log('Metrics recorded:', recorded.length, 'rows');
  });
});
