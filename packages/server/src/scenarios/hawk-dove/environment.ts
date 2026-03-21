import type { AggregatedMetrics, HDAction, HDPayoffMatrix, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class HawkDoveEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private payoff: HDPayoffMatrix;

  constructor(payoff: HDPayoffMatrix, llm: LLMAdapter) {
    this.llm = llm;
    this.payoff = payoff;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [a, b] of pairs) {
      a.perceive(`Round ${tick}: Hawk-Dove contest with ${b.identity.name}.`, tick);
      b.perceive(`Round ${tick}: Hawk-Dove contest with ${a.identity.name}.`, tick);

      const prompt = `Round ${tick}: Hawk-Dove Game. Choose HAWK (aggressive) or DOVE (peaceful).
Hawk vs Hawk: both get ${this.payoff.hawkHawk} (costly fight)
Hawk vs Dove: hawk gets ${this.payoff.hawkDove}, dove gets ${this.payoff.doveHawk}
Dove vs Dove: both get ${this.payoff.doveDove} (peaceful share)
Respond with JSON: {"action": "hawk" or "dove", "reasoning": "..."}`;

      const [dA, dB] = await Promise.all([a.decide(prompt, tick), b.decide(prompt, tick)]);
      const actA = this.parseAction(dA);
      const actB = this.parseAction(dB);
      const [pA, pB] = this.computePayoff(actA, actB);

      a.updateResources({ wealth: pA });
      b.updateResources({ wealth: pB });

      interactions.push(
        createInteraction(
          tick,
          [a.identity.id, b.identity.id],
          'hawk-dove',
          { [a.identity.id]: actA, [b.identity.id]: actB },
          { [a.identity.id]: pA, [b.identity.id]: pB },
        ),
      );

      a.perceive(`You: ${actA}, Opponent: ${actB}. Gained ${pA}.`, tick);
      b.perceive(`You: ${actB}, Opponent: ${actA}. Gained ${pB}.`, tick);
    }
    return interactions;
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const allActions = interactions.flatMap((i) => Object.values(i.actions));
    const hawks = allActions.filter((a) => a === 'hawk').length;
    const conflicts = interactions.filter((i) => {
      const acts = Object.values(i.actions);
      return acts[0] === 'hawk' && acts[1] === 'hawk';
    }).length;
    const totalGain = interactions
      .flatMap((i) => Object.values(i.outcomes))
      .reduce((s, v) => s + v, 0);
    return {
      hawkRate: allActions.length > 0 ? hawks / allActions.length : 0,
      conflictRate: interactions.length > 0 ? conflicts / interactions.length : 0,
      averageResourceGain: agents.length > 0 ? totalGain / agents.length : 0,
    };
  }

  private parseAction(response: string): HDAction {
    try {
      const parsed = JSON.parse(response);
      if (parsed.action === 'hawk' || parsed.action === 'dove') return parsed.action;
    } catch {
      if (response.toLowerCase().includes('hawk')) return 'hawk';
      if (response.toLowerCase().includes('dove')) return 'dove';
    }
    return 'dove';
  }

  private computePayoff(a: HDAction, b: HDAction): [number, number] {
    if (a === 'hawk' && b === 'hawk') return [this.payoff.hawkHawk, this.payoff.hawkHawk];
    if (a === 'hawk' && b === 'dove') return [this.payoff.hawkDove, this.payoff.doveHawk];
    if (a === 'dove' && b === 'hawk') return [this.payoff.doveHawk, this.payoff.hawkDove];
    return [this.payoff.doveDove, this.payoff.doveDove];
  }
}
