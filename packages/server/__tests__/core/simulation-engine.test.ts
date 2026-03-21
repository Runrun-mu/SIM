import { describe, expect, it } from 'bun:test';
import type { AgentIdentity, Interaction, ScenarioConfig } from '@sim/shared';
import type { Agent } from '../../src/core/agent';
import { type ScenarioEnvironment, SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';

const makeConfig = (): ScenarioConfig => ({
  type: 'prisoners-dilemma',
  name: 'Test PD',
  description: 'Test',
  maxTicks: 3,
  agentCount: 2,
  parameters: {},
});

const makeIdentities = (): AgentIdentity[] => [
  {
    id: 'a1',
    name: 'Alice',
    age: 30,
    occupation: 'Engineer',
    personality: 'Cautious',
    wealth: 100,
    soul: 'You are Alice.',
  },
  {
    id: 'a2',
    name: 'Bob',
    age: 25,
    occupation: 'Trader',
    personality: 'Bold',
    wealth: 100,
    soul: 'You are Bob.',
  },
];

/** Simple test environment that just creates a dummy interaction */
class TestEnvironment implements ScenarioEnvironment {
  tickCount = 0;

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    this.tickCount++;
    return [
      {
        id: `test-${tick}`,
        tick,
        participants: agents.map((a) => a.identity.id),
        type: 'test',
        actions: Object.fromEntries(agents.map((a) => [a.identity.id, 'test-action'])),
        outcomes: Object.fromEntries(agents.map((a) => [a.identity.id, 1])),
      },
    ];
  }

  computeMetrics() {
    return { custom: { testMetric: this.tickCount } };
  }
}

describe('SimulationEngine', () => {
  it('initializes with idle status', () => {
    const env = new TestEnvironment();
    const llm = new MockLLMAdapter();
    const engine = new SimulationEngine(makeConfig(), makeIdentities(), env, llm, {
      tickDelay: 0,
    });

    expect(engine.getStatus()).toBe('idle');
    expect(engine.getCurrentTick()).toBe(0);
    expect(engine.getAgents()).toHaveLength(2);
  });

  it('runs through all ticks and ends', async () => {
    const env = new TestEnvironment();
    const llm = new MockLLMAdapter();
    const ticks: number[] = [];

    const engine = new SimulationEngine(makeConfig(), makeIdentities(), env, llm, {
      tickDelay: 0,
      onTick: (m) => ticks.push(m.tick),
    });

    await engine.start();

    expect(engine.getStatus()).toBe('ended');
    expect(engine.getCurrentTick()).toBe(3);
    expect(ticks).toEqual([1, 2, 3]);
    expect(env.tickCount).toBe(3);
  });

  it('records history for each tick', async () => {
    const env = new TestEnvironment();
    const llm = new MockLLMAdapter();
    const engine = new SimulationEngine(makeConfig(), makeIdentities(), env, llm, {
      tickDelay: 0,
    });

    await engine.start();

    const history = engine.getHistory();
    expect(history).toHaveLength(3);
    expect(history[0]?.tick).toBe(1);
    expect(history[2]?.tick).toBe(3);
  });

  it('can be stopped mid-simulation', async () => {
    const config = { ...makeConfig(), maxTicks: 100 };
    const env = new TestEnvironment();
    const llm = new MockLLMAdapter();
    let tickCount = 0;

    const engine = new SimulationEngine(config, makeIdentities(), env, llm, {
      tickDelay: 10,
      onTick: () => {
        tickCount++;
        if (tickCount >= 2) engine.stop();
      },
    });

    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(tickCount).toBeGreaterThanOrEqual(2);
    expect(tickCount).toBeLessThan(100);
  });

  it('getState returns full simulation state', async () => {
    const env = new TestEnvironment();
    const llm = new MockLLMAdapter();
    const engine = new SimulationEngine(makeConfig(), makeIdentities(), env, llm, {
      tickDelay: 0,
    });

    await engine.start();
    const state = engine.getState();

    expect(state.status).toBe('ended');
    expect(state.agents).toHaveLength(2);
    expect(state.config.type).toBe('prisoners-dilemma');
  });
});
