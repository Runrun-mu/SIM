import { z } from 'zod';

// ========================
// Agent Identity Schema
// ========================

export const AgentIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().min(0).max(150),
  occupation: z.string().min(1),
  personality: z.string().min(1),
  wealth: z.number().min(0),
  soul: z.string().min(1),
});

// ========================
// Memory Entry Schema
// ========================

export const MemoryEntrySchema = z.object({
  timestamp: z.number().int().min(0),
  content: z.string(),
  type: z.enum(['observation', 'action', 'reflection']),
  importance: z.number().min(0).max(1),
});

// ========================
// Resource Attributes Schema
// ========================

export const ResourceAttributesSchema = z
  .object({
    wealth: z.number(),
    health: z.number(),
    credit: z.number(),
    reputation: z.number(),
  })
  .catchall(z.number());

// ========================
// Scenario Config Schema
// ========================

export const ScenarioConfigSchema = z.object({
  type: z.enum([
    'prisoners-dilemma',
    'wealth-distribution',
    'public-goods',
    'ultimatum-game',
    'dictator-game',
    'hawk-dove',
    'trust-game',
    'minority-game',
    'tragedy-of-commons',
    'axelrod-tournament',
    'schelling-segregation',
    'voting-model',
    'sir-epidemic',
    'social-influence',
  ]),
  name: z.string().min(1),
  description: z.string(),
  maxTicks: z.number().int().min(1),
  agentCount: z.number().int().min(2),
  parameters: z.record(z.unknown()),
});

// ========================
// Payoff Matrix Schema (Prisoners Dilemma)
// ========================

export const PDPayoffMatrixSchema = z.object({
  bothCooperate: z.number(),
  bothDefect: z.number(),
  cooperateDefect: z.number(),
  defectCooperate: z.number(),
});

// ========================
// Trade Proposal Schema (Wealth Distribution)
// ========================

export const TradeProposalSchema = z.object({
  agentId: z.string(),
  offer: z.number().min(0),
  demand: z.number().min(0),
  reasoning: z.string(),
});

// ========================
// Public Goods Config Schema
// ========================

export const PublicGoodsConfigSchema = z.object({
  groupSize: z.number().int().min(2),
  multiplier: z.number().min(1),
  endowment: z.number().min(0),
  punishmentCost: z.number().min(0),
  punishmentPenalty: z.number().min(0),
});

// ========================
// WS Message Schemas
// ========================

export const WSMessageToServerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('start-simulation'),
    config: ScenarioConfigSchema,
    agents: z.array(AgentIdentitySchema),
  }),
  z.object({ type: z.literal('pause') }),
  z.object({ type: z.literal('resume') }),
  z.object({ type: z.literal('stop') }),
  z.object({ type: z.literal('set-speed'), speed: z.number().min(0.1).max(10) }),
]);

// ========================
// LLM Request Schema
// ========================

export const LLMRequestSchema = z.object({
  systemPrompt: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).optional(),
});
