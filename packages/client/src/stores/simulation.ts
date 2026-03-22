import type {
  AgentIdentity,
  AggregatedMetrics,
  ScenarioConfig,
  ScenarioType,
  SimulationStatus,
  TickMetrics,
  WSMessageToClient,
} from '@sim/shared';
import { create } from 'zustand';

export interface AgentDecision {
  agentId: string;
  tick: number;
  decision: string;
  reasoning: string;
}

interface SimulationStore {
  // Config
  scenarioType: ScenarioType | null;
  config: ScenarioConfig | null;
  agents: AgentIdentity[];
  maxTicks: number;

  // Runtime
  status: SimulationStatus;
  currentTick: number;
  tickHistory: TickMetrics[];
  decisions: AgentDecision[];
  summary: AggregatedMetrics | null;

  // Selected agent
  selectedAgentId: string | null;

  // Actions
  setScenario: (type: ScenarioType) => void;
  setConfig: (config: ScenarioConfig) => void;
  addAgent: (agent: AgentIdentity) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<AgentIdentity>) => void;
  setAgents: (agents: AgentIdentity[]) => void;
  setMaxTicks: (ticks: number) => void;
  setStatus: (status: SimulationStatus) => void;
  addTick: (tick: TickMetrics) => void;
  addDecision: (decision: AgentDecision) => void;
  setSummary: (summary: AggregatedMetrics) => void;
  selectAgent: (id: string | null) => void;
  reset: () => void;
  handleWSMessage: (msg: WSMessageToClient) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  scenarioType: null,
  config: null,
  agents: [],
  maxTicks: 20,
  status: 'idle',
  currentTick: 0,
  tickHistory: [],
  decisions: [],
  summary: null,
  selectedAgentId: null,

  setScenario: (type) => set({ scenarioType: type }),
  setConfig: (config) => set({ config }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  setAgents: (agents) => set({ agents }),
  setMaxTicks: (ticks) => set({ maxTicks: ticks }),
  setStatus: (status) => set({ status }),
  addTick: (tick) =>
    set((s) => ({
      tickHistory: [...s.tickHistory, tick],
      currentTick: tick.tick,
    })),
  addDecision: (decision) => set((s) => ({ decisions: [...s.decisions, decision] })),
  setSummary: (summary) => set({ summary }),
  selectAgent: (id) => set({ selectedAgentId: id }),
  reset: () =>
    set({
      status: 'idle',
      currentTick: 0,
      tickHistory: [],
      decisions: [],
      summary: null,
      selectedAgentId: null,
    }),

  handleWSMessage: (msg) => {
    switch (msg.type) {
      case 'simulation-started':
        set({ status: 'running', currentTick: 0, tickHistory: [], decisions: [], summary: null });
        break;
      case 'tick':
        set((s) => {
          // Keep last 200 ticks in memory to avoid OOM on long simulations
          const MAX_HISTORY = 200;
          const newHistory = [...s.tickHistory, msg.data];
          return {
            tickHistory:
              newHistory.length > MAX_HISTORY ? newHistory.slice(-MAX_HISTORY) : newHistory,
            currentTick: msg.data.tick,
          };
        });
        break;
      case 'agent-decision':
        set((s) => ({
          decisions: [
            ...s.decisions,
            {
              agentId: msg.agentId,
              tick: msg.tick,
              decision: msg.decision,
              reasoning: msg.reasoning,
            },
          ],
        }));
        break;
      case 'simulation-paused':
        set({ status: 'paused' });
        break;
      case 'simulation-resumed':
        set({ status: 'running' });
        break;
      case 'simulation-ended':
        set({ status: 'ended', summary: msg.summary });
        break;
      case 'error':
        console.error('Server error:', msg.message);
        break;
    }
  },
}));
