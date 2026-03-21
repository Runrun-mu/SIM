import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { Agent } from '../../src/core/agent';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';

const makeIdentity = (id = 'agent-1'): AgentIdentity => ({
  id,
  name: 'Alice',
  age: 30,
  occupation: 'Engineer',
  personality: 'Analytical and cautious',
  wealth: 100,
  soul: 'You are Alice, a rational engineer who carefully weighs risks and rewards.',
});

describe('Agent', () => {
  it('initializes with identity and default resources', () => {
    const llm = new MockLLMAdapter();
    const agent = new Agent(makeIdentity(), llm);

    expect(agent.identity.name).toBe('Alice');
    expect(agent.resources.wealth).toBe(100);
    expect(agent.resources.health).toBe(100);
    expect(agent.alive).toBe(true);
  });

  it('perceive adds observation to memory', () => {
    const llm = new MockLLMAdapter();
    const agent = new Agent(makeIdentity(), llm);

    agent.perceive('I see another agent approaching.', 1);
    expect(agent.memory.shortTerm).toHaveLength(1);
    expect(agent.memory.shortTerm[0]?.type).toBe('observation');
  });

  it('decide calls LLM and records action in memory', async () => {
    const llm = new MockLLMAdapter({ strategy: 'always-cooperate' });
    const agent = new Agent(makeIdentity(), llm);

    const decision = await agent.decide(
      "You're playing a prisoner's dilemma. Do you cooperate or defect?",
      1,
    );

    expect(decision).toBeTruthy();
    // Decision should be recorded in memory
    const actionMemories = agent.memory.shortTerm.filter((m) => m.type === 'action');
    expect(actionMemories).toHaveLength(1);
  });

  it('updateResources modifies resource values', () => {
    const llm = new MockLLMAdapter();
    const agent = new Agent(makeIdentity(), llm);

    agent.updateResources({ wealth: 50, reputation: -10 });
    expect(agent.resources.wealth).toBe(150);
    expect(agent.resources.reputation).toBe(40);
  });

  it('snapshot returns serializable state', () => {
    const llm = new MockLLMAdapter();
    const agent = new Agent(makeIdentity(), llm);

    agent.perceive('Hello world', 1);
    const snap = agent.snapshot();

    expect(snap.identity.name).toBe('Alice');
    expect(snap.memory.shortTerm).toHaveLength(1);
    expect(snap.resources.wealth).toBe(100);
    expect(snap.alive).toBe(true);
  });
});
