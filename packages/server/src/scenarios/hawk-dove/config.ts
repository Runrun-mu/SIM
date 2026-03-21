import type { HDPayoffMatrix, ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, HD_DEFAULT_PAYOFF } from '@sim/shared';

export function createHDConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'hawk-dove',
    name: 'Hawk-Dove Game',
    description:
      'Agents choose aggressive (hawk) or peaceful (dove) strategies for resource competition.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: {
      payoffMatrix: (overrides?.parameters?.payoffMatrix as HDPayoffMatrix) ?? HD_DEFAULT_PAYOFF,
      ...overrides?.parameters,
    },
  };
}
