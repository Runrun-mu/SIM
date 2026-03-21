// ========================
// Agent Types
// ========================

export interface AgentIdentity {
  id: string;
  name: string;
  age: number;
  occupation: string;
  personality: string;
  wealth: number;
  soul: string; // Written into LLM system role
}

// ========================
// Memory System
// ========================

export type MemoryType = 'observation' | 'action' | 'reflection';

export interface MemoryEntry {
  timestamp: number; // tick number
  content: string;
  type: MemoryType;
  importance: number; // 0-1
}

export interface MemorySystem {
  soul: string; // Immutable core persona
  shortTerm: MemoryEntry[]; // Recent N entries
  longTerm: MemoryEntry[]; // Compressed summaries
}

// ========================
// Resource Attributes
// ========================

export interface ResourceAttributes {
  wealth: number;
  health: number;
  credit: number;
  reputation: number;
  [key: string]: number;
}

// ========================
// Agent State (full runtime state)
// ========================

export interface AgentState {
  identity: AgentIdentity;
  memory: MemorySystem;
  resources: ResourceAttributes;
  alive: boolean;
}

// ========================
// Scenario Types
// ========================

export type ScenarioType = 'prisoners-dilemma' | 'wealth-distribution';

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  description: string;
  maxTicks: number;
  agentCount: number;
  parameters: Record<string, unknown>;
}

// ========================
// Interaction Types
// ========================

export interface Interaction {
  id: string;
  tick: number;
  participants: string[]; // agent IDs
  type: string;
  actions: Record<string, string>; // agentId -> action
  outcomes: Record<string, number>; // agentId -> payoff
}

// ========================
// Prisoners Dilemma Specific
// ========================

export type PDAction = 'cooperate' | 'defect';

export interface PDPayoffMatrix {
  bothCooperate: number;
  bothDefect: number;
  cooperateDefect: number; // cooperator gets this
  defectCooperate: number; // defector gets this
}

// ========================
// Wealth Distribution Specific
// ========================

export interface TradeProposal {
  agentId: string;
  offer: number;
  demand: number;
  reasoning: string;
}

// ========================
// Observatory / Metrics
// ========================

export interface TickMetrics {
  tick: number;
  timestamp: number;
  scenarioType: ScenarioType;
  agentStates: AgentState[];
  interactions: Interaction[];
  aggregated: AggregatedMetrics;
}

export interface AggregatedMetrics {
  // Prisoners Dilemma
  cooperationRate?: number;
  strategyDistribution?: Record<string, number>;
  averageScore?: number;

  // Wealth Distribution
  giniCoefficient?: number;
  wealthDistribution?: number[];
  top10Percent?: number;

  // General
  custom?: Record<string, number>;
}

// ========================
// LLM Types
// ========================

export interface LLMRequest {
  systemPrompt: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ========================
// WebSocket Messages
// ========================

export type WSMessageToServer =
  | { type: 'start-simulation'; config: ScenarioConfig; agents: AgentIdentity[] }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'set-speed'; speed: number };

export type WSMessageToClient =
  | { type: 'tick'; data: TickMetrics }
  | { type: 'simulation-started'; config: ScenarioConfig }
  | { type: 'simulation-paused' }
  | { type: 'simulation-resumed' }
  | { type: 'simulation-ended'; summary: AggregatedMetrics }
  | { type: 'error'; message: string }
  | { type: 'agent-decision'; agentId: string; tick: number; decision: string; reasoning: string };

// ========================
// Simulation Engine Types
// ========================

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface SimulationState {
  status: SimulationStatus;
  currentTick: number;
  config: ScenarioConfig;
  agents: AgentState[];
  history: TickMetrics[];
}
