import type { ScenarioConfig } from '@sim/shared';
import {
  DEFAULT_MAX_TICKS,
  PG_DEFAULT_ENDOWMENT,
  PG_DEFAULT_GROUP_SIZE,
  PG_DEFAULT_MULTIPLIER,
  PG_DEFAULT_PUNISHMENT_COST,
  PG_DEFAULT_PUNISHMENT_PENALTY,
} from '@sim/shared';

export function createPGConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'public-goods',
    name: 'Public Goods Game',
    description:
      'Agents decide how much to contribute to a shared pool. The pool is multiplied and distributed equally.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 6,
    ...overrides,
    parameters: {
      multiplier: PG_DEFAULT_MULTIPLIER,
      endowment: PG_DEFAULT_ENDOWMENT,
      groupSize: PG_DEFAULT_GROUP_SIZE,
      punishmentCost: PG_DEFAULT_PUNISHMENT_COST,
      punishmentPenalty: PG_DEFAULT_PUNISHMENT_PENALTY,
      ...overrides?.parameters,
    },
  };
}
