import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import { Observatory } from '../../core/observatory';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class WealthDistributionEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private tradeRange: number;

  constructor(tradeRange: number, llm: LLMAdapter) {
    this.llm = llm;
    this.tradeRange = tradeRange;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [agentA, agentB] of pairs) {
      // Both agents perceive the matchup
      agentA.perceive(
        `Round ${tick}: You are trading with ${agentB.identity.name}. Your wealth: ${agentA.resources.wealth}.`,
        tick,
      );
      agentB.perceive(
        `Round ${tick}: You are trading with ${agentA.identity.name}. Your wealth: ${agentB.resources.wealth}.`,
        tick,
      );

      // Both agents decide on trade proposals
      const prompt = this.buildTradePrompt(tick);
      const [decisionA, decisionB] = await Promise.all([
        agentA.decide(prompt, tick),
        agentB.decide(prompt, tick),
      ]);

      // Parse trade proposals
      const proposalA = this.parseTradeProposal(decisionA, agentA.resources.wealth);
      const proposalB = this.parseTradeProposal(decisionB, agentB.resources.wealth);

      // Resolve trade: if both offers meet or exceed demands, trade happens
      let transferAtoB = 0;
      let transferBtoA = 0;
      let tradeSucceeded = false;

      if (proposalA.offer >= proposalB.demand && proposalB.offer >= proposalA.demand) {
        // Both sides agree — use the minimum of offer and demand
        transferAtoB = Math.min(proposalA.offer, proposalB.demand);
        transferBtoA = Math.min(proposalB.offer, proposalA.demand);
        tradeSucceeded = true;
      }

      if (tradeSucceeded) {
        agentA.updateResources({ wealth: transferBtoA - transferAtoB });
        agentB.updateResources({ wealth: transferAtoB - transferBtoA });
      }

      const actions = {
        [agentA.identity.id]: `offer:${proposalA.offer},demand:${proposalA.demand}`,
        [agentB.identity.id]: `offer:${proposalB.offer},demand:${proposalB.demand}`,
      };

      const outcomes = {
        [agentA.identity.id]: transferBtoA - transferAtoB,
        [agentB.identity.id]: transferAtoB - transferBtoA,
      };

      interactions.push(
        createInteraction(
          tick,
          [agentA.identity.id, agentB.identity.id],
          'wealth-distribution',
          actions,
          outcomes,
        ),
      );

      // Both agents observe the outcome
      const resultMsg = tradeSucceeded
        ? `Trade succeeded! Net change: ${transferBtoA - transferAtoB}`
        : 'Trade failed — proposals incompatible.';
      agentA.perceive(`Outcome: ${resultMsg}. Your wealth: ${agentA.resources.wealth}.`, tick);
      agentB.perceive(
        `Outcome: ${tradeSucceeded ? 'Trade succeeded' : 'Trade failed'}. Your wealth: ${agentB.resources.wealth}.`,
        tick,
      );
    }

    return interactions;
  }

  computeMetrics(agents: Agent[], _interactions: Interaction[], _tick: number): AggregatedMetrics {
    const wealths = agents.map((a) => a.resources.wealth);
    const sorted = [...wealths].sort((a, b) => b - a);
    const totalWealth = sorted.reduce((a, b) => a + b, 0);

    // Top 10%
    const top10Count = Math.max(1, Math.ceil(agents.length * 0.1));
    const top10Wealth = sorted.slice(0, top10Count).reduce((a, b) => a + b, 0);
    const top10Pct = totalWealth > 0 ? top10Wealth / totalWealth : 0;

    return {
      giniCoefficient: Observatory.giniCoefficient(wealths),
      wealthDistribution: sorted,
      top10Percent: top10Pct,
    };
  }

  private buildTradePrompt(tick: number): string {
    return `Round ${tick}: You are in a wealth trading game.

You must propose a trade with your partner. Decide:
1. How much you OFFER to give (0 to ${Math.round(this.tradeRange * 100)}% of your wealth)
2. How much you DEMAND in return

If both parties' offers meet the other's demands, the trade succeeds.
If not, no trade occurs this round.

Respond with a JSON object: {"offer": <number>, "demand": <number>, "reasoning": "your reasoning"}`;
  }

  private parseTradeProposal(response: string, wealth: number): { offer: number; demand: number } {
    try {
      const parsed = JSON.parse(response);
      const maxOffer = wealth * this.tradeRange;
      return {
        offer: Math.max(0, Math.min(parsed.offer ?? 0, maxOffer)),
        demand: Math.max(0, parsed.demand ?? 0),
      };
    } catch {
      return { offer: 0, demand: 0 };
    }
  }
}
