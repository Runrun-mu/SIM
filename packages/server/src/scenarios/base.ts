import type { ScenarioConfig } from '@sim/shared';
import type { ScenarioEnvironment } from '../core/simulation-engine';
import type { LLMAdapter } from '../llm/types';

/**
 * Base interface for scenario factories.
 * Each scenario provides a default config and an environment.
 */
export interface ScenarioFactory {
  /** Create scenario config with optional overrides */
  createConfig(overrides?: Partial<ScenarioConfig>): ScenarioConfig;
  /** Create the scenario environment */
  createEnvironment(llm: LLMAdapter): ScenarioEnvironment;
}
