import type {
  AgentIdentity,
  AggregatedMetrics,
  Interaction,
  ScenarioConfig,
  SimulationState,
  SimulationStatus,
  TickMetrics,
} from '@sim/shared';
import { DEFAULT_TICK_DELAY_MS } from '@sim/shared';
import type { LLMAdapter } from '../llm/types';
import { Agent } from './agent';

export interface ScenarioEnvironment {
  /** Run a single tick: pair agents, get decisions, compute outcomes */
  executeTick(agents: Agent[], tick: number): Promise<Interaction[]>;
  /** Compute aggregated metrics for this tick */
  computeMetrics(agents: Agent[], interactions: Interaction[], tick: number): AggregatedMetrics;
}

export type TickCallback = (metrics: TickMetrics) => void;

export class SimulationEngine {
  private state: SimulationState;
  private agents: Agent[] = [];
  private environment: ScenarioEnvironment;
  private llm: LLMAdapter;
  private tickCallback?: TickCallback;
  private tickDelay: number;
  private abortController?: AbortController;

  constructor(
    config: ScenarioConfig,
    identities: AgentIdentity[],
    environment: ScenarioEnvironment,
    llm: LLMAdapter,
    options?: { tickDelay?: number; onTick?: TickCallback },
  ) {
    this.environment = environment;
    this.llm = llm;
    this.tickDelay = options?.tickDelay ?? DEFAULT_TICK_DELAY_MS;
    this.tickCallback = options?.onTick;

    // Create agents
    this.agents = identities.map((id) => new Agent(id, this.llm));

    this.state = {
      status: 'idle',
      currentTick: 0,
      config,
      agents: this.agents.map((a) => a.snapshot()),
      history: [],
    };
  }

  getStatus(): SimulationStatus {
    return this.state.status;
  }

  getCurrentTick(): number {
    return this.state.currentTick;
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  getHistory(): TickMetrics[] {
    return this.state.history;
  }

  getState(): SimulationState {
    return {
      ...this.state,
      agents: this.agents.map((a) => a.snapshot()),
    };
  }

  /** Start the simulation loop */
  async start(): Promise<void> {
    if (this.state.status === 'running') return;

    this.state.status = 'running';
    this.abortController = new AbortController();

    try {
      while (
        this.state.status === 'running' &&
        this.state.currentTick < this.state.config.maxTicks
      ) {
        this.state.currentTick++;
        const tick = this.state.currentTick;

        // Execute tick (with error recovery per tick)
        let interactions: Interaction[] = [];
        try {
          interactions = await this.environment.executeTick(this.agents, tick);
        } catch (tickError) {
          console.error(`[SimEngine] Tick ${tick} executeTick failed:`, tickError);
          // Continue to next tick instead of crashing
        }

        // Compute metrics
        const aggregated = this.environment.computeMetrics(this.agents, interactions, tick);

        const metrics: TickMetrics = {
          tick,
          timestamp: Date.now(),
          scenarioType: this.state.config.type,
          agentStates: this.agents.map((a) => a.snapshot()),
          interactions,
          aggregated,
        };

        this.state.history.push(metrics);

        // Notify callback
        this.tickCallback?.(metrics);

        // Delay between ticks (skip if paused/stopped)
        if (this.state.status === 'running' && this.tickDelay > 0) {
          await this.sleep(this.tickDelay);
        }
      }

      if (this.state.status === 'running') {
        this.state.status = 'ended';
      }
    } catch (_error) {
      this.state.status = 'ended';
      throw _error;
    }
  }

  pause(): void {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
    }
  }

  async resume(): Promise<void> {
    if (this.state.status === 'paused') {
      await this.start();
    }
  }

  stop(): void {
    this.state.status = 'ended';
    this.abortController?.abort();
  }

  setTickDelay(ms: number): void {
    this.tickDelay = ms;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
