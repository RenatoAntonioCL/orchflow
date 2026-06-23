import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const agentMetrics = sqliteTable('agent_metrics', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  agentId: text('agent_id').notNull(),
  promptVer: text('prompt_ver').notNull(),
  projectType: text('project_type').notNull(),
  latencyMs: integer('latency_ms'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd: real('cost_usd'),
  correctness: real('correctness'),
  coherence: real('coherence'),
  completeness: real('completeness'),
  quality: real('quality'),
  buildSuccess: integer('build_success'),
  rejected: integer('rejected'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
