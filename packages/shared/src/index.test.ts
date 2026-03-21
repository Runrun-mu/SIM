import { describe, expect, it } from 'bun:test';
import {
  APP_NAME,
  AgentIdentitySchema,
  PDPayoffMatrixSchema,
  PD_DEFAULT_PAYOFF,
  ScenarioConfigSchema,
} from '@sim/shared';

describe('shared', () => {
  it('exports APP_NAME', () => {
    expect(APP_NAME).toBe('Group Dynamics Simulator');
  });
});

describe('schemas', () => {
  it('validates AgentIdentity', () => {
    const valid = {
      id: 'agent-1',
      name: 'Alice',
      age: 30,
      occupation: 'Engineer',
      personality: 'Analytical',
      wealth: 100,
      soul: 'You are Alice, a rational engineer.',
    };
    expect(AgentIdentitySchema.safeParse(valid).success).toBe(true);

    const invalid = { id: '', name: '' };
    expect(AgentIdentitySchema.safeParse(invalid).success).toBe(false);
  });

  it('validates ScenarioConfig', () => {
    const valid = {
      type: 'prisoners-dilemma' as const,
      name: 'Test PD',
      description: 'A test game',
      maxTicks: 10,
      agentCount: 4,
      parameters: {},
    };
    expect(ScenarioConfigSchema.safeParse(valid).success).toBe(true);
  });

  it('validates PD payoff matrix', () => {
    expect(PDPayoffMatrixSchema.safeParse(PD_DEFAULT_PAYOFF).success).toBe(true);
  });
});
