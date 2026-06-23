import type { Provider, ProjectBlueprint, GeneratedFile } from '../../types/index.js';
import { buildFrontendDevPrompt } from './v1.prompt.js';
import { parseGeneratedFiles } from '../parse-files.js';

export class FrontendDevAgent {
  readonly promptVersion = 'v1';

  constructor(private provider: Provider) {}

  async run(blueprint: ProjectBlueprint): Promise<{
    files: GeneratedFile[];
    metrics: { latencyMs: number; inputTokens: number; outputTokens: number; costUSD: number };
  }> {
    const prompt = buildFrontendDevPrompt(blueprint);
    const start = performance.now();
    const result = await this.provider.complete(prompt);
    const latencyMs = Math.round(performance.now() - start);

    return {
      files: parseGeneratedFiles(result.text),
      metrics: { latencyMs, inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUSD: 0 },
    };
  }
}
