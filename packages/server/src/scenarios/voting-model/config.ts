import type { ScenarioConfig } from '@sim/shared';
import { DEFAULT_MAX_TICKS } from '@sim/shared';

export function createVMConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'voting-model',
    name: 'Voting Model',
    description:
      'Agents vote for candidates across multiple rounds. Study collective decision-making.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 7,
    ...overrides,
    parameters: { candidates: ['Alpha', 'Beta', 'Gamma'], ...overrides?.parameters },
  };
}
