import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class SocialInfluenceEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private opinionRange: number;
  private initialized = false;

  constructor(params: { opinionRange: number; influenceRadius: number }, llm: LLMAdapter) {
    this.llm = llm;
    this.opinionRange = params.opinionRange;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);

    if (!this.initialized) {
      for (const agent of alive) {
        agent.resources.reputation = Math.floor(Math.random() * this.opinionRange);
      }
      this.initialized = true;
    }

    const pairs = pairAgents(alive);
    const interactions: Interaction[] = [];
    let totalShift = 0;

    for (const [a, b] of pairs) {
      const opA = a.resources.reputation;
      const opB = b.resources.reputation;

      a.perceive(
        `Round ${tick}: Social discussion. Your opinion: ${opA}. Partner opinion: ${opB}.`,
        tick,
      );
      b.perceive(
        `Round ${tick}: Social discussion. Your opinion: ${opB}. Partner opinion: ${opA}.`,
        tick,
      );

      const prompt = `Round ${tick}: Social Influence. Your opinion is ${opA} (0-${this.opinionRange}).
Your discussion partner's opinion is ${opB}. After discussion, what is your new opinion?
Respond with JSON: {"newOpinion": <number 0-${this.opinionRange}>, "reasoning": "..."}`;

      const [dA, dB] = await Promise.all([
        a.decide(prompt, tick),
        b.decide(prompt.replace(`${opA}`, `${opB}`).replace(`${opB}`, `${opA}`), tick),
      ]);
      const newA = this.parseOpinion(dA);
      const newB = this.parseOpinion(dB);

      totalShift += Math.abs(newA - opA) + Math.abs(newB - opB);
      a.resources.reputation = newA;
      b.resources.reputation = newB;

      interactions.push(
        createInteraction(
          tick,
          [a.identity.id, b.identity.id],
          'social-influence',
          { [a.identity.id]: `opinion:${newA}`, [b.identity.id]: `opinion:${newB}` },
          { [a.identity.id]: newA - opA, [b.identity.id]: newB - opB },
        ),
      );
    }

    return interactions;
  }

  computeMetrics(agents: Agent[], _interactions: Interaction[], _tick: number): AggregatedMetrics {
    const alive = agents.filter((a) => a.alive);
    const opinions = alive.map((a) => a.resources.reputation);
    const dist: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };
    for (const o of opinions) {
      if (o <= 20) dist['0-20'] = (dist['0-20'] ?? 0) + 1;
      else if (o <= 40) dist['21-40'] = (dist['21-40'] ?? 0) + 1;
      else if (o <= 60) dist['41-60'] = (dist['41-60'] ?? 0) + 1;
      else if (o <= 80) dist['61-80'] = (dist['61-80'] ?? 0) + 1;
      else dist['81-100'] = (dist['81-100'] ?? 0) + 1;
    }
    const mean = opinions.length > 0 ? opinions.reduce((a, b) => a + b, 0) / opinions.length : 50;
    const variance =
      opinions.length > 0 ? opinions.reduce((s, o) => s + (o - mean) ** 2, 0) / opinions.length : 0;
    const maxVariance = (this.opinionRange / 2) ** 2;
    return {
      opinionDistribution: dist,
      consensusLevel: maxVariance > 0 ? 1 - Math.sqrt(variance) / (this.opinionRange / 2) : 1,
      averageOpinionShift: 0,
    };
  }

  private parseOpinion(response: string): number {
    try {
      const parsed = JSON.parse(response);
      return Math.max(0, Math.min(parsed.newOpinion ?? 50, this.opinionRange));
    } catch {
      const m = response.match(/(\d+)/);
      return m?.[1] ? Math.max(0, Math.min(Number.parseInt(m[1], 10), this.opinionRange)) : 50;
    }
  }
}
