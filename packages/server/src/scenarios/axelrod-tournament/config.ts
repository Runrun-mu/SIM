import type { ScenarioConfig } from '@sim/shared';
import { AT_DEFAULT_ROUNDS_PER_MATCH, DEFAULT_MAX_TICKS } from '@sim/shared';

export function createATConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'axelrod-tournament',
    name: 'Axelrod Tournament',
    description:
      'Iterated PD round-robin tournament. Agents play multiple rounds against each other.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: { roundsPerMatch: AT_DEFAULT_ROUNDS_PER_MATCH, ...overrides?.parameters },
  };
}
