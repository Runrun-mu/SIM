import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';
import { createPGConfig } from '../../src/scenarios/public-goods/config';
import { PublicGoodsEnvironment } from '../../src/scenarios/public-goods/environment';

const makeAgents = (count: number): AgentIdentity[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i}`,
    age: 25 + i,
    occupation: 'Player',
    personality: 'Strategic',
    wealth: 100,
    soul: `You are Agent ${i}.`,
  }));

describe('Public Goods Game', () => {
  it('creates valid config', () => {
    const config = createPGConfig();
    expect(config.type).toBe('public-goods');
    expect(config.parameters.multiplier).toBe(2);
  });

  it('executes simulation with mock LLM', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const config = createPGConfig({ maxTicks: 3, agentCount: 4 });
    const env = new PublicGoodsEnvironment({ multiplier: 2, endowment: 20 }, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()).toHaveLength(3);
  });

  it('computes metrics correctly', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const config = createPGConfig({ maxTicks: 1, agentCount: 4 });
    const env = new PublicGoodsEnvironment({ multiplier: 2, endowment: 20 }, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    const last = engine.getHistory()[0];
    expect(last?.aggregated.averageContribution).toBeDefined();
    expect(last?.aggregated.publicPoolTotal).toBeDefined();
  });
});
