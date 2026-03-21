import { describe, expect, it } from 'bun:test';
import type { AgentIdentity } from '@sim/shared';
import { Agent } from '../../src/core/agent';
import { createInteraction, pairAgents } from '../../src/core/interaction';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';

const makeAgent = (id: string): Agent => {
  const identity: AgentIdentity = {
    id,
    name: `Agent ${id}`,
    age: 25,
    occupation: 'Trader',
    personality: 'Bold',
    wealth: 100,
    soul: `You are Agent ${id}.`,
  };
  return new Agent(identity, new MockLLMAdapter());
};

describe('Interaction', () => {
  describe('pairAgents', () => {
    it('pairs even number of agents', () => {
      const agents = [makeAgent('1'), makeAgent('2'), makeAgent('3'), makeAgent('4')];
      const pairs = pairAgents(agents);
      expect(pairs).toHaveLength(2);

      // Each agent should appear exactly once
      const ids = pairs.flat().map((a) => a.identity.id);
      expect(new Set(ids).size).toBe(4);
    });

    it('handles odd number (one sits out)', () => {
      const agents = [makeAgent('1'), makeAgent('2'), makeAgent('3')];
      const pairs = pairAgents(agents);
      expect(pairs).toHaveLength(1);
    });

    it('handles empty array', () => {
      const pairs = pairAgents([]);
      expect(pairs).toHaveLength(0);
    });

    it('handles single agent', () => {
      const pairs = pairAgents([makeAgent('1')]);
      expect(pairs).toHaveLength(0);
    });
  });

  describe('createInteraction', () => {
    it('creates a valid interaction record', () => {
      const interaction = createInteraction(
        1,
        ['agent-1', 'agent-2'],
        'prisoners-dilemma',
        { 'agent-1': 'cooperate', 'agent-2': 'defect' },
        { 'agent-1': 0, 'agent-2': 5 },
      );

      expect(interaction.id).toContain('interaction-1');
      expect(interaction.tick).toBe(1);
      expect(interaction.participants).toHaveLength(2);
      expect(interaction.actions['agent-1']).toBe('cooperate');
      expect(interaction.outcomes['agent-2']).toBe(5);
    });
  });
});
