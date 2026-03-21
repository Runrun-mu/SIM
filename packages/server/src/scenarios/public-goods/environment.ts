import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class PublicGoodsEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private multiplier: number;
  private endowment: number;

  constructor(params: { multiplier: number; endowment: number }, llm: LLMAdapter) {
    this.llm = llm;
    this.multiplier = params.multiplier;
    this.endowment = params.endowment;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);
    const contributions: Map<string, number> = new Map();

    // Each agent decides contribution
    for (const agent of alive) {
      agent.perceive(
        `Round ${tick}: Public Goods Game. You receive ${this.endowment} endowment. Decide contribution to pool.`,
        tick,
      );
      const prompt = `Round ${tick}: You have an endowment of ${this.endowment}. You can contribute 0 to ${this.endowment} to the public pool.
The pool will be multiplied by ${this.multiplier} and split equally among all ${alive.length} players.
If everyone contributes fully, everyone profits. Free-riders keep their endowment AND get pool share.

Respond with JSON: {"contribution": <number 0-${this.endowment}>, "reasoning": "your reasoning"}`;
      const decision = await agent.decide(prompt, tick);
      const contribution = this.parseContribution(decision);
      contributions.set(agent.identity.id, contribution);
    }

    // Compute pool
    const totalContributed = Array.from(contributions.values()).reduce((s, c) => s + c, 0);
    const poolAfterMultiplier = totalContributed * this.multiplier;
    const sharePerAgent = poolAfterMultiplier / alive.length;

    // Apply payoffs
    const interactions: Interaction[] = [];
    const actions: Record<string, string> = {};
    const outcomes: Record<string, number> = {};

    for (const agent of alive) {
      const contributed = contributions.get(agent.identity.id) ?? 0;
      const kept = this.endowment - contributed;
      const netGain = kept + sharePerAgent - this.endowment;
      agent.updateResources({ wealth: netGain });
      actions[agent.identity.id] = `contribute:${contributed}`;
      outcomes[agent.identity.id] = netGain;
      agent.perceive(
        `Pool total: ${totalContributed}. Multiplied: ${poolAfterMultiplier.toFixed(1)}. Your share: ${sharePerAgent.toFixed(1)}. Net: ${netGain.toFixed(1)}`,
        tick,
      );
    }

    interactions.push(
      createInteraction(
        tick,
        alive.map((a) => a.identity.id),
        'public-goods',
        actions,
        outcomes,
      ),
    );
    return interactions;
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const contribs: number[] = [];
    let freeRiders = 0;
    for (const interaction of interactions) {
      for (const [_id, action] of Object.entries(interaction.actions)) {
        const match = action.match(/contribute:(\d+(?:\.\d+)?)/);
        if (match?.[1]) {
          const c = Number.parseFloat(match[1]);
          contribs.push(c);
          if (c < this.endowment * 0.2) freeRiders++;
        }
      }
    }
    const avgContrib =
      contribs.length > 0 ? contribs.reduce((a, b) => a + b, 0) / contribs.length : 0;
    return {
      averageContribution: avgContrib,
      freeRiderRatio: contribs.length > 0 ? freeRiders / contribs.length : 0,
      publicPoolTotal: contribs.reduce((a, b) => a + b, 0) * this.multiplier,
      averageScore: agents.reduce((s, a) => s + a.resources.wealth, 0) / Math.max(agents.length, 1),
    };
  }

  private parseContribution(response: string): number {
    try {
      const parsed = JSON.parse(response);
      return Math.max(0, Math.min(parsed.contribution ?? 0, this.endowment));
    } catch {
      const match = response.match(/(\d+)/);
      return match?.[1] ? Math.min(Number.parseInt(match[1], 10), this.endowment) : 0;
    }
  }
}
