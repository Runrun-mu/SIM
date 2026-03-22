# 核心数据结构

## Agent 体系

```typescript
// Agent 的不可变身份信息
interface AgentIdentity {
  id: string;            // 唯一ID, "agent-{timestamp}-{random}"
  name: string;          // 显示名
  age: number;           // 年龄
  occupation: string;    // 职业
  personality: string;   // 性格描述 (用于 UI 标签)
  wealth: number;        // 初始财富
  soul: string;          // 写入 LLM system role 的完整人格 prompt
}

// 四维资源 + 可扩展
interface ResourceAttributes {
  wealth: number;
  health: number;        // 默认 100
  credit: number;        // 默认 50
  reputation: number;    // 默认 50
  [key: string]: number; // 场景可扩展字段
}

// 记忆条目
interface MemoryEntry {
  timestamp: number;     // tick 编号
  content: string;       // 记忆内容
  type: 'observation' | 'action' | 'reflection';
  importance: number;    // 0-1
}

// 双层记忆系统
interface MemorySystem {
  soul: string;          // 不可变核心人格
  shortTerm: MemoryEntry[];  // 最近 20 条 (FIFO)
  longTerm: MemoryEntry[];   // LLM 压缩摘要, 最多 50 条
}

// 完整运行时状态
interface AgentState {
  identity: AgentIdentity;
  memory: MemorySystem;
  resources: ResourceAttributes;
  alive: boolean;
}
```

## 场景 & 交互

```typescript
// 14 种场景的联合类型
type ScenarioType =
  | 'prisoners-dilemma' | 'wealth-distribution' | 'public-goods'
  | 'ultimatum-game'    | 'dictator-game'       | 'hawk-dove'
  | 'trust-game'        | 'minority-game'        | 'tragedy-of-commons'
  | 'axelrod-tournament' | 'schelling-segregation'| 'voting-model'
  | 'sir-epidemic'       | 'social-influence';

// 场景配置
interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  description: string;
  maxTicks: number;          // 最大轮次
  agentCount: number;        // Agent 数量
  parameters: Record<string, unknown>;  // 场景特有参数
}

// 单次交互记录
interface Interaction {
  id: string;                // "interaction-{tick}-{agentA}-{agentB}"
  tick: number;
  participants: string[];    // agent IDs
  type: string;              // 场景类型名
  actions: Record<string, string>;   // agentId → action
  outcomes: Record<string, number>;  // agentId → payoff
}
```

## 度量系统

```typescript
// 每 tick 快照
interface TickMetrics {
  tick: number;
  timestamp: number;         // Date.now()
  scenarioType: ScenarioType;
  agentStates: AgentState[];
  interactions: Interaction[];
  aggregated: AggregatedMetrics;
}

// 聚合度量 (各场景各有不同字段)
interface AggregatedMetrics {
  // PD: cooperationRate, strategyDistribution, averageScore
  // Wealth: giniCoefficient, wealthDistribution, top10Percent
  // Public Goods: averageContribution, freeRiderRatio, publicPoolTotal
  // Ultimatum: averageOffer, rejectionRate
  // Dictator: averageDictatorOffer, generosityRate
  // Hawk-Dove: hawkRate, conflictRate, averageResourceGain
  // Trust: averageInvestment, averageReturn, trustIndex
  // Minority: minorityChoice, winnerCount, switchRate
  // Tragedy: resourcePool, averageExtraction, sustainabilityIndex
  // Axelrod: tournamentScores, dominantStrategy
  // Schelling: segregationIndex, satisfactionRate, moveRate
  // Voting: voteDistribution, winningCandidate, swingVoterRate
  // SIR: susceptibleCount, infectedCount, recoveredCount, infectionRate
  // Social: opinionDistribution, consensusLevel, averageOpinionShift
  custom?: Record<string, number>;
}
```

## LLM 通信

```typescript
interface LLMRequest {
  systemPrompt: string;      // soul + 资源 + 记忆上下文
  messages: LLMMessage[];    // 对话历史
  temperature?: number;      // 默认 0.7
  maxTokens?: number;        // 默认 512
}

interface LLMResponse {
  content: string;           // 原始 LLM 输出 (JSON 格式)
  usage?: { promptTokens, completionTokens, totalTokens };
}
```

## WebSocket 消息

```typescript
// Client → Server
type WSMessageToServer =
  | { type: 'start-simulation'; config: ScenarioConfig; agents: AgentIdentity[] }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'set-speed'; speed: number };  // 0.1 ~ 10

// Server → Client
type WSMessageToClient =
  | { type: 'tick'; data: TickMetrics }
  | { type: 'simulation-started'; config: ScenarioConfig }
  | { type: 'simulation-paused' }
  | { type: 'simulation-resumed' }
  | { type: 'simulation-ended'; summary: AggregatedMetrics }
  | { type: 'error'; message: string }
  | { type: 'agent-decision'; agentId, tick, decision, reasoning };
```

## 状态机

```
SimulationStatus: 'idle' → 'running' ⇄ 'paused' → 'ended'
```

- `idle`: 初始状态，等待 start-simulation
- `running`: tick 循环执行中
- `paused`: 暂停，可 resume
- `ended`: 到达 maxTicks 或手动 stop
