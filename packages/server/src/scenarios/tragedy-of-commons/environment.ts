import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class TragedyOfCommonsEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private pool: number;
  private initialPool: number;
  private regenRate: number;
  private maxExtraction: number;

  constructor(params: { pool: number; regenRate: number; maxExtraction: number }, llm: LLMAdapter) {
    this.llm = llm;
    this.pool = params.pool;
    this.initialPool = params.pool;
    this.regenRate = params.regenRate;
    this.maxExtraction = params.maxExtraction;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);
    if (this.pool <= 0) return [];

    const extractions: Map<string, number> = new Map();
    const maxPossible = Math.min(this.maxExtraction, this.pool / alive.length);

    for (const agent of alive) {
      agent.perceive(
        `Round ${tick}: Commons pool has ${Math.round(this.pool)} resources. Max extraction: ${Math.round(maxPossible)}.`,
        tick,
      );
      const prompt = `Round ${tick}: Tragedy of the Commons. Shared pool: ${Math.round(this.pool)}.
You can extract 0 to ${Math.round(maxPossible)}. Pool regenerates ${this.regenRate * 100}% per round.
If everyone takes too much, the pool collapses. ${alive.length} players total.
Respond with JSON: {"extraction": <number>, "reasoning": "..."}`;
      const decision = await agent.decide(prompt, tick);
      extractions.set(
        agent.identity.id,
        Math.max(0, Math.min(this.parseAmount(decision), maxPossible)),
      );
    }

    const totalExtracted = Array.from(extractions.values()).reduce((s, e) => s + e, 0);
    this.pool = Math.max(0, this.pool - totalExtracted);
    this.pool += this.pool * this.regenRate; // regeneration

    const actions: Record<string, string> = {};
    const outcomes: Record<string, number> = {};
    for (const agent of alive) {
      const ext = extractions.get(agent.identity.id) ?? 0;
      agent.updateResources({ wealth: ext });
      actions[agent.identity.id] = `extract:${Math.round(ext)}`;
      outcomes[agent.identity.id] = ext;
      agent.perceive(
        `Extracted ${Math.round(ext)}. Total extracted: ${Math.round(totalExtracted)}. Pool remaining: ${Math.round(this.pool)}.`,
        tick,
      );
    }

    return [
      createInteraction(
        tick,
        alive.map((a) => a.identity.id),
        'tragedy-of-commons',
        actions,
        outcomes,
      ),
    ];
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const extractions: number[] = [];
    for (const i of interactions) {
      for (const action of Object.values(i.actions)) {
        const m = action.match(/extract:(\d+)/);
        if (m?.[1]) extractions.push(Number.parseInt(m[1], 10));
      }
    }
    return {
      resourcePool: Math.round(this.pool),
      averageExtraction:
        extractions.length > 0 ? extractions.reduce((a, b) => a + b, 0) / extractions.length : 0,
      sustainabilityIndex: this.initialPool > 0 ? this.pool / this.initialPool : 0,
      averageScore: agents.reduce((s, a) => s + a.resources.wealth, 0) / Math.max(agents.length, 1),
    };
  }

  private parseAmount(response: string): number {
    try {
      return Math.max(0, JSON.parse(response).extraction ?? 0);
    } catch {
      const m = response.match(/(\d+)/);
      return m?.[1] ? Number.parseInt(m[1], 10) : 0;
    }
  }
}
