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

// Public Goods Game defaults
export const PG_DEFAULT_MULTIPLIER = 2;
export const PG_DEFAULT_ENDOWMENT = 20;
export const PG_DEFAULT_GROUP_SIZE = 4;
export const PG_DEFAULT_PUNISHMENT_COST = 3;
export const PG_DEFAULT_PUNISHMENT_PENALTY = 9;

// Ultimatum Game defaults
export const UG_DEFAULT_STAKE = 100;

// Dictator Game defaults
export const DG_DEFAULT_STAKE = 100;

// Hawk-Dove Game defaults
export const HD_DEFAULT_PAYOFF = {
  hawkHawk: -2,
  hawkDove: 6,
  doveHawk: 1,
  doveDove: 3,
} as const;

// Trust Game defaults
export const TG_DEFAULT_ENDOWMENT = 100;
export const TG_DEFAULT_MULTIPLIER = 3;

// Minority Game defaults
export const MG_DEFAULT_REWARD = 10;

// Tragedy of Commons defaults
export const TC_DEFAULT_POOL = 1000;
export const TC_DEFAULT_REGEN_RATE = 0.1;
export const TC_DEFAULT_MAX_EXTRACTION = 50;

// Axelrod Tournament defaults
export const AT_DEFAULT_ROUNDS_PER_MATCH = 10;
export const AT_DEFAULT_NOISE = 0.05;

// Schelling Segregation defaults
export const SS_DEFAULT_TOLERANCE = 0.5;
export const SS_DEFAULT_NUM_GROUPS = 2;

// Voting Model defaults
export const VM_DEFAULT_CANDIDATES = ['Alpha', 'Beta', 'Gamma'] as const;

// SIR Epidemic defaults
export const SIR_DEFAULT_INFECTION_PROB = 0.3;
export const SIR_DEFAULT_RECOVERY_PROB = 0.1;
export const SIR_DEFAULT_INITIAL_INFECTED = 1;
export const SIR_DEFAULT_CONTACTS_PER_TICK = 3;

// Social Influence defaults
export const SI_DEFAULT_OPINION_RANGE = 100;
export const SI_DEFAULT_INFLUENCE_RADIUS = 20;
export const SI_DEFAULT_STUBBORNNESS = 0.3;

// WebSocket
export const WS_PATH = '/ws';
export const SERVER_PORT = 3001;
