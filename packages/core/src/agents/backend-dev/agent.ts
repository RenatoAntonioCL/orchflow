import type { Provider, ProjectBlueprint, GeneratedFile } from '../../types/index.js';
import { buildBackendDevPrompt } from './v1.prompt.js';

export class BackendDevAgent {
  readonly promptVersion = 'v1';

  constructor(private provider: Provider) {}

  async run(blueprint: ProjectBlueprint): Promise<{
    files: GeneratedFile[];
    metrics: { latencyMs: number; inputTokens: number; outputTokens: number; costUSD: number };
  }> {
    const prompt = buildBackendDevPrompt(blueprint);
    const start = performance.now();
    const result = await this.provider.complete(prompt);
    const latencyMs = Math.round(performance.now() - start);

    const files = parseFiles(result.text);

    return {
      files,
      metrics: {
        latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUSD: 0,
      },
    };
  }
}

function parseFiles(raw: string): GeneratedFile[] {
  const cleaned = raw.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`Failed to parse files JSON: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) throw new Error('Expected JSON array of files');
  if (parsed.length === 0) throw new Error('No files generated');

  for (const file of parsed) {
    const f = file as Record<string, unknown>;
    if (typeof f.path !== 'string') throw new Error('File missing path');
    if (typeof f.content !== 'string') throw new Error(`File ${String(f.path)} missing content`);
    if (typeof f.language !== 'string') throw new Error(`File ${String(f.path)} missing language`);
    if (typeof f.description !== 'string')
      throw new Error(`File ${String(f.path)} missing description`);
  }

  return parsed as GeneratedFile[];
}
