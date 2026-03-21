import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';
import { createATConfig } from '../../src/scenarios/axelrod-tournament/config';
import { AxelrodTournamentEnvironment } from '../../src/scenarios/axelrod-tournament/environment';
import { createMGConfig } from '../../src/scenarios/minority-game/config';
import { MinorityGameEnvironment } from '../../src/scenarios/minority-game/environment';
import { createTCConfig } from '../../src/scenarios/tragedy-of-commons/config';
import { TragedyOfCommonsEnvironment } from '../../src/scenarios/tragedy-of-commons/environment';
import { createTGConfig } from '../../src/scenarios/trust-game/config';
import { TrustGameEnvironment } from '../../src/scenarios/trust-game/environment';

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

describe('Trust Game', () => {
  it('creates valid config', () => {
    expect(createTGConfig().type).toBe('trust-game');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const config = createTGConfig({ maxTicks: 2, agentCount: 4 });
    const env = new TrustGameEnvironment({ endowment: 100, multiplier: 3 }, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.trustIndex).toBeDefined();
  });
});

describe('Minority Game', () => {
  it('creates valid config', () => {
    expect(createMGConfig().type).toBe('minority-game');
  });

  it('runs simulation with odd agents', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createMGConfig({ maxTicks: 3, agentCount: 7 });
    const env = new MinorityGameEnvironment(10, llm);
    const engine = new SimulationEngine(config, makeAgents(7), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()).toHaveLength(3);
  });
});

describe('Tragedy of the Commons', () => {
  it('creates valid config', () => {
    expect(createTCConfig().type).toBe('tragedy-of-commons');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-defect' });
    const config = createTCConfig({ maxTicks: 3, agentCount: 4 });
    const env = new TragedyOfCommonsEnvironment(
      { pool: 1000, regenRate: 0.1, maxExtraction: 50 },
      llm,
    );
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.resourcePool).toBeDefined();
  });
});

describe('Axelrod Tournament', () => {
  it('creates valid config', () => {
    expect(createATConfig().type).toBe('axelrod-tournament');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'tit-for-tat' });
    const config = createATConfig({ maxTicks: 3, agentCount: 4 });
    const env = new AxelrodTournamentEnvironment({ roundsPerMatch: 10 }, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.tournamentScores).toBeDefined();
  });
});
