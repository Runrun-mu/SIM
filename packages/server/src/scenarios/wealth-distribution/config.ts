import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, WD_DEFAULT_INITIAL_WEALTH, WD_DEFAULT_TRADE_RANGE } from '@sim/shared';

export interface WDConfig extends ScenarioConfig {
  parameters: {
    initialWealth: number;
    tradeRange: number;
  };
}

export function createWDConfig(overrides?: Partial<ScenarioConfig>): WDConfig {
  return {
    type: 'wealth-distribution',
    name: 'Wealth Distribution',
    description:
      'Agents are randomly paired each round and negotiate trades. They decide how much to offer and demand, and successful trades transfer wealth.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: {
      initialWealth: (overrides?.parameters?.initialWealth as number) ?? WD_DEFAULT_INITIAL_WEALTH,
      tradeRange: (overrides?.parameters?.tradeRange as number) ?? WD_DEFAULT_TRADE_RANGE,
    },
  } satisfies WDConfig;
}
