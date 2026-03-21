import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, SS_DEFAULT_NUM_GROUPS, SS_DEFAULT_TOLERANCE } from '@sim/shared';

export function createSSConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'schelling-segregation',
    name: 'Schelling Segregation',
    description: 'Agents on a ring prefer similar neighbors. Study emergent segregation.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 8,
    ...overrides,
    parameters: {
      tolerance: SS_DEFAULT_TOLERANCE,
      numGroups: SS_DEFAULT_NUM_GROUPS,
      ...overrides?.parameters,
    },
  };
}
