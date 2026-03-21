import type { AggregatedMetrics, Interaction } from '@sim/shared';
import type { Agent } from '../../core/agent';
import { createInteraction } from '../../core/interaction';
import type { ScenarioEnvironment } from '../../core/simulation-engine';
import type { LLMAdapter } from '../../llm/types';

export class VotingModelEnvironment implements ScenarioEnvironment {
  private llm: LLMAdapter;
  private candidates: string[];
  private previousVotes: Map<string, string> = new Map();

  constructor(candidates: string[], llm: LLMAdapter) {
    this.llm = llm;
    this.candidates = candidates;
  }

  async executeTick(agents: Agent[], tick: number): Promise<Interaction[]> {
    const alive = agents.filter((a) => a.alive);
    const votes: Map<string, string> = new Map();
    let switched = 0;

    for (const agent of alive) {
      const prevVote = this.previousVotes.get(agent.identity.id) ?? 'none';
      agent.perceive(
        `Round ${tick}: Election. Candidates: ${this.candidates.join(', ')}. Your last vote: ${prevVote}.`,
        tick,
      );
      const prompt = `Round ${tick}: Voting. Choose one candidate: ${this.candidates.join(', ')}.
Consider their platforms and the previous results. Your previous vote: ${prevVote}.
Respond with JSON: {"vote": "<candidate name>", "reasoning": "..."}`;
      const decision = await agent.decide(prompt, tick);
      const vote = this.parseVote(decision);
      votes.set(agent.identity.id, vote);
      if (
        this.previousVotes.has(agent.identity.id) &&
        this.previousVotes.get(agent.identity.id) !== vote
      )
        switched++;
    }

    const distribution: Record<string, number> = {};
    for (const c of this.candidates) distribution[c] = 0;
    for (const v of votes.values()) distribution[v] = (distribution[v] ?? 0) + 1;

    let winner = this.candidates[0] ?? 'none';
    let maxVotes = 0;
    for (const [c, count] of Object.entries(distribution)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = c;
      }
    }

    const actions: Record<string, string> = {};
    const outcomes: Record<string, number> = {};
    for (const agent of alive) {
      const vote = votes.get(agent.identity.id) ?? this.candidates[0] ?? 'none';
      actions[agent.identity.id] = vote;
      outcomes[agent.identity.id] = vote === winner ? 1 : 0;
      agent.perceive(
        `Results: ${Object.entries(distribution)
          .map(([c, n]) => `${c}:${n}`)
          .join(', ')}. Winner: ${winner}.`,
        tick,
      );
    }

    this.previousVotes = votes;
    return [
      createInteraction(
        tick,
        alive.map((a) => a.identity.id),
        'voting-model',
        actions,
        outcomes,
      ),
    ];
  }

  computeMetrics(agents: Agent[], interactions: Interaction[], _tick: number): AggregatedMetrics {
    const i = interactions[0];
    if (!i) return {};
    const votes = Object.values(i.actions);
    const dist: Record<string, number> = {};
    for (const v of votes) dist[v] = (dist[v] ?? 0) + 1;
    let winner = '';
    let max = 0;
    for (const [c, n] of Object.entries(dist)) {
      if (n > max) {
        max = n;
        winner = c;
      }
    }
    return {
      voteDistribution: dist,
      winningCandidate: winner,
      swingVoterRate: 0,
    };
  }

  private parseVote(response: string): string {
    try {
      const parsed = JSON.parse(response);
      if (this.candidates.includes(parsed.vote)) return parsed.vote;
    } catch {
      /* fallback */
    }
    for (const c of this.candidates) {
      if (response.includes(c)) return c;
    }
    return this.candidates[0] ?? 'Alpha';
  }
}
