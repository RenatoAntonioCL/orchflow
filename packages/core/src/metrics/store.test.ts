import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsStore } from './store.js';
import { rmSync, existsSync } from 'node:fs';

const DB_PATH = '/tmp/orchflow-metrics-test.db';

beforeEach(() => {
  if (existsSync(DB_PATH)) rmSync(DB_PATH);
});

describe('MetricsStore', () => {
  it('records and retrieves metrics by runId', async () => {
    const store = await MetricsStore.create(DB_PATH);

    await store.record({
      id: 'metric-001',
      runId: 'run-001',
      agentId: 'backend-dev',
      promptVer: 'v1',
      projectType: 'api',
      latencyMs: 5000,
      inputTokens: 100,
      outputTokens: 200,
      costUsd: 0.01,
    });

    await store.record({
      id: 'metric-002',
      runId: 'run-001',
      agentId: 'chief-architect',
      promptVer: 'v1',
      projectType: 'api',
      latencyMs: 3000,
      inputTokens: 50,
      outputTokens: 100,
      costUsd: 0.005,
    });

    const rows = await store.getByRun('run-001');
    expect(rows).toHaveLength(2);
    expect(rows[0].agentId).toBe('backend-dev');
    expect(rows[0].latencyMs).toBe(5000);
  });

  it('returns empty array for unknown runId', async () => {
    const store = await MetricsStore.create(DB_PATH);
    expect(await store.getByRun('nonexistent')).toHaveLength(0);
  });
});
