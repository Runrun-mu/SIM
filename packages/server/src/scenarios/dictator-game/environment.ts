import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class DictatorGameEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private stakeAmount: number;

  constructor(stakeAmount: number, llm: LLMAdapter) {
    this.llm = llm;
    this.stakeAmount = stakeAmount;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [dictator, receiver] of pairs) {
      dictator.perceive(
        `Round ${tick}: You are the DICTATOR. Split ${this.stakeAmount} with ${receiver.identity.name}.`,
        tick,
      );
      receiver.perceive(
        `Round ${tick}: You are the RECEIVER. ${dictator.identity.name} will decide your share.`,
        tick,
      );

      const prompt = `Round ${tick}: Dictator Game. You have ${this.stakeAmount} to split.
You are the DICTATOR. The receiver MUST accept whatever you decide.
How much do you give to the other player?
Respond with JSON: {"offer": <number 0-${this.stakeAmount}>, "reasoning": "..."}`;
      const decision = await dictator.decide(prompt, tick);
      const offer = this.parseOffer(decision);

      dictator.updateResources({ wealth: this.stakeAmount - offer });
      receiver.updateResources({ wealth: offer });

      interactions.push(
        createInteraction(
          tick,
          [dictator.identity.id, receiver.identity.id],
          'dictator-game',
          { [dictator.identity.id]: `offer:${offer}`, [receiver.identity.id]: `receive:${offer}` },
          { [dictator.identity.id]: this.stakeAmount - offer, [receiver.identity.id]: offer },
        ),
      );

      dictator.perceive(`You gave ${offer}, kept ${this.stakeAmount - offer}.`, tick);
      receiver.perceive(`You received ${offer} out of ${this.stakeAmount}.`, tick);
    }
    return interactions;
  }

  computeMetrics(_agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const offers: number[] = [];
    for (const i of interactions) {
      for (const action of Object.values(i.actions)) {
        const match = action.match(/offer:(\d+)/);
        if (match?.[1]) offers.push(Number.parseInt(match[1], 10));
      }
    }
    const avg = offers.length > 0 ? offers.reduce((a, b) => a + b, 0) / offers.length : 0;
    const generous = offers.filter((o) => o > this.stakeAmount * 0.3).length;
    return {
      averageDictatorOffer: avg,
      generosityRate: offers.length > 0 ? generous / offers.length : 0,
    };
  }

  private parseOffer(response: string): number {
    try {
      const parsed = JSON.parse(response);
      return Math.max(0, Math.min(parsed.offer ?? 0, this.stakeAmount));
    } catch {
      return Math.round(this.stakeAmount * 0.3);
    }
  }
}
