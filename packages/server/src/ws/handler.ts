import type { WebSocket } from '@fastify/websocket';
import type {
  AgentIdentity,
  ScenarioConfig,
  WSMessageToClient,
  WSMessageToServer,
} from '@sim/shared';
import { WSMessageToServerSchema } from '@sim/shared';
import { Observatory } from '../core/observatory';
import { type ScenarioEnvironment, SimulationEngine } from '../core/simulation-engine';
import { createLLMAdapter } from '../llm/index';
import type { LLMAdapter } from '../llm/types';
import { createPDConfig } from '../scenarios/prisoners-dilemma/config';
import { PrisonersDilemmaEnvironment } from '../scenarios/prisoners-dilemma/environment';
import { createWDConfig } from '../scenarios/wealth-distribution/config';
import { WealthDistributionEnvironment } from '../scenarios/wealth-distribution/environment';

export class SimulationHandler {
  private engine?: SimulationEngine;
  private observatory = new Observatory();
  private socket: WebSocket;
  private llm: LLMAdapter;

  constructor(socket: WebSocket) {
    this.socket = socket;
    this.llm = createLLMAdapter();
  }

  handleMessage(raw: string): void {
    try {
      const data = JSON.parse(raw);
      const parsed = WSMessageToServerSchema.safeParse(data);

      if (!parsed.success) {
        this.send({ type: 'error', message: `Invalid message: ${parsed.error.message}` });
        return;
      }

      const msg = parsed.data as WSMessageToServer;

      switch (msg.type) {
        case 'start-simulation':
          this.startSimulation(msg.config, msg.agents);
          break;
        case 'pause':
          this.engine?.pause();
          this.send({ type: 'simulation-paused' });
          break;
        case 'resume':
          this.engine?.resume();
          this.send({ type: 'simulation-resumed' });
          break;
        case 'stop':
          this.engine?.stop();
          this.send({
            type: 'simulation-ended',
            summary: this.observatory.computeSummary(),
          });
          break;
        case 'set-speed':
          this.engine?.setTickDelay(1000 / msg.speed);
          break;
      }
    } catch (err) {
      this.send({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  private startSimulation(config: ScenarioConfig, agents: AgentIdentity[]): void {
    if (this.engine?.getStatus() === 'running') {
      this.send({ type: 'error', message: 'Simulation already running' });
      return;
    }

    this.observatory.clear();

    // Create environment based on scenario type
    const environment = this.createEnvironment(config);
    if (!environment) {
      this.send({ type: 'error', message: `Unknown scenario type: ${config.type}` });
      return;
    }

    this.engine = new SimulationEngine(config, agents, environment, this.llm, {
      tickDelay: 1000,
      onTick: (metrics) => {
        this.observatory.record(metrics);
        this.send({ type: 'tick', data: metrics });
      },
    });

    this.send({ type: 'simulation-started', config });

    // Run simulation asynchronously
    this.engine.start().then(() => {
      this.send({
        type: 'simulation-ended',
        summary: this.observatory.computeSummary(),
      });
    });
  }

  private createEnvironment(config: ScenarioConfig): ScenarioEnvironment | null {
    switch (config.type) {
      case 'prisoners-dilemma': {
        const pdConfig = createPDConfig(config);
        return new PrisonersDilemmaEnvironment(pdConfig.parameters.payoffMatrix, this.llm);
      }
      case 'wealth-distribution': {
        const wdConfig = createWDConfig(config);
        return new WealthDistributionEnvironment(wdConfig.parameters.tradeRange, this.llm);
      }
      default:
        return null;
    }
  }

  private send(msg: WSMessageToClient): void {
    if (this.socket.readyState === 1) {
      // OPEN
      this.socket.send(JSON.stringify(msg));
    }
  }
}
