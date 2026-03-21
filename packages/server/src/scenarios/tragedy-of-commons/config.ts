import type { ScenarioConfig } from '@sim/shared';
import {
  DEFAULT_MAX_TICKS,
  TC_DEFAULT_MAX_EXTRACTION,
  TC_DEFAULT_POOL,
  TC_DEFAULT_REGEN_RATE,
} from '@sim/shared';

export function createTCConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'tragedy-of-commons',
    name: 'Tragedy of the Commons',
    description:
      'Shared resource pool with regeneration. Agents choose extraction. Study sustainability.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 6,
    ...overrides,
    parameters: {
      pool: TC_DEFAULT_POOL,
      regenRate: TC_DEFAULT_REGEN_RATE,
      maxExtraction: TC_DEFAULT_MAX_EXTRACTION,
      ...overrides?.parameters,
    },
  };
}
