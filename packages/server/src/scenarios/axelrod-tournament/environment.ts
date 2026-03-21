import type { AggregatedMetrics, Interaction, PDAction } from '@sim/shared';
import { PD_DEFAULT_PAYOFF } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class AxelrodTournamentEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private scores: Map<string, number> = new Map();
  private matchHistories: Map<string, PDAction[]> = new Map();

  constructor(_params: { roundsPerMatch: number }, llm: LLMAdapter) {
    this.llm = llm;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [a, b] of pairs) {
      const histKey = [a.identity.id, b.identity.id].sort().join('-');
      const history = this.matchHistories.get(histKey) ?? [];

      a.perceive(
        `Round ${tick}: Axelrod Tournament vs ${b.identity.name}. History: ${history.length} rounds.`,
        tick,
      );
      b.perceive(
        `Round ${tick}: Axelrod Tournament vs ${a.identity.name}. History: ${history.length} rounds.`,
        tick,
      );

      const prompt = `Round ${tick}: Iterated Prisoner's Dilemma Tournament. Choose COOPERATE or DEFECT.
Payoffs: CC=${PD_DEFAULT_PAYOFF.bothCooperate}, DD=${PD_DEFAULT_PAYOFF.bothDefect}, CD=${PD_DEFAULT_PAYOFF.cooperateDefect}(you), DC=${PD_DEFAULT_PAYOFF.defectCooperate}(you)
Previous rounds in this matchup: ${history.length > 0 ? history.join(', ') : 'none'}
Respond with JSON: {"action": "cooperate" or "defect", "reasoning": "..."}`;

      const [dA, dB] = await Promise.all([a.decide(prompt, tick), b.decide(prompt, tick)]);
      const actA = this.parseAction(dA);
      const actB = this.parseAction(dB);
      const [pA, pB] = this.computePayoff(actA, actB);

      a.updateResources({ wealth: pA });
      b.updateResources({ wealth: pB });
      this.scores.set(a.identity.id, (this.scores.get(a.identity.id) ?? 0) + pA);
      this.scores.set(b.identity.id, (this.scores.get(b.identity.id) ?? 0) + pB);
      this.matchHistories.set(histKey, [...history, actA, actB]);

      interactions.push(
        createInteraction(
          tick,
          [a.identity.id, b.identity.id],
          'axelrod-tournament',
          { [a.identity.id]: actA, [b.identity.id]: actB },
          { [a.identity.id]: pA, [b.identity.id]: pB },
        ),
      );
    }
    return interactions;
  }

  computeMetrics(agents: Agent[], _interactions: Interaction[], _tick: number): AggregatedMetrics {
    const scores: Record<string, number> = {};
    let maxScore = Number.NEGATIVE_INFINITY;
    let dominant = '';
    for (const a of agents) {
      const s = this.scores.get(a.identity.id) ?? 0;
      scores[a.identity.name] = s;
      if (s > maxScore) {
        maxScore = s;
        dominant = a.identity.name;
      }
    }
    return { tournamentScores: scores, dominantStrategy: dominant, cooperationRate: 0 };
  }

  private parseAction(response: string): PDAction {
    try {
      const parsed = JSON.parse(response);
      if (parsed.action === 'cooperate' || parsed.action === 'defect') return parsed.action;
    } catch {
      if (response.toLowerCase().includes('defect')) return 'defect';
    }
    return 'cooperate';
  }

  private computePayoff(a: PDAction, b: PDAction): [number, number] {
    const m = PD_DEFAULT_PAYOFF;
    if (a === 'cooperate' && b === 'cooperate') return [m.bothCooperate, m.bothCooperate];
    if (a === 'defect' && b === 'defect') return [m.bothDefect, m.bothDefect];
    if (a === 'cooperate') return [m.cooperateDefect, m.defectCooperate];
    return [m.defectCooperate, m.cooperateDefect];
  }
}
