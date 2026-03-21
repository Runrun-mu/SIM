import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, DG_DEFAULT_STAKE } from '@sim/shared';

export function createDGConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'dictator-game',
    name: 'Dictator Game',
    description: 'Dictator decides how to split a stake. Receiver must accept. Study altruism.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: { stakeAmount: DG_DEFAULT_STAKE, ...overrides?.parameters },
  };
}
