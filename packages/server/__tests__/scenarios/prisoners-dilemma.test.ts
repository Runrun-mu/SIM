import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { PD_DEFAULT_PAYOFF } from '@sim/shared';
import { SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';
import { createPDConfig } from '../../src/scenarios/prisoners-dilemma/config';
import { PrisonersDilemmaEnvironment } from '../../src/scenarios/prisoners-dilemma/environment';

const makeAgents = (count: number): AgentIdentity[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i}`,
    age: 25 + i,
    occupation: 'Player',
    personality: 'Strategic',
    wealth: 100,
    soul: `You are Agent ${i}, a strategic game player.`,
  }));

describe('Prisoners Dilemma', () => {
  it('creates valid config', () => {
    const config = createPDConfig();
    expect(config.type).toBe('prisoners-dilemma');
    expect(config.parameters.payoffMatrix).toEqual(PD_DEFAULT_PAYOFF);
  });

  it('config allows overrides', () => {
    const config = createPDConfig({ maxTicks: 5, agentCount: 6 });
    expect(config.maxTicks).toBe(5);
    expect(config.agentCount).toBe(6);
  });

  it('executes a full simulation with mock LLM (always-cooperate)', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const config = createPDConfig({ maxTicks: 3, agentCount: 4 });
    const env = new PrisonersDilemmaEnvironment(config.parameters.payoffMatrix, llm);
    const agents = makeAgents(4);

    const ticks: number[] = [];
    const engine = new SimulationEngine(config, agents, env, llm, {
      tickDelay: 0,
      onTick: (m) => ticks.push(m.tick),
    });

    await engine.start();

    expect(engine.getStatus()).toBe('ended');
    expect(ticks).toEqual([1, 2, 3]);

    // Check history metrics
    const history = engine.getHistory();
    expect(history).toHaveLength(3);

    // With all-cooperate, cooperation rate should be 1.0
    const lastTick = history[history.length - 1];
    expect(lastTick?.aggregated.cooperationRate).toBe(1);
  });

  it('executes a full simulation with mixed strategies', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createPDConfig({ maxTicks: 5, agentCount: 4 });
    const env = new PrisonersDilemmaEnvironment(config.parameters.payoffMatrix, llm);
    const agents = makeAgents(4);

    const engine = new SimulationEngine(config, agents, env, llm, { tickDelay: 0 });
    await engine.start();

    expect(engine.getStatus()).toBe('ended');
    expect(engine.getCurrentTick()).toBe(5);

    // Metrics should exist
    const history = engine.getHistory();
    for (const h of history) {
      expect(h.aggregated.cooperationRate).toBeDefined();
      expect(h.aggregated.strategyDistribution).toBeDefined();
      expect(h.aggregated.averageScore).toBeDefined();
    }
  });

  it('agents accumulate wealth over rounds', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const config = createPDConfig({ maxTicks: 3, agentCount: 2 });
    const env = new PrisonersDilemmaEnvironment(config.parameters.payoffMatrix, llm);
    const agents = makeAgents(2);

    const engine = new SimulationEngine(config, agents, env, llm, { tickDelay: 0 });
    await engine.start();

    // Both cooperated for 3 rounds, gaining 3 each round = 9 total
    const finalAgents = engine.getAgents();
    for (const a of finalAgents) {
      expect(a.resources.wealth).toBe(100 + 3 * PD_DEFAULT_PAYOFF.bothCooperate);
    }
  });
});
