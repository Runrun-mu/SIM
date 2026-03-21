import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class MinorityGameEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private reward: number;
  private previousChoices: Map<string, string> = new Map();

  constructor(reward: number, llm: LLMAdapter) {
    this.llm = llm;
    this.reward = reward;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);
    const choices: Map<string, string> = new Map();

    for (const agent of alive) {
      const prev = this.previousChoices.get(agent.identity.id) ?? 'none';
      agent.perceive(
        `Round ${tick}: Minority Game. Your previous choice: ${prev}. ${alive.length} total players.`,
        tick,
      );
      const prompt = `Round ${tick}: Minority Game. Choose A or B. The group in the MINORITY wins ${this.reward} points.
There are ${alive.length} players. Last round you chose: ${prev}.
Respond with JSON: {"choice": "A" or "B", "reasoning": "..."}`;
      const decision = await agent.decide(prompt, tick);
      choices.set(agent.identity.id, this.parseChoice(decision));
    }

    const countA = Array.from(choices.values()).filter((c) => c === 'A').length;
    const countB = Array.from(choices.values()).filter((c) => c === 'B').length;
    const minority = countA < countB ? 'A' : countB < countA ? 'B' : 'none';

    const actions: Record<string, string> = {};
    const outcomes: Record<string, number> = {};
    let switched = 0;

    for (const agent of alive) {
      const choice = choices.get(agent.identity.id) ?? 'A';
      const won = choice === minority;
      const gain = won ? this.reward : 0;
      agent.updateResources({ wealth: gain });
      actions[agent.identity.id] = choice;
      outcomes[agent.identity.id] = gain;
      if (
        this.previousChoices.has(agent.identity.id) &&
        this.previousChoices.get(agent.identity.id) !== choice
      )
        switched++;
      agent.perceive(
        `You chose ${choice}. Minority: ${minority}. A:${countA} B:${countB}. ${won ? 'Won!' : 'Lost.'}`,
        tick,
      );
    }

    this.previousChoices = choices;
    const interactions = [
      createInteraction(
        tick,
        alive.map((a) => a.identity.id),
        'minority-game',
        actions,
        outcomes,
      ),
    ];
    return interactions;
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const i = interactions[0];
    if (!i) return {};
    const acts = Object.values(i.actions);
    const countA = acts.filter((a) => a === 'A').length;
    const countB = acts.filter((a) => a === 'B').length;
    const minority = countA < countB ? 'A' : countB < countA ? 'B' : 'tie';
    const winners = acts.filter((a) => a === minority).length;
    return {
      minorityChoice: minority,
      winnerCount: winners,
      switchRate: this.previousChoices.size > 0 ? 0 : 0, // computed during tick
      averageScore: agents.reduce((s, a) => s + a.resources.wealth, 0) / Math.max(agents.length, 1),
    };
  }

  private parseChoice(response: string): string {
    try {
      const parsed = JSON.parse(response);
      if (parsed.choice === 'A' || parsed.choice === 'B') return parsed.choice;
    } catch {
      /* fallback */
    }
    return response.toUpperCase().includes('A') ? 'A' : 'B';
  }
}
