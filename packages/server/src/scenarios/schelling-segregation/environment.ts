import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class SchellingSegregationEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private tolerance: number;
  private positions: Map<string, number> = new Map();
  private groups: Map<string, number> = new Map();
  private initialized = false;

  constructor(params: { tolerance: number; numGroups: number }, llm: LLMAdapter) {
    this.llm = llm;
    this.tolerance = params.tolerance;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);
    if (!this.initialized) {
      alive.forEach((a, i) => {
        this.positions.set(a.identity.id, i);
        this.groups.set(a.identity.id, i % 2); // alternate groups
      });
      this.initialized = true;
    }

    const n = alive.length;
    const actions: Record<string, string> = {};
    const outcomes: Record<string, number> = {};
    let moves = 0;

    for (const agent of alive) {
      const pos = this.positions.get(agent.identity.id) ?? 0;
      const myGroup = this.groups.get(agent.identity.id) ?? 0;
      const neighbors = this.getNeighborGroups(agent.identity.id, alive);
      const sameCount = neighbors.filter((g) => g === myGroup).length;
      const satisfaction = neighbors.length > 0 ? sameCount / neighbors.length : 1;

      agent.perceive(
        `Round ${tick}: Position ${pos}. Group ${myGroup}. Satisfaction: ${(satisfaction * 100).toFixed(0)}%. Neighbors: ${neighbors.length}.`,
        tick,
      );

      const prompt = `Round ${tick}: Schelling Segregation. You are Group ${myGroup} at position ${pos}.
${(satisfaction * 100).toFixed(0)}% of your neighbors are same group (tolerance: ${this.tolerance * 100}%).
Choose: STAY or MOVE to a random position. Respond with JSON: {"action": "stay" or "move", "reasoning": "..."}`;
      const decision = await agent.decide(prompt, tick);
      const action = this.parseAction(decision);

      if (action === 'move') {
        const newPos = Math.floor(Math.random() * n);
        this.positions.set(agent.identity.id, newPos);
        moves++;
      }

      actions[agent.identity.id] = action;
      outcomes[agent.identity.id] = satisfaction;
    }

    return [
      createInteraction(
        tick,
        alive.map((a) => a.identity.id),
        'schelling-segregation',
        actions,
        outcomes,
      ),
    ];
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const alive = agents.filter((a) => a.alive);
    let totalSatisfaction = 0;
    let moveCount = 0;

    for (const agent of alive) {
      const myGroup = this.groups.get(agent.identity.id) ?? 0;
      const neighbors = this.getNeighborGroups(agent.identity.id, alive);
      const same = neighbors.filter((g) => g === myGroup).length;
      totalSatisfaction += neighbors.length > 0 ? same / neighbors.length : 1;
    }

    for (const i of interactions) {
      moveCount += Object.values(i.actions).filter((a) => a === 'move').length;
    }

    return {
      segregationIndex: alive.length > 0 ? totalSatisfaction / alive.length : 0,
      satisfactionRate: alive.length > 0 ? totalSatisfaction / alive.length : 0,
      moveRate: alive.length > 0 ? moveCount / alive.length : 0,
    };
  }

  private getNeighborGroups(agentId: string, agents: Agent[]): number[] {
    const pos = this.positions.get(agentId) ?? 0;
    const n = agents.length;
    const neighborGroups: number[] = [];
    for (const other of agents) {
      if (other.identity.id === agentId) continue;
      const otherPos = this.positions.get(other.identity.id) ?? 0;
      const dist = Math.min(Math.abs(pos - otherPos), n - Math.abs(pos - otherPos));
      if (dist <= 2) neighborGroups.push(this.groups.get(other.identity.id) ?? 0);
    }
    return neighborGroups;
  }

  private parseAction(response: string): string {
    try {
      const parsed = JSON.parse(response);
      return parsed.action === 'move' ? 'move' : 'stay';
    } catch {
      return response.toLowerCase().includes('move') ? 'move' : 'stay';
    }
  }
}
