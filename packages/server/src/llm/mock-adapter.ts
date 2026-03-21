import type { LLMRequest, LLMResponse, PDAction } from '@sim/shared';
import type { LLMAdapter } from './types';

export type MockStrategy = 'random' | 'always-cooperate' | 'always-defect' | 'tit-for-tat';

export interface MockAdapterOptions {
  strategy?: MockStrategy;
  delay?: number; // simulate latency in ms
}

const PD_ACTIONS: PDAction[] = ['cooperate', 'defect'];

/**
 * Mock LLM adapter that returns deterministic or random responses
 * without calling any real API. Used for testing.
 */
export class MockLLMAdapter implements LLMAdapter {
  private strategy: MockStrategy;
  private delay: number;
  private callCount = 0;

  constructor(options: MockAdapterOptions = {}) {
    this.strategy = options.strategy ?? 'random';
    this.delay = options.delay ?? 0;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    this.callCount++;
    const content = this.generateResponse(request);

    return {
      content,
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
      },
    };
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }

  private generateResponse(request: LLMRequest): string {
    const systemPrompt = request.systemPrompt.toLowerCase();
    const lastMessage = request.messages[request.messages.length - 1]?.content.toLowerCase() ?? '';

    // Detect scenario type from prompt context
    if (
      systemPrompt.includes('prisoner') ||
      systemPrompt.includes('cooperate') ||
      systemPrompt.includes('defect') ||
      lastMessage.includes('cooperate') ||
      lastMessage.includes('defect')
    ) {
      return this.generatePDResponse(request);
    }

    if (
      systemPrompt.includes('trade') ||
      systemPrompt.includes('wealth') ||
      lastMessage.includes('trade') ||
      lastMessage.includes('offer')
    ) {
      return this.generateTradeResponse(request);
    }

    // Memory consolidation / reflection
    if (lastMessage.includes('summarize') || lastMessage.includes('consolidate')) {
      return 'Based on recent events, I have observed patterns of interaction and adapted my strategy accordingly.';
    }

    // Default fallback
    return 'I will consider the situation carefully and make my decision.';
  }

  private generatePDResponse(_request: LLMRequest): string {
    let action: PDAction;

    switch (this.strategy) {
      case 'always-cooperate':
        action = 'cooperate';
        break;
      case 'always-defect':
        action = 'defect';
        break;
      case 'tit-for-tat': {
        // Start cooperative, then mirror last opponent action
        const lastMsg =
          _request.messages[_request.messages.length - 1]?.content.toLowerCase() ?? '';
        if (lastMsg.includes('defected') || lastMsg.includes('betrayed')) {
          action = 'defect';
        } else {
          action = 'cooperate';
        }
        break;
      }
      default: {
        // random
        action = PD_ACTIONS[Math.floor(Math.random() * PD_ACTIONS.length)] as PDAction;
      }
    }

    return JSON.stringify({
      action,
      reasoning: `As a mock agent with ${this.strategy} strategy, I choose to ${action}.`,
    });
  }

  private generateTradeResponse(_request: LLMRequest): string {
    const offer = Math.floor(Math.random() * 30) + 5;
    const demand = Math.floor(Math.random() * 30) + 5;

    return JSON.stringify({
      offer,
      demand,
      reasoning: `As a mock trader, I offer ${offer} and demand ${demand}.`,
    });
  }
}
