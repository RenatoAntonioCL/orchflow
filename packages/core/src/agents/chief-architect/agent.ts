import type { Provider, ProjectBlueprint, OutputLevel } from '../../types/index.js';
import { buildChiefArchitectPrompt } from './v1.prompt.js';

export class ChiefArchitectAgent {
  readonly promptVersion = 'v1';

  constructor(private provider: Provider) {}

  async run(brief: string, outputLevel: OutputLevel): Promise<{
    blueprint: ProjectBlueprint;
    metrics: { latencyMs: number; inputTokens: number; outputTokens: number; costUSD: number };
  }> {
    const prompt = buildChiefArchitectPrompt(brief, outputLevel);
    const start = performance.now();
    const result = await this.provider.complete(prompt);
    const latencyMs = Math.round(performance.now() - start);

    const blueprint = parseBlueprint(result.text);

    return {
      blueprint,
      metrics: {
        latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUSD: 0,
      },
    };
  }
}

function parseBlueprint(raw: string): ProjectBlueprint {
  const cleaned = raw.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Failed to parse blueprint JSON: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(match[0]);
  }

  const bp = parsed as Record<string, unknown>;
  if (bp._version !== '1.0') throw new Error(`Unexpected blueprint version: ${String(bp._version)}`);
  if (typeof bp.name !== 'string') throw new Error('Blueprint missing name');
  if (!Array.isArray(bp.agentPlan)) throw new Error('Blueprint missing agentPlan');

  return parsed as ProjectBlueprint;
}
