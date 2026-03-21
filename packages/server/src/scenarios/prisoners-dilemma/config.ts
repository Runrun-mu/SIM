import type { PDPayoffMatrix, ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS, PD_DEFAULT_PAYOFF } from '@sim/shared';

export interface PDConfig extends ScenarioConfig {
  parameters: {
    payoffMatrix: PDPayoffMatrix;
  };
}

export function createPDConfig(overrides?: Partial<ScenarioConfig>): PDConfig {
  return {
    type: 'prisoners-dilemma',
    name: "Prisoner's Dilemma",
    description:
      "Agents are randomly paired each round and must choose to cooperate or defect. Payoffs follow a standard prisoner's dilemma matrix.",
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 4,
    ...overrides,
    parameters: {
      payoffMatrix: (overrides?.parameters?.payoffMatrix as PDPayoffMatrix) ?? PD_DEFAULT_PAYOFF,
    },
  } satisfies PDConfig;
}
