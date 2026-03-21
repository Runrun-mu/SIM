import { describe, expect, it } from 'bun:test';
import { Memory } from '../../src/core/memory';
import { MockLLMAdapter } from '../../src/llm/mock-adapter';

describe('Memory', () => {
  it('initializes with soul', () => {
    const mem = new Memory('I am a test agent.');
    expect(mem.soul).toBe('I am a test agent.');
    expect(mem.shortTerm).toHaveLength(0);
    expect(mem.longTerm).toHaveLength(0);
  });

  it('adds entries to short-term', () => {
    const mem = new Memory('test');
    mem.add('Saw something', 'observation', 1);
    mem.add('Did something', 'action', 2, 0.8);

    expect(mem.shortTerm).toHaveLength(2);
    expect(mem.shortTerm[0]?.content).toBe('Saw something');
    expect(mem.shortTerm[0]?.type).toBe('observation');
    expect(mem.shortTerm[1]?.importance).toBe(0.8);
  });

  it('trims short-term memory to limit', () => {
    const mem = new Memory('test');
    for (let i = 0; i < 25; i++) {
      mem.add(`Memory ${i}`, 'observation', i);
    }
    expect(mem.shortTerm.length).toBeLessThanOrEqual(20);
    expect(mem.shortTerm[0]?.content).toBe('Memory 5');
  });

  it('clamps importance to [0, 1]', () => {
    const mem = new Memory('test');
    mem.add('low', 'observation', 1, -0.5);
    mem.add('high', 'observation', 2, 1.5);
    expect(mem.shortTerm[0]?.importance).toBe(0);
    expect(mem.shortTerm[1]?.importance).toBe(1);
  });

  it('getRecent returns last N entries', () => {
    const mem = new Memory('test');
    for (let i = 0; i < 10; i++) {
      mem.add(`Memory ${i}`, 'observation', i);
    }
    const recent = mem.getRecent(3);
    expect(recent).toHaveLength(3);
    expect(recent[0]?.content).toBe('Memory 7');
  });

  it('toPrompt formats memories', () => {
    const mem = new Memory('test');
    mem.add('I saw a cat', 'observation', 1);
    const prompt = mem.toPrompt();
    expect(prompt).toContain('Recent memories');
    expect(prompt).toContain('I saw a cat');
  });

  it('consolidates short-term to long-term via LLM', async () => {
    const mem = new Memory('test');
    const llm = new MockLLMAdapter();

    mem.add('Event A', 'observation', 1);
    mem.add('Event B', 'action', 2);

    await mem.consolidate(llm);

    expect(mem.shortTerm).toHaveLength(0);
    expect(mem.longTerm).toHaveLength(1);
    expect(mem.longTerm[0]?.type).toBe('reflection');
  });

  it('snapshot returns serializable state', () => {
    const mem = new Memory('test soul');
    mem.add('hello', 'observation', 1);
    const snap = mem.snapshot();
    expect(snap.soul).toBe('test soul');
    expect(snap.shortTerm).toHaveLength(1);
  });
});
