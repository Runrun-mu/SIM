import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class UltimatumGameEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private stakeAmount: number;

  constructor(stakeAmount: number, llm: LLMAdapter) {
    this.llm = llm;
    this.stakeAmount = stakeAmount;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [proposer, responder] of pairs) {
      proposer.perceive(
        `Round ${tick}: You are the PROPOSER with ${responder.identity.name}.`,
        tick,
      );
      responder.perceive(
        `Round ${tick}: You are the RESPONDER with ${proposer.identity.name}.`,
        tick,
      );

      const offerPrompt = `Round ${tick}: Ultimatum Game. You have ${this.stakeAmount} to split with another player.
You are the PROPOSER. Choose how much to offer (0 to ${this.stakeAmount}).
If the responder accepts, both keep the split. If rejected, BOTH get nothing.
Respond with JSON: {"offer": <number>, "reasoning": "..."}`;
      const offerDecision = await proposer.decide(offerPrompt, tick);
      const offer = this.parseOffer(offerDecision);

      const respondPrompt = `Round ${tick}: Ultimatum Game. The proposer offers you ${offer} out of ${this.stakeAmount}.
If you accept, you get ${offer} and they keep ${this.stakeAmount - offer}. If you reject, BOTH get nothing.
Respond with JSON: {"accept": true/false, "reasoning": "..."}`;
      const respondDecision = await responder.decide(respondPrompt, tick);
      const accepted = this.parseAccept(respondDecision);

      const proposerGain = accepted ? this.stakeAmount - offer : 0;
      const responderGain = accepted ? offer : 0;
      proposer.updateResources({ wealth: proposerGain });
      responder.updateResources({ wealth: responderGain });

      const actions = {
        [proposer.identity.id]: `offer:${offer}`,
        [responder.identity.id]: accepted ? 'accept' : 'reject',
      };
      interactions.push(
        createInteraction(
          tick,
          [proposer.identity.id, responder.identity.id],
          'ultimatum-game',
          actions,
          { [proposer.identity.id]: proposerGain, [responder.identity.id]: responderGain },
        ),
      );

      proposer.perceive(
        `Outcome: Offered ${offer}. ${accepted ? 'Accepted' : 'Rejected'}. Gained ${proposerGain}.`,
        tick,
      );
      responder.perceive(
        `Outcome: Offered ${offer}. ${accepted ? 'Accepted' : 'Rejected'}. Gained ${responderGain}.`,
        tick,
      );
    }
    return interactions;
  }

  computeMetrics(_agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    let totalOffers = 0;
    let rejections = 0;
    let acceptedOfferSum = 0;
    let acceptedCount = 0;
    let count = 0;

    for (const i of interactions) {
      const vals = Object.values(i.actions);
      for (const v of vals) {
        const offerMatch = v.match(/offer:(\d+)/);
        if (offerMatch?.[1]) {
          totalOffers += Number.parseInt(offerMatch[1], 10);
          count++;
        }
        if (v === 'reject') rejections++;
        if (v === 'accept') {
          const oMatch = Object.values(i.actions).find((a) => a.startsWith('offer:'));
          if (oMatch) {
            acceptedOfferSum += Number.parseInt(oMatch.split(':')[1] ?? '0', 10);
            acceptedCount++;
          }
        }
      }
    }
    return {
      averageOffer: count > 0 ? totalOffers / count : 0,
      rejectionRate: interactions.length > 0 ? rejections / interactions.length : 0,
      averageAcceptedOffer: acceptedCount > 0 ? acceptedOfferSum / acceptedCount : 0,
    };
  }

  private parseOffer(response: string): number {
    try {
      const parsed = JSON.parse(response);
      return Math.max(0, Math.min(parsed.offer ?? 0, this.stakeAmount));
    } catch {
      return Math.round(this.stakeAmount * 0.4);
    }
  }

  private parseAccept(response: string): boolean {
    try {
      const parsed = JSON.parse(response);
      return parsed.accept === true;
    } catch {
      return response.toLowerCase().includes('accept');
    }
  }
}
