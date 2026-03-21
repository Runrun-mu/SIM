import type { WebSocket } from '@fastify/websocket';
import type {
  AgentIdentity,
  HDPayoffMatrix,
  ScenarioConfig,
  WSMessageToClient,
  WSMessageToServer,
} from '@sim/shared';
import { WSMessageToServerSchema } from '@sim/shared';
import { Observatory } from '../core/observatory';
import { type ScenarioEnvironment, SimulationEngine } from '../core/simulation-engine';
import { createLLMAdapter } from '../llm/index';
import type { LLMAdapter } from '../llm/types';
import { AxelrodTournamentEnvironment } from '../scenarios/axelrod-tournament/environment';
import { DictatorGameEnvironment } from '../scenarios/dictator-game/environment';
import { HawkDoveEnvironment } from '../scenarios/hawk-dove/environment';
import { MinorityGameEnvironment } from '../scenarios/minority-game/environment';
import { createPDConfig } from '../scenarios/prisoners-dilemma/config';
import { PrisonersDilemmaEnvironment } from '../scenarios/prisoners-dilemma/environment';
import { PublicGoodsEnvironment } from '../scenarios/public-goods/environment';
import { SchellingSegregationEnvironment } from '../scenarios/schelling-segregation/environment';
import { SIREpidemicEnvironment } from '../scenarios/sir-epidemic/environment';
import { SocialInfluenceEnvironment } from '../scenarios/social-influence/environment';
import { TragedyOfCommonsEnvironment } from '../scenarios/tragedy-of-commons/environment';
import { TrustGameEnvironment } from '../scenarios/trust-game/environment';
import { UltimatumGameEnvironment } from '../scenarios/ultimatum-game/environment';
import { VotingModelEnvironment } from '../scenarios/voting-model/environment';
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

    this.engine.start().then(() => {
      this.send({
        type: 'simulation-ended',
        summary: this.observatory.computeSummary(),
      });
    });
  }

  private createEnvironment(config: ScenarioConfig): ScenarioEnvironment | null {
    const p = config.parameters;
    switch (config.type) {
      case 'prisoners-dilemma': {
        const pdConfig = createPDConfig(config);
        return new PrisonersDilemmaEnvironment(pdConfig.parameters.payoffMatrix, this.llm);
      }
      case 'wealth-distribution': {
        const wdConfig = createWDConfig(config);
        return new WealthDistributionEnvironment(wdConfig.parameters.tradeRange, this.llm);
      }
      case 'public-goods':
        return new PublicGoodsEnvironment(
          { multiplier: (p.multiplier as number) ?? 2, endowment: (p.endowment as number) ?? 20 },
          this.llm,
        );
      case 'ultimatum-game':
        return new UltimatumGameEnvironment((p.stakeAmount as number) ?? 100, this.llm);
      case 'dictator-game':
        return new DictatorGameEnvironment((p.stakeAmount as number) ?? 100, this.llm);
      case 'hawk-dove':
        return new HawkDoveEnvironment(
          (p.payoffMatrix as HDPayoffMatrix) ?? {
            hawkHawk: -2,
            hawkDove: 6,
            doveHawk: 1,
            doveDove: 3,
          },
          this.llm,
        );
      case 'trust-game':
        return new TrustGameEnvironment(
          { endowment: (p.endowment as number) ?? 100, multiplier: (p.multiplier as number) ?? 3 },
          this.llm,
        );
      case 'minority-game':
        return new MinorityGameEnvironment((p.reward as number) ?? 10, this.llm);
      case 'tragedy-of-commons':
        return new TragedyOfCommonsEnvironment(
          {
            pool: (p.pool as number) ?? 1000,
            regenRate: (p.regenRate as number) ?? 0.1,
            maxExtraction: (p.maxExtraction as number) ?? 50,
          },
          this.llm,
        );
      case 'axelrod-tournament':
        return new AxelrodTournamentEnvironment(
          { roundsPerMatch: (p.roundsPerMatch as number) ?? 10 },
          this.llm,
        );
      case 'schelling-segregation':
        return new SchellingSegregationEnvironment(
          { tolerance: (p.tolerance as number) ?? 0.5, numGroups: (p.numGroups as number) ?? 2 },
          this.llm,
        );
      case 'voting-model':
        return new VotingModelEnvironment(
          (p.candidates as string[]) ?? ['Alpha', 'Beta', 'Gamma'],
          this.llm,
        );
      case 'sir-epidemic':
        return new SIREpidemicEnvironment(
          {
            infectionProb: (p.infectionProb as number) ?? 0.3,
            recoveryProb: (p.recoveryProb as number) ?? 0.1,
            initialInfected: (p.initialInfected as number) ?? 1,
            contactsPerTick: (p.contactsPerTick as number) ?? 3,
          },
          this.llm,
        );
      case 'social-influence':
        return new SocialInfluenceEnvironment(
          {
            opinionRange: (p.opinionRange as number) ?? 100,
            influenceRadius: (p.influenceRadius as number) ?? 20,
          },
          this.llm,
        );
      default:
        return null;
    }
  }

  private send(msg: WSMessageToClient): void {
    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(msg));
    }
  }
}
