import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql } from 'drizzle-orm';
import { agentMetrics } from './schema.js';

export type MetricsRow = typeof agentMetrics.$inferInsert;

export class MetricsStore {
  private db;

  private constructor(db: MetricsStore['db']) {
    this.db = db;
  }

  static async create(dbPath: string): Promise<MetricsStore> {
    const client = createClient({ url: `file:${dbPath}` });
    const db = drizzle(client);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_metrics (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        prompt_ver TEXT NOT NULL,
        project_type TEXT NOT NULL,
        latency_ms INTEGER,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost_usd REAL,
        correctness REAL,
        coherence REAL,
        completeness REAL,
        quality REAL,
        build_success INTEGER,
        rejected INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_metrics_lookup
        ON agent_metrics (agent_id, prompt_ver, project_type)
    `);

    return new MetricsStore(db);
  }

  async record(row: MetricsRow): Promise<void> {
    await this.db.insert(agentMetrics).values(row).run();
  }

  async getByRun(runId: string) {
    return this.db
      .select()
      .from(agentMetrics)
      .where(sql`${agentMetrics.runId} = ${runId}`)
      .all();
  }
}
