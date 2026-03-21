import type { ScenarioConfig } from '@sim/shared';
import {
  DEFAULT_MAX_TICKS,
  SIR_DEFAULT_CONTACTS_PER_TICK,
  SIR_DEFAULT_INFECTION_PROB,
  SIR_DEFAULT_INITIAL_INFECTED,
  SIR_DEFAULT_RECOVERY_PROB,
} from '@sim/shared';

export function createSIRConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig {
  return {
    type: 'sir-epidemic',
    name: 'SIR Epidemic',
    description: 'Susceptible-Infected-Recovered model. Study disease spreading and behavior.',
    maxTicks: overrides?.maxTicks ?? DEFAULT_MAX_TICKS,
    agentCount: overrides?.agentCount ?? 10,
    ...overrides,
    parameters: {
      infectionProb: SIR_DEFAULT_INFECTION_PROB,
      recoveryProb: SIR_DEFAULT_RECOVERY_PROB,
      initialInfected: SIR_DEFAULT_INITIAL_INFECTED,
      contactsPerTick: SIR_DEFAULT_CONTACTS_PER_TICK,
      ...overrides?.parameters,
    },
  };
}
