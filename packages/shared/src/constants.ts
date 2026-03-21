export const APP_NAME = 'Group Dynamics Simulator';

// Memory
export const SHORT_TERM_MEMORY_LIMIT = 20;
export const LONG_TERM_MEMORY_LIMIT = 50;
export const MEMORY_CONSOLIDATION_INTERVAL = 5; // every N ticks

// LLM
export const DEFAULT_LLM_TEMPERATURE = 0.7;
export const DEFAULT_LLM_MAX_TOKENS = 512;

// Simulation
export const DEFAULT_TICK_DELAY_MS = 1000;
export const DEFAULT_MAX_TICKS = 20;

// Prisoners Dilemma defaults
export const PD_DEFAULT_PAYOFF = {
  bothCooperate: 3,
  bothDefect: 1,
  cooperateDefect: 0, // sucker's payoff
  defectCooperate: 5, // temptation payoff
} as const;

// Wealth Distribution defaults
export const WD_DEFAULT_INITIAL_WEALTH = 100;
export const WD_DEFAULT_TRADE_RANGE = 0.3; // max % of wealth per trade

// WebSocket
export const WS_PATH = '/ws';
export const SERVER_PORT = 3001;
