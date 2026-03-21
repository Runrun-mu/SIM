import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, UG_DEFAULT_STAKE } from '@sim/shared';

export function createUGConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'ultimatum-game',
    name: 'Ultimatum Game',
    description: 'Proposer offers a split; responder accepts or rejects. Study fairness norms.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: { stakeAmount: UG_DEFAULT_STAKE, ...overrides?.parameters },
  };
}
