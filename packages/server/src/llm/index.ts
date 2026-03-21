import { type RealAdapterOptions, RealLLMAdapter } from './adapter';
import { MockLLMAdapter } from './mock-adapter';
import type { LLMAdapter } from './types';

/**
 * Create the appropriate LLM adapter based on environment configuration.
 * If LLM_MOCK=true, returns a MockLLMAdapter.
 * Otherwise, returns a RealLLMAdapter with the configured provider.
 */
export function createLLMAdapter(options?: RealAdapterOptions): LLMAdapter {
  const useMock = process.env.LLM_MOCK === 'true';

  if (useMock) {
    return new MockLLMAdapter({ strategy: 'random' });
  }

  return new RealLLMAdapter(options);
}

export { MockLLMAdapter } from './mock-adapter';
export { RealLLMAdapter } from './adapter';
export type { LLMAdapter } from './types';
