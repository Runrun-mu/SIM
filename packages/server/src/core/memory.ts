import type { MemoryEntry, MemorySystem, MemoryType } from '@sim/shared';
import { LONG_TERM_MEMORY_LIMIT, SHORT_TERM_MEMORY_LIMIT } from '@sim/shared';
import type { LLMAdapter } from '../llm/types';

export class Memory implements MemorySystem {
  soul: string;
  shortTerm: MemoryEntry[] = [];
  longTerm: MemoryEntry[] = [];

  constructor(soul: string) {
    this.soul = soul;
  }

  /** Add a new memory entry to short-term memory */
  add(content: string, type: MemoryType, tick: number, importance = 0.5): void {
    this.shortTerm.push({
      timestamp: tick,
      content,
      type,
      importance: Math.max(0, Math.min(1, importance)),
    });

    // Trim short-term memory if over limit
    if (this.shortTerm.length > SHORT_TERM_MEMORY_LIMIT) {
      this.shortTerm = this.shortTerm.slice(-SHORT_TERM_MEMORY_LIMIT);
    }
  }

  /** Get recent N memories from short-term */
  getRecent(n: number): MemoryEntry[] {
    return this.shortTerm.slice(-n);
  }

  /** Get all memories (short + long) sorted by timestamp */
  getAll(): MemoryEntry[] {
    return [...this.longTerm, ...this.shortTerm].sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Format memories for LLM prompt injection */
  toPrompt(): string {
    const parts: string[] = [];

    if (this.longTerm.length > 0) {
      parts.push('## Long-term memories (summaries):');
      for (const m of this.longTerm) {
        parts.push(`- [Tick ${m.timestamp}] ${m.content}`);
      }
    }

    if (this.shortTerm.length > 0) {
      parts.push('## Recent memories:');
      for (const m of this.shortTerm) {
        parts.push(`- [Tick ${m.timestamp}] (${m.type}) ${m.content}`);
      }
    }

    return parts.join('\n');
  }

  /** Consolidate short-term memories into long-term using LLM */
  async consolidate(llm: LLMAdapter): Promise<void> {
    if (this.shortTerm.length === 0) return;

    const memoryText = this.shortTerm.map((m) => `[Tick ${m.timestamp}] ${m.content}`).join('\n');

    const response = await llm.generate({
      systemPrompt:
        'You are a memory consolidation system. Summarize the following memories into a brief, key-insight summary. Keep it under 2 sentences.',
      messages: [
        {
          role: 'user',
          content: `Please consolidate these memories:\n${memoryText}`,
        },
      ],
    });

    const lastTick = this.shortTerm[this.shortTerm.length - 1]?.timestamp ?? 0;

    this.longTerm.push({
      timestamp: lastTick,
      content: response.content,
      type: 'reflection',
      importance: 0.8,
    });

    // Trim long-term if over limit
    if (this.longTerm.length > LONG_TERM_MEMORY_LIMIT) {
      this.longTerm = this.longTerm.slice(-LONG_TERM_MEMORY_LIMIT);
    }

    // Clear short-term after consolidation
    this.shortTerm = [];
  }

  /** Snapshot for serialization */
  snapshot(): MemorySystem {
    return {
      soul: this.soul,
      shortTerm: [...this.shortTerm],
      longTerm: [...this.longTerm],
    };
  }
}
