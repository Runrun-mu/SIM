import { describe, expect, it } from 'bun:test';
import type { LLMRequest } from '@sim/shared';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';

const makePDRequest = (extra = ''): LLMRequest => ({
  systemPrompt: "You are in a prisoner's dilemma game. Choose to cooperate or defect.",
  messages: [{ role: 'user', content: `Round 1: Choose your action. ${extra}` }],
});

const makeTradeRequest = (): LLMRequest => ({
  systemPrompt: 'You are in a wealth distribution trade game.',
  messages: [{ role: 'user', content: 'You have 100 wealth. Make a trade offer.' }],
});

const makeConsolidateRequest = (): LLMRequest => ({
  systemPrompt: 'You are an agent with memories.',
  messages: [{ role: 'user', content: 'Please summarize your recent experiences.' }],
});

describe('MockLLMAdapter', () => {
  it('returns valid JSON for PD response', async () => {
    const adapter = new MockLLMAdapter({ strategy: 'random' });
    const response = await adapter.generate(makePDRequest());
    const parsed = JSON.parse(response.content);
    expect(parsed.action).toBeDefined();
    expect(['cooperate', 'defect']).toContain(parsed.action);
    expect(parsed.reasoning).toBeDefined();
  });

  it('always cooperates with always-cooperate strategy', async () => {
    const adapter = new MockLLMAdapter({ strategy: 'always-cooperate' });
    for (let i = 0; i < 5; i++) {
      const response = await adapter.generate(makePDRequest());
      const parsed = JSON.parse(response.content);
      expect(parsed.action).toBe('cooperate');
    }
  });

  it('always defects with always-defect strategy', async () => {
    const adapter = new MockLLMAdapter({ strategy: 'always-defect' });
    for (let i = 0; i < 5; i++) {
      const response = await adapter.generate(makePDRequest());
      const parsed = JSON.parse(response.content);
      expect(parsed.action).toBe('defect');
    }
  });

  it('tit-for-tat: cooperates by default, defects after opponent defects', async () => {
    const adapter = new MockLLMAdapter({ strategy: 'tit-for-tat' });

    // Default: cooperate
    const r1 = await adapter.generate(makePDRequest());
    expect(JSON.parse(r1.content).action).toBe('cooperate');

    // After opponent defected
    const r2 = await adapter.generate(makePDRequest('Your opponent defected last round.'));
    expect(JSON.parse(r2.content).action).toBe('defect');
  });

  it('returns valid trade response', async () => {
    const adapter = new MockLLMAdapter();
    const response = await adapter.generate(makeTradeRequest());
    const parsed = JSON.parse(response.content);
    expect(parsed.offer).toBeGreaterThan(0);
    expect(parsed.demand).toBeGreaterThan(0);
    expect(parsed.reasoning).toBeDefined();
  });

  it('returns consolidation response', async () => {
    const adapter = new MockLLMAdapter();
    const response = await adapter.generate(makeConsolidateRequest());
    expect(response.content).toContain('observed');
  });

  it('tracks call count', async () => {
    const adapter = new MockLLMAdapter();
    expect(adapter.getCallCount()).toBe(0);
    await adapter.generate(makePDRequest());
    await adapter.generate(makePDRequest());
    expect(adapter.getCallCount()).toBe(2);
    adapter.resetCallCount();
    expect(adapter.getCallCount()).toBe(0);
  });

  it('includes usage stats', async () => {
    const adapter = new MockLLMAdapter();
    const response = await adapter.generate(makePDRequest());
    expect(response.usage).toBeDefined();
    expect(response.usage?.totalTokens).toBeGreaterThan(0);
  });

  it('simulates delay when configured', async () => {
    const adapter = new MockLLMAdapter({ delay: 50 });
    const start = Date.now();
    await adapter.generate(makePDRequest());
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // allow some tolerance
  });
});
