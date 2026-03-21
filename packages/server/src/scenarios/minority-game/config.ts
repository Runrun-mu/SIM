import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, MG_DEFAULT_REWARD } from '@sim/shared';

export function createMGConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'minority-game',
    name: 'Minority Game',
    description: 'Agents choose A or B. The minority group wins. Study market behavior.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 7,
    ...overrides,
    parameters: { reward: MG_DEFAULT_REWARD, ...overrides?.parameters },
  };
}
