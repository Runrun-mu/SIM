import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { SimulationEngine } from '../../src/core/simulation-engine';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';
import { createSSConfig } from '../../src/scenarios/schelling-segregation/config';
import { SchellingSegregationEnvironment } from '../../src/scenarios/schelling-segregation/environment';
import { createSIRConfig } from '../../src/scenarios/sir-epidemic/config';
import { SIREpidemicEnvironment } from '../../src/scenarios/sir-epidemic/environment';
import { createSIConfig } from '../../src/scenarios/social-influence/config';
import { SocialInfluenceEnvironment } from '../../src/scenarios/social-influence/environment';
import { createVMConfig } from '../../src/scenarios/voting-model/config';
import { VotingModelEnvironment } from '../../src/scenarios/voting-model/environment';

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

describe('Schelling Segregation', () => {
  it('creates valid config', () => {
    expect(createSSConfig().type).toBe('schelling-segregation');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createSSConfig({ maxTicks: 2, agentCount: 6 });
    const env = new SchellingSegregationEnvironment({ tolerance: 0.5, numGroups: 2 }, llm);
    const engine = new SimulationEngine(config, makeAgents(6), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.segregationIndex).toBeDefined();
  });
});

describe('Voting Model', () => {
  it('creates valid config', () => {
    expect(createVMConfig().type).toBe('voting-model');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createVMConfig({ maxTicks: 3, agentCount: 5 });
    const env = new VotingModelEnvironment(['Alpha', 'Beta', 'Gamma'], llm);
    const engine = new SimulationEngine(config, makeAgents(5), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.voteDistribution).toBeDefined();
  });
});

describe('SIR Epidemic', () => {
  it('creates valid config', () => {
    expect(createSIRConfig().type).toBe('sir-epidemic');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createSIRConfig({ maxTicks: 3, agentCount: 6 });
    const env = new SIREpidemicEnvironment(
      { infectionProb: 0.3, recoveryProb: 0.1, initialInfected: 1, contactsPerTick: 3 },
      llm,
    );
    const engine = new SimulationEngine(config, makeAgents(6), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.susceptibleCount).toBeDefined();
  });
});

describe('Social Influence', () => {
  it('creates valid config', () => {
    expect(createSIConfig().type).toBe('social-influence');
  });

  it('runs simulation', async () => {
    const llm = new MockLLMAdapter({ strategy: 'random' });
    const config = createSIConfig({ maxTicks: 2, agentCount: 4 });
    const env = new SocialInfluenceEnvironment({ opinionRange: 100, influenceRadius: 20 }, llm);
    const engine = new SimulationEngine(config, makeAgents(4), env, llm, { tickDelay: 0 });
    await engine.start();
    expect(engine.getStatus()).toBe('ended');
    expect(engine.getHistory()[0]?.aggregated.opinionDistribution).toBeDefined();
  });
});
