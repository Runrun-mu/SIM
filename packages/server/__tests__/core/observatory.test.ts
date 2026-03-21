import { describe, expect, it } from 'bun:test';
import type { TickMetrics } from '@sim/shared';
import { Observatory } from '../../src/core/observatory';

const makeTick = (tick: number, coopRate = 0.5): TickMetrics => ({
  tick,
  timestamp: Date.now(),
  scenarioType: 'prisoners-dilemma',
  agentStates: [],
  interactions: [],
  aggregated: {
    cooperationRate: coopRate,
    averageScore: 2.5,
  },
});

describe('Observatory', () => {
  it('records and retrieves metrics', () => {
    const obs = new Observatory();
    obs.record(makeTick(1));
    obs.record(makeTick(2));

    expect(obs.getHistory()).toHaveLength(2);
    expect(obs.getLatest()?.tick).toBe(2);
  });

  it('computes summary from latest tick', () => {
    const obs = new Observatory();
    obs.record(makeTick(1, 0.3));
    obs.record(makeTick(2, 0.7));

    const summary = obs.computeSummary();
    expect(summary.cooperationRate).toBe(0.7);
  });

  it('handles empty history', () => {
    const obs = new Observatory();
    expect(obs.getLatest()).toBeUndefined();
    expect(obs.computeSummary()).toEqual({});
  });

  describe('giniCoefficient', () => {
    it('returns 0 for equal distribution', () => {
      expect(Observatory.giniCoefficient([100, 100, 100, 100])).toBe(0);
    });

    it('returns high value for unequal distribution', () => {
      const gini = Observatory.giniCoefficient([0, 0, 0, 1000]);
      expect(gini).toBeGreaterThan(0.5);
    });

    it('returns 0 for empty array', () => {
      expect(Observatory.giniCoefficient([])).toBe(0);
    });

    it('returns 0 for all zeros', () => {
      expect(Observatory.giniCoefficient([0, 0, 0])).toBe(0);
    });
  });

  describe('cooperationRate', () => {
    it('calculates correct rate', () => {
      const actions: Record<string, string>[] = [
        { a1: 'cooperate', a2: 'cooperate' },
        { a3: 'cooperate', a4: 'defect' },
      ];
      expect(Observatory.cooperationRate(actions)).toBe(0.75);
    });

    it('returns 0 for empty array', () => {
      expect(Observatory.cooperationRate([])).toBe(0);
    });
  });

  it('clears history', () => {
    const obs = new Observatory();
    obs.record(makeTick(1));
    obs.clear();
    expect(obs.getHistory()).toHaveLength(0);
  });
});
