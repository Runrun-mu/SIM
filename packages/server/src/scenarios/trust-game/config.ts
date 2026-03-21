import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, TG_DEFAULT_ENDOWMENT, TG_DEFAULT_MULTIPLIER } from '@sim/shared';

export function createTGConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'trust-game',
    name: 'Trust Game',
    description: 'Investor sends money (multiplied), trustee returns some. Study trust building.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: {
      endowment: TG_DEFAULT_ENDOWMENT,
      multiplier: TG_DEFAULT_MULTIPLIER,
      ...overrides?.parameters,
    },
  };
}
