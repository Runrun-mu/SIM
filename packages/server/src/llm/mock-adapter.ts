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
    const combined = `${systemPrompt} ${lastMessage}`;

    // Memory consolidation / reflection
    if (lastMessage.includes('summarize') || lastMessage.includes('consolidate')) {
      return 'Based on recent events, I have observed patterns of interaction and adapted my strategy accordingly.';
    }

    // Trade / Wealth Distribution — must check BEFORE PD since agent souls may contain "cooperate"
    if (
      lastMessage.includes('trading game') ||
      lastMessage.includes('wealth trading') ||
      lastMessage.includes('trade offer') ||
      combined.includes('wealth distribution trade') ||
      (lastMessage.includes('offer') && lastMessage.includes('demand'))
    ) {
      return this.generateTradeResponse();
    }

    // Public Goods Game
    if (
      combined.includes('public pool') ||
      combined.includes('public goods') ||
      (lastMessage.includes('endowment') && lastMessage.includes('contribute'))
    ) {
      const contribution =
        this.strategy === 'always-cooperate'
          ? 20
          : this.strategy === 'always-defect'
            ? 0
            : Math.floor(Math.random() * 20);
      return JSON.stringify({ contribution, reasoning: `Mock: contributing ${contribution}.` });
    }

    // Ultimatum Game - responder
    if (lastMessage.includes('proposer offers') || lastMessage.includes('if you accept')) {
      const accept = this.strategy !== 'always-defect';
      return JSON.stringify({ accept, reasoning: `Mock: ${accept ? 'accepting' : 'rejecting'}.` });
    }

    // Ultimatum / Dictator - proposer (offer split)
    if (
      lastMessage.includes('you are the proposer') ||
      lastMessage.includes('you are the dictator')
    ) {
      const offer =
        this.strategy === 'always-cooperate'
          ? 50
          : this.strategy === 'always-defect'
            ? 10
            : Math.floor(Math.random() * 60) + 10;
      return JSON.stringify({ offer, reasoning: `Mock: offering ${offer}.` });
    }

    // Hawk-Dove Game
    if (
      lastMessage.includes('hawk') &&
      lastMessage.includes('dove') &&
      lastMessage.includes('hawk-dove')
    ) {
      const action =
        this.strategy === 'always-cooperate'
          ? 'dove'
          : this.strategy === 'always-defect'
            ? 'hawk'
            : Math.random() > 0.5
              ? 'hawk'
              : 'dove';
      return JSON.stringify({ action, reasoning: `Mock: ${action}.` });
    }

    // Trust Game - investment or return
    if (lastMessage.includes('trust game')) {
      const amount =
        this.strategy === 'always-cooperate'
          ? 60
          : this.strategy === 'always-defect'
            ? 5
            : Math.floor(Math.random() * 50) + 10;
      return JSON.stringify({ amount, reasoning: `Mock: amount ${amount}.` });
    }

    // Minority Game
    if (lastMessage.includes('minority')) {
      const choice = Math.random() > 0.5 ? 'A' : 'B';
      return JSON.stringify({ choice, reasoning: `Mock: choosing ${choice}.` });
    }

    // Tragedy of Commons
    if (
      lastMessage.includes('commons') ||
      (lastMessage.includes('shared pool') && lastMessage.includes('extract'))
    ) {
      const extraction =
        this.strategy === 'always-cooperate'
          ? 10
          : this.strategy === 'always-defect'
            ? 50
            : Math.floor(Math.random() * 40) + 5;
      return JSON.stringify({ extraction, reasoning: `Mock: extracting ${extraction}.` });
    }

    // Schelling Segregation
    if (lastMessage.includes('schelling') || lastMessage.includes('segregation')) {
      const action = Math.random() > 0.5 ? 'stay' : 'move';
      return JSON.stringify({ action, reasoning: `Mock: ${action}.` });
    }

    // Voting Model
    if (lastMessage.includes('voting') || lastMessage.includes('candidate')) {
      const candidates = ['Alpha', 'Beta', 'Gamma'];
      const vote = candidates[Math.floor(Math.random() * candidates.length)];
      return JSON.stringify({ vote, reasoning: `Mock: voting ${vote}.` });
    }

    // SIR Epidemic
    if (
      lastMessage.includes('epidemic') ||
      (lastMessage.includes('socialize') && lastMessage.includes('isolate'))
    ) {
      const actions = ['socialize', 'isolate', 'mask'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      return JSON.stringify({ action, reasoning: `Mock: ${action}.` });
    }

    // Social Influence
    if (
      lastMessage.includes('social influence') ||
      lastMessage.includes('newopinion') ||
      lastMessage.includes('new opinion')
    ) {
      const newOpinion = Math.floor(Math.random() * 100);
      return JSON.stringify({ newOpinion, reasoning: `Mock: opinion ${newOpinion}.` });
    }

    // PD / Axelrod (cooperate/defect) — use systemPrompt for scenario ID, lastMessage for actions
    if (
      systemPrompt.includes('prisoner') ||
      lastMessage.includes('cooperate') ||
      lastMessage.includes('defect') ||
      (systemPrompt.includes('cooperate') && systemPrompt.includes('defect'))
    ) {
      return this.generatePDResponse(request);
    }

    // Default fallback
    return JSON.stringify({ action: 'cooperate', reasoning: 'Mock default response.' });
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
        action = PD_ACTIONS[Math.floor(Math.random() * PD_ACTIONS.length)] as PDAction;
      }
    }

    return JSON.stringify({
      action,
      reasoning: `As a mock agent with ${this.strategy} strategy, I choose to ${action}.`,
    });
  }

  private generateTradeResponse(): string {
    const offer = Math.floor(Math.random() * 30) + 5;
    const demand = Math.floor(Math.random() * 30) + 5;

    return JSON.stringify({
      offer,
      demand,
      reasoning: `As a mock trader, I offer ${offer} and demand ${demand}.`,
    });
  }
}
