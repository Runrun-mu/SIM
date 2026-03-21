import type { LLMRequest, LLMResponse } from '@sim/shared';

export interface LLMAdapter {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
