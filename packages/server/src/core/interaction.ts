import type { Interaction } from '@sim/shared';
import type { Agent } from './agent';

/**
 * Randomly pair agents for 1-on-1 interactions.
 * If odd number, one agent sits out.
 */
export function pairAgents(agents: Agent[]): [Agent, Agent][] {
  const shuffled = [...agents].sort(() => Math.random() - 0.5);
  const pairs: [Agent, Agent][] = [];

  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    if (a && b) {
      pairs.push([a, b]);
    }
  }

  return pairs;
}

/**
 * Create an interaction record from the results of an exchange.
 */
export function createInteraction(
  tick: number,
  participants: string[],
  type: string,
  actions: Record<string, string>,
  outcomes: Record<string, number>,
): Interaction {
  return {
    id: `interaction-${tick}-${participants.join('-')}`,
    tick,
    participants,
    type,
    actions,
    outcomes,
  };
}
