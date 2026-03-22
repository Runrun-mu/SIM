import type { AgentIdentity, AgentState, LLMMessage, ResourceAttributes } from '@sim/shared';
import { MEMORY_CONSOLIDATION_INTERVAL } from '@sim/shared';
import type { LLMAdapter } from '../llm/types';
import { Memory } from './memory';

export class Agent {
  readonly identity: AgentIdentity;
  readonly memory: Memory;
  resources: ResourceAttributes;
  alive = true;

  private llm: LLMAdapter;
  private ticksSinceConsolidation = 0;

  constructor(identity: AgentIdentity, llm: LLMAdapter) {
    this.identity = identity;
    this.llm = llm;
    this.memory = new Memory(identity.soul);
    this.resources = {
      wealth: identity.wealth,
      health: 100,
      credit: 50,
      reputation: 50,
    };
  }

  /** Agent perceives the environment — adds observation to memory */
  perceive(observation: string, tick: number): void {
    this.memory.add(observation, 'observation', tick);
  }

  /** Agent makes a decision via LLM */
  async decide(prompt: string, tick: number): Promise<string> {
    const memoryContext = this.memory.toPrompt();
    const systemPrompt = `${this.identity.soul}\n\nYour current resources: wealth=${this.resources.wealth}, health=${this.resources.health}, credit=${this.resources.credit}, reputation=${this.resources.reputation}\n\n${memoryContext}`;

    const messages: LLMMessage[] = [{ role: 'user', content: prompt }];

    let response: { content: string };
    try {
      // Timeout LLM calls after 15s to prevent simulation from hanging
      const result = await Promise.race([
        this.llm.generate({ systemPrompt, messages }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM call timed out after 15s')), 15_000),
        ),
      ]);
      response = result;
    } catch (err) {
      console.warn(
        `[Agent ${this.identity.name}] LLM error at tick ${tick}:`,
        err instanceof Error ? err.message : err,
      );
      // Fallback response
      response = {
        content: JSON.stringify({ action: 'cooperate', reasoning: 'Fallback: LLM unavailable.' }),
      };
    }

    // Record the decision in memory
    this.memory.add(`Decision: ${response.content}`, 'action', tick, 0.7);

    // Consolidate memory periodically
    this.ticksSinceConsolidation++;
    if (this.ticksSinceConsolidation >= MEMORY_CONSOLIDATION_INTERVAL) {
      await this.memory.consolidate(this.llm);
      this.ticksSinceConsolidation = 0;
    }

    return response.content;
  }

  /** Update agent resources */
  updateResources(delta: Partial<ResourceAttributes>): void {
    for (const [key, value] of Object.entries(delta)) {
      if (typeof value === 'number') {
        const current = this.resources[key] ?? 0;
        this.resources[key] = current + value;
      }
    }
  }

  /** Get current state snapshot */
  snapshot(): AgentState {
    return {
      identity: { ...this.identity },
      memory: this.memory.snapshot(),
      resources: { ...this.resources },
      alive: this.alive,
    };
  }
}
