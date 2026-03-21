import type { ScenarioConfig } from '@sim/shared';
import {
  DEFAULT_MAX_TICKS,
  SI_DEFAULT_INFLUENCE_RADIUS,
  SI_DEFAULT_OPINION_RANGE,
} from '@sim/shared';

export function createSIConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'social-influence',
    name: 'Social Influence',
    description: 'Agents with opinions interact and influence each other. Study opinion dynamics.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 8,
    ...overrides,
    parameters: {
      opinionRange: SI_DEFAULT_OPINION_RANGE,
      influenceRadius: SI_DEFAULT_INFLUENCE_RADIUS,
      ...overrides?.parameters,
    },
  };
}
