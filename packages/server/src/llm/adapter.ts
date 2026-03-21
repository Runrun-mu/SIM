import { createOpenAI } from '@ai-sdk/openai';
import type { LLMRequest, LLMResponse } from '@sim/shared';
import { DEFAULT_LLM_MAX_TOKENS, DEFAULT_LLM_TEMPERATURE } from '@sim/shared';
import { generateText } from 'ai';
import type { LLMAdapter } from './types';

export interface RealAdapterOptions {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

/**
 * Real LLM adapter using Vercel AI SDK.
 * Supports OpenAI (default), with extensibility for other providers.
 */
export class RealLLMAdapter implements LLMAdapter {
  private model: ReturnType<ReturnType<typeof createOpenAI>>;

  constructor(options: RealAdapterOptions = {}) {
    const provider = options.provider ?? process.env.LLM_PROVIDER ?? 'openai';
    const modelName = options.model ?? process.env.LLM_MODEL ?? 'gpt-4o-mini';
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    const baseURL = options.baseURL ?? process.env.OPENAI_BASE_URL;

    if (provider === 'openai') {
      const openai = createOpenAI({
        apiKey,
        baseURL,
      });
      this.model = openai(modelName);
    } else {
      // Default to OpenAI-compatible API
      const openai = createOpenAI({
        apiKey,
        baseURL: baseURL ?? process.env.OLLAMA_BASE_URL,
      });
      this.model = openai(modelName);
    }
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const result = await generateText({
      model: this.model,
      system: request.systemPrompt,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? DEFAULT_LLM_TEMPERATURE,
      maxTokens: request.maxTokens ?? DEFAULT_LLM_MAX_TOKENS,
    });

    return {
      content: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.promptTokens + result.usage.completionTokens,
          }
        : undefined,
    };
  }
}
