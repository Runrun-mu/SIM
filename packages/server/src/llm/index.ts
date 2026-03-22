import { type RealAdapterOptions, RealLLMAdapter } from './adapter';
import { MockLLMAdapter } from './mock-adapter';
import type { LLMAdapter } from './types';

/**
 * Create the appropriate LLM adapter based on environment configuration.
 * If LLM_MOCK=true OR no API key is configured, returns a MockLLMAdapter.
 * Otherwise, returns a RealLLMAdapter with the configured provider.
 */
export function createLLMAdapter(options?: RealAdapterOptions): LLMAdapter {
  const useMock = process.env.LLM_MOCK === 'true';
  const hasApiKey = !!(
    options?.apiKey ??
    process.env.OPENAI_API_KEY ??
    process.env.ANTHROPIC_API_KEY
  );

  if (useMock || !hasApiKey) {
    if (!useMock && !hasApiKey) {
      console.warn(
        '[LLM] No API key found. Falling back to mock adapter. Set OPENAI_API_KEY or LLM_MOCK=true in .env',
      );
    }
    return new MockLLMAdapter({ strategy: 'random' });
  }

  return new RealLLMAdapter(options);
}

export { MockLLMAdapter } from './mock-adapter';
export { RealLLMAdapter } from './adapter';
export type { LLMAdapter } from './types';
