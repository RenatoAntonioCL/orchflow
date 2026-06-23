import type { Provider } from '../types/index.js';

export class MockProvider implements Provider {
  private callIndex = 0;

  constructor(private responses: string[]) {}

  async complete(_prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const text = this.responses[this.callIndex] ?? this.responses[this.responses.length - 1];
    this.callIndex++;
    return { text, inputTokens: 100, outputTokens: 200 };
  }
}
