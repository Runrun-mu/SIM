import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { HD_DEFAULT_PAYOFF } from '@sim/shared';
import { SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';
import { createDGConfig } from '../../src/scenarios/dictator-game/config';
import { DictatorGameEnvironment } from '../../src/scenarios/dictator-game/environment';
import { createHDConfig } from '../../src/scenarios/hawk-dove/config';
import { HawkDoveEnvironment } from '../../src/scenarios/hawk-dove/environment';
import { createUGConfig } from '../../src/scenarios/ultimatum-game/config';
import { UltimatumGameEnvironment } from '../../src/scenarios/ultimatum-game/environment';

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

describe('Ultimatum Game', () => {
  it('creates valid config', () => {
    const config = createUGConfig();
    expect(config.type).toBe('ultimatum-game');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const config = createUGConfig({ maxTicks: 2, agentCount: 4 });
    const env = new UltimatumGameEnvironment(100, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()).toHaveLength(2);
  });
});

describe('Dictator Game', () => {
  it('creates valid config', () => {
    const config = createDGConfig();
    expect(config.type).toBe('dictator-game');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createDGConfig({ maxTicks: 2, agentCount: 4 });
    const env = new DictatorGameEnvironment(100, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    const h = engine.getHistory();
    expect(h[0]?.aggregated.averageDictatorOffer).toBeDefined();
  });
});

describe('Hawk-Dove Game', () => {
  it('creates valid config', () => {
    const config = createHDConfig();
    expect(config.type).toBe('hawk-dove');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createHDConfig({ maxTicks: 3, agentCount: 4 });
    const env = new HawkDoveEnvironment(HD_DEFAULT_PAYOFF, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    const h = engine.getHistory();
    expect(h[0]?.aggregated.hawkRate).toBeDefined();
  });
});
