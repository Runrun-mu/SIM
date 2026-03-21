import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class TrustGameEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private endowment: number;
  private multiplier: number;

  constructor(params: { endowment: number; multiplier: number }, llm: LLMAdapter) {
    this.llm = llm;
    this.endowment = params.endowment;
    this.multiplier = params.multiplier;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [investor, trustee] of pairs) {
      investor.perceive(`Round ${tick}: You are INVESTOR with ${trustee.identity.name}.`, tick);
      trustee.perceive(`Round ${tick}: You are TRUSTEE with ${investor.identity.name}.`, tick);

      const investPrompt = `Round ${tick}: Trust Game. You have ${this.endowment}. Send 0-${this.endowment} to the trustee.
Amount sent is MULTIPLIED by ${this.multiplier}. Trustee then decides how much to return.
Respond with JSON: {"amount": <number>, "reasoning": "..."}`;
      const investDecision = await investor.decide(investPrompt, tick);
      const investment = Math.max(0, Math.min(this.parseAmount(investDecision), this.endowment));

      const received = investment * this.multiplier;
      const returnPrompt = `Round ${tick}: Trust Game. Investor sent ${investment}, you received ${received} (x${this.multiplier}).
Return 0-${received} to the investor. Respond with JSON: {"amount": <number>, "reasoning": "..."}`;
      const returnDecision = await trustee.decide(returnPrompt, tick);
      const returned = Math.max(0, Math.min(this.parseAmount(returnDecision), received));

      const investorGain = -investment + returned;
      const trusteeGain = received - returned;
      investor.updateResources({ wealth: investorGain });
      trustee.updateResources({ wealth: trusteeGain });

      interactions.push(
        createInteraction(
          tick,
          [investor.identity.id, trustee.identity.id],
          'trust-game',
          {
            [investor.identity.id]: `invest:${investment}`,
            [trustee.identity.id]: `return:${returned}`,
          },
          { [investor.identity.id]: investorGain, [trustee.identity.id]: trusteeGain },
        ),
      );

      investor.perceive(
        `Invested ${investment}, received back ${returned}. Net: ${investorGain}.`,
        tick,
      );
      trustee.perceive(`Received ${received}, returned ${returned}. Net: ${trusteeGain}.`, tick);
    }
    return interactions;
  }

  computeMetrics(_agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    let totalInvestment = 0;
    let totalReturn = 0;
    let count = 0;
    for (const i of interactions) {
      for (const action of Object.values(i.actions)) {
        const investMatch = action.match(/invest:(\d+)/);
        if (investMatch?.[1]) {
          totalInvestment += Number.parseInt(investMatch[1], 10);
          count++;
        }
        const returnMatch = action.match(/return:(\d+)/);
        if (returnMatch?.[1]) totalReturn += Number.parseInt(returnMatch[1], 10);
      }
    }
    return {
      averageInvestment: count > 0 ? totalInvestment / count : 0,
      averageReturn: count > 0 ? totalReturn / count : 0,
      trustIndex: count > 0 ? totalInvestment / (count * this.endowment) : 0,
    };
  }

  private parseAmount(response: string): number {
    try {
      return Math.max(0, JSON.parse(response).amount ?? 0);
    } catch {
      const m = response.match(/(\d+)/);
      return m?.[1] ? Number.parseInt(m[1], 10) : 0;
    }
  }
}
