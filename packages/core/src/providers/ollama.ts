import type { Provider } from '../types/index.js';

export class OllamaProvider implements Provider {
  constructor(
    private model: string,
    private baseUrl: string = 'http://localhost:11434',
  ) {}

  async complete(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      response: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      text: data.response,
      inputTokens: data.prompt_eval_count ?? 0,
      outputTokens: data.eval_count ?? 0,
    };
  }
}
