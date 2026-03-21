import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';
import { createWDConfig } from '../../src/scenarios/wealth-distribution/config';
import { WealthDistributionEnvironment } from '../../src/scenarios/wealth-distribution/environment';

const makeAgents = (count: number): AgentIdentity[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i}`,
    age: 25 + i,
    occupation: 'Trader',
    personality: 'Shrewd',
    wealth: 100,
    soul: `You are Agent ${i}, a shrewd trader.`,
  }));

describe('Wealth Distribution', () => {
  it('creates valid config', () => {
    const config = createWDConfig();
    expect(config.type).toBe('wealth-distribution');
    expect(config.parameters.initialWealth).toBe(100);
    expect(config.parameters.tradeRange).toBe(0.3);
  });

  it('config allows overrides', () => {
    const config = createWDConfig({ maxTicks: 10 });
    expect(config.maxTicks).toBe(10);
  });

  it('executes a full simulation with mock LLM', async () => {
    const llm = new MockLLMAdapter();
    const config = createWDConfig({ maxTicks: 3, agentCount: 4 });
    const env = new WealthDistributionEnvironment(config.parameters.tradeRange, llm);
    const agents = makeAgents(4);

    const ticks: number[] = [];
    const engine = new SimulationEngine(config, agents, env, llm, {
      tickDelay: 0,
      onTick: (m) => ticks.push(m.tick),
    });

    await engine.start();

    expect(engine.getStatus()).toBe('ended');
    expect(ticks).toEqual([1, 2, 3]);
  });

  it('computes Gini coefficient and wealth distribution', async () => {
    const llm = new MockLLMAdapter();
    const config = createWDConfig({ maxTicks: 3, agentCount: 4 });
    const env = new WealthDistributionEnvironment(config.parameters.tradeRange, llm);
    const agents = makeAgents(4);

    const engine = new SimulationEngine(config, agents, env, llm, { tickDelay: 0 });
    await engine.start();

    const history = engine.getHistory();
    for (const h of history) {
      expect(h.aggregated.giniCoefficient).toBeDefined();
      expect(typeof h.aggregated.giniCoefficient).toBe('number');
      expect(h.aggregated.wealthDistribution).toBeDefined();
      expect(h.aggregated.top10Percent).toBeDefined();
    }
  });

  it('total wealth is approximately conserved', async () => {
    const llm = new MockLLMAdapter();
    const config = createWDConfig({ maxTicks: 5, agentCount: 4 });
    const env = new WealthDistributionEnvironment(config.parameters.tradeRange, llm);
    const agents = makeAgents(4);

    const engine = new SimulationEngine(config, agents, env, llm, { tickDelay: 0 });
    await engine.start();

    const initialTotal = 4 * 100;
    const finalAgents = engine.getAgents();
    const finalTotal = finalAgents.reduce((sum, a) => sum + a.resources.wealth, 0);

    // Total wealth should be exactly conserved in trades (transfer only)
    expect(finalTotal).toBe(initialTotal);
  });
});
