import type { AggregatedMetrics, TickMetrics } from '@sim/shared';

/**
 * Observatory: collects and computes metrics across simulation ticks.
 * Provides both per-tick data and rolling aggregations.
 */
export class Observatory {
  private history: TickMetrics[] = [];

  /** Record a tick's metrics */
  record(metrics: TickMetrics): void {
    this.history.push(metrics);
  }

  /** Get all recorded history */
  getHistory(): TickMetrics[] {
    return this.history;
  }

  /** Get the latest metrics */
  getLatest(): TickMetrics | undefined {
    return this.history[this.history.length - 1];
  }

  /** Compute summary across all ticks */
  computeSummary(): AggregatedMetrics {
    if (this.history.length === 0) {
      return {};
    }

    const latest = this.history[this.history.length - 1];
    if (!latest) return {};

    // Return the latest aggregated metrics as the summary
    // In a more sophisticated version, we'd compute rolling averages
    return latest.aggregated;
  }

  /** Calculate Gini coefficient from an array of values */
  static giniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / n;

    if (mean === 0) return 0;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      const v = sorted[i];
      if (v !== undefined) {
        sum += (2 * (i + 1) - n - 1) * v;
      }
    }

    return sum / (n * n * mean);
  }

  /** Calculate cooperation rate from PD actions */
  static cooperationRate(actions: Record<string, string>[]): number {
    const allActions = actions.flatMap((a) => Object.values(a));
    if (allActions.length === 0) return 0;
    const cooperations = allActions.filter((a) => a === 'cooperate').length;
    return cooperations / allActions.length;
  }

  /** Clear history */
  clear(): void {
    this.history = [];
  }
}
