import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

// health resource: 0=susceptible, 1=infected, 2=recovered
const S = 0;
const I = 1;
const R = 2;

export class SIREpidemicEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private infectionProb: number;
  private recoveryProb: number;
  private contactsPerTick: number;
  private initialized = false;

  constructor(
    params: {
      infectionProb: number;
      recoveryProb: number;
      initialInfected: number;
      contactsPerTick: number;
    },
    llm: LLMAdapter,
  ) {
    this.llm = llm;
    this.infectionProb = params.infectionProb;
    this.recoveryProb = params.recoveryProb;
    this.contactsPerTick = params.contactsPerTick;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);

    if (!this.initialized) {
      // Patient zero
      if (alive[0]) alive[0].resources.health = I;
      this.initialized = true;
    }

    const actions: Record<string, string> = {};
    const outcomes: Record<string, number> = {};

    // Each agent decides behavior
    for (const agent of alive) {
      const state =
        agent.resources.health === I
          ? 'infected'
          : agent.resources.health === R
            ? 'recovered'
            : 'susceptible';
      agent.perceive(`Round ${tick}: Epidemic. You are ${state}.`, tick);

      const prompt = `Round ${tick}: Epidemic simulation. You are ${state}.
Choose behavior: "socialize" (normal contacts), "isolate" (fewer contacts), or "mask" (reduced infection risk).
Respond with JSON: {"action": "socialize" or "isolate" or "mask", "reasoning": "..."}`;
      const decision = await agent.decide(prompt, tick);
      const action = this.parseBehavior(decision);
      actions[agent.identity.id] = action;
    }

    // Transmission
    const newInfections: string[] = [];
    const newRecoveries: string[] = [];

    for (const agent of alive) {
      if (agent.resources.health === I) {
        // Try to recover
        if (Math.random() < this.recoveryProb) {
          agent.resources.health = R;
          newRecoveries.push(agent.identity.id);
          continue;
        }
        // Contact others
        const behavior = actions[agent.identity.id] ?? 'socialize';
        const contacts = behavior === 'isolate' ? 1 : this.contactsPerTick;
        for (let c = 0; c < contacts; c++) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          if (target && target.resources.health === S) {
            const targetBehavior = actions[target.identity.id] ?? 'socialize';
            const probMod = targetBehavior === 'mask' ? 0.5 : 1;
            if (Math.random() < this.infectionProb * probMod) {
              target.resources.health = I;
              newInfections.push(target.identity.id);
            }
          }
        }
      }
    }

    for (const agent of alive) {
      const state =
        agent.resources.health === I
          ? 'infected'
          : agent.resources.health === R
            ? 'recovered'
            : 'susceptible';
      outcomes[agent.identity.id] = agent.resources.health;
      agent.perceive(
        `Status: ${state}. New infections: ${newInfections.length}. Recoveries: ${newRecoveries.length}.`,
        tick,
      );
    }

    return [
      createInteraction(
        tick,
        alive.map((a) => a.identity.id),
        'sir-epidemic',
        actions,
        outcomes,
      ),
    ];
  }

  computeMetrics(agents: Agent[], _interactions: Interaction[], _tick: number): AggregatedMetrics {
    const alive = agents.filter((a) => a.alive);
    const sus = alive.filter((a) => a.resources.health === S).length;
    const inf = alive.filter((a) => a.resources.health === I).length;
    const rec = alive.filter((a) => a.resources.health === R).length;
    return {
      susceptibleCount: sus,
      infectedCount: inf,
      recoveredCount: rec,
      infectionRate: alive.length > 0 ? inf / alive.length : 0,
    };
  }

  private parseBehavior(response: string): string {
    try {
      const parsed = JSON.parse(response);
      if (['socialize', 'isolate', 'mask'].includes(parsed.action)) return parsed.action;
    } catch {
      /* fallback */
    }
    const lower = response.toLowerCase();
    if (lower.includes('isolate')) return 'isolate';
    if (lower.includes('mask')) return 'mask';
    return 'socialize';
  }
}
