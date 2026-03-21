import type { AggregatedMetrics, Interaction, PDAction, PDPayoffMatrix } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction, pairAgents } from '../../core/interaction';
import { Observatory } from '../../core/observatory';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class PrisonersDilemmaEnvironment implements ScenarioEnvironment {
  private payoffMatrix: PDPayoffMatrix;
  private llm: LLMAdapter;
  private allActions: Record<string, string>[] = [];

  constructor(payoffMatrix: PDPayoffMatrix, llm: LLMAdapter) {
    this.payoffMatrix = payoffMatrix;
    this.llm = llm;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const pairs = pairAgents(agents.filter((a) => a.alive));
    const interactions: Interaction[] = [];

    for (const [agentA, agentB] of pairs) {
      // Both agents perceive the matchup
      agentA.perceive(`Round ${tick}: You are matched with ${agentB.identity.name}.`, tick);
      agentB.perceive(`Round ${tick}: You are matched with ${agentA.identity.name}.`, tick);

      // Both agents decide simultaneously
      const prompt = this.buildDecisionPrompt(tick);
      const [decisionA, decisionB] = await Promise.all([
        agentA.decide(prompt, tick),
        agentB.decide(prompt, tick),
      ]);

      // Parse actions
      const actionA = this.parseAction(decisionA);
      const actionB = this.parseAction(decisionB);

      // Compute payoffs
      const [payoffA, payoffB] = this.computePayoff(actionA, actionB);

      // Update resources
      agentA.updateResources({ wealth: payoffA, reputation: actionA === 'cooperate' ? 1 : -1 });
      agentB.updateResources({ wealth: payoffB, reputation: actionB === 'cooperate' ? 1 : -1 });

      // Record interaction
      const actions = {
        [agentA.identity.id]: actionA,
        [agentB.identity.id]: actionB,
      };
      this.allActions.push(actions);

      interactions.push(
        createInteraction(
          tick,
          [agentA.identity.id, agentB.identity.id],
          'prisoners-dilemma',
          actions,
          { [agentA.identity.id]: payoffA, [agentB.identity.id]: payoffB },
        ),
      );

      // Both agents observe the outcome
      agentA.perceive(
        `Outcome: You ${actionA}d. ${agentB.identity.name} ${actionB}d. You gained ${payoffA} points.`,
        tick,
      );
      agentB.perceive(
        `Outcome: You ${actionB}d. ${agentA.identity.name} ${actionA}d. You gained ${payoffB} points.`,
        tick,
      );
    }

    return interactions;
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const tickActions = interactions.map((i) => i.actions);
    const coopRate = Observatory.cooperationRate(tickActions);

    // Strategy distribution
    const allActionsThisTick = tickActions.flatMap((a) => Object.values(a));
    const cooperateCount = allActionsThisTick.filter((a) => a === 'cooperate').length;
    const defectCount = allActionsThisTick.filter((a) => a === 'defect').length;

    return {
      cooperationRate: coopRate,
      strategyDistribution: {
        cooperate: cooperateCount,
        defect: defectCount,
      },
      averageScore:
        agents.reduce((sum, a) => sum + a.resources.wealth, 0) / Math.max(agents.length, 1),
    };
  }

  private buildDecisionPrompt(tick: number): string {
    return `Round ${tick}: You are playing a Prisoner's Dilemma game.

You must choose to either COOPERATE or DEFECT.

Payoff rules:
- Both cooperate: each gets ${this.payoffMatrix.bothCooperate}
- Both defect: each gets ${this.payoffMatrix.bothDefect}
- You cooperate, opponent defects: you get ${this.payoffMatrix.cooperateDefect}, opponent gets ${this.payoffMatrix.defectCooperate}
- You defect, opponent cooperates: you get ${this.payoffMatrix.defectCooperate}, opponent gets ${this.payoffMatrix.cooperateDefect}

Respond with a JSON object: {"action": "cooperate" or "defect", "reasoning": "your reasoning"}`;
  }

  private parseAction(response: string): PDAction {
    try {
      const parsed = JSON.parse(response);
      if (parsed.action === 'cooperate' || parsed.action === 'defect') {
        return parsed.action;
      }
    } catch {
      // Try to extract from plain text
      const lower = response.toLowerCase();
      if (lower.includes('defect')) return 'defect';
      if (lower.includes('cooperate')) return 'cooperate';
    }
    // Default to cooperate
    return 'cooperate';
  }

  private computePayoff(actionA: PDAction, actionB: PDAction): [number, number] {
    if (actionA === 'cooperate' && actionB === 'cooperate') {
      return [this.payoffMatrix.bothCooperate, this.payoffMatrix.bothCooperate];
    }
    if (actionA === 'defect' && actionB === 'defect') {
      return [this.payoffMatrix.bothDefect, this.payoffMatrix.bothDefect];
    }
    if (actionA === 'cooperate' && actionB === 'defect') {
      return [this.payoffMatrix.cooperateDefect, this.payoffMatrix.defectCooperate];
    }
    // actionA === 'defect' && actionB === 'cooperate'
    return [this.payoffMatrix.defectCooperate, this.payoffMatrix.cooperateDefect];
  }
}
