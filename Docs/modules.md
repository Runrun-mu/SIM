# 模块说明

## 1. `packages/shared/` — 共享层

**零依赖**(除 Zod)，被 server 和 client 同时引用。

### types.ts
所有核心类型定义：
- `AgentIdentity` — Agent 身份 (name, age, occupation, personality, soul, wealth)
- `MemoryEntry` / `MemorySystem` — 记忆系统类型 (observation/action/reflection)
- `ResourceAttributes` — 四维资源 (wealth, health, credit, reputation) + 可扩展
- `AgentState` — 运行时完整状态 (identity + memory + resources + alive)
- `ScenarioType` — 14 种场景的字面量联合类型
- `ScenarioConfig` — 场景配置 (type, name, maxTicks, agentCount, parameters)
- `Interaction` — 交互记录 (participants, actions, outcomes)
- `TickMetrics` / `AggregatedMetrics` — 每 tick 的度量快照
- `LLMRequest` / `LLMResponse` / `LLMMessage` — LLM 通信类型
- `WSMessageToServer` / `WSMessageToClient` — WebSocket 消息类型 (discriminated union)
- `SimulationStatus` / `SimulationState` — 模拟状态机

### schemas.ts
Zod validation schemas，与 `types.ts` 一一对应，用于 WebSocket 消息校验。

### constants.ts
所有场景默认参数 + 系统常量：
- 记忆系统: `SHORT_TERM_MEMORY_LIMIT=20`, `LONG_TERM_MEMORY_LIMIT=50`, 每 5 tick 压缩
- LLM: `temperature=0.7`, `maxTokens=512`
- 模拟: `tickDelay=1000ms`, `maxTicks=20`
- 各场景收益矩阵 & 默认参数

---

## 2. `packages/server/` — 服务端

### core/agent.ts — Agent 类
每个 Agent 实例持有：
- `identity` (AgentIdentity) — 不可变身份信息
- `memory` (Memory) — 持久记忆系统实例
- `resources` (ResourceAttributes) — 可变资源属性
- `llm` (LLMAdapter) — LLM 适配器引用

关键方法：
- `perceive(observation, tick)` — 将环境观察写入短期记忆
- `decide(prompt, tick)` — 构建 system prompt (soul + 资源 + 记忆上下文) → LLM 调用 → 记录决策 → 定期压缩记忆。**含 15s 超时保护**
- `updateResources(delta)` — 增量更新资源
- `snapshot()` — 序列化当前状态

### core/memory.ts — Memory 系统
双层记忆架构：
- **短期记忆**: 最近 20 条 MemoryEntry，FIFO 淘汰
- **长期记忆**: LLM 压缩的摘要，最多 50 条
- `consolidate(llm)` — 调用 LLM 将短期记忆压缩为长期摘要，清空短期
- `toPrompt()` — 格式化输出供 LLM system prompt 注入

### core/interaction.ts — 交互工具
- `pairAgents(agents)` — Fisher-Yates 洗牌 + 两两配对 (奇数 Agent 轮空)
- `createInteraction(...)` — 构造 Interaction 记录

### core/observatory.ts — 观测器
全局度量收集器：
- `record(tick)` / `getHistory()` / `getLatest()`
- `computeSummary()` — 返回最新 tick 的聚合度量
- 静态工具: `giniCoefficient()`, `cooperationRate()`

### core/simulation-engine.ts — 模拟引擎
核心循环控制器：
- 状态机: `idle → running ⇄ paused → ended`
- `start()` — tick 循环: executeTick → computeMetrics → notify callback → delay。**单 tick 失败不崩溃**
- `pause()` / `resume()` / `stop()` / `setTickDelay()`

### llm/ — LLM 适配层
- `types.ts` — `LLMAdapter` 接口 (generate method)
- `adapter.ts` — `RealLLMAdapter` (Vercel AI SDK → OpenAI/Anthropic)
- `mock-adapter.ts` — `MockLLMAdapter` (4 策略: random/always-cooperate/always-defect/tit-for-tat，覆盖全部 14 场景响应格式)
- `index.ts` — 工厂函数 `createLLMAdapter()`，无 API key 时自动降级到 mock

### scenarios/ — 14 场景实现
每个场景一个目录，含:
- `config.ts` — `createXXXConfig()` 工厂 + 默认参数
- `environment.ts` — 实现 `ScenarioEnvironment` 接口 (`executeTick` + `computeMetrics`)

场景执行模式：
- **Paired**: 两两配对 → 各自 LLM 决策 → 收益计算 → 资源更新 (PD, Wealth, Ultimatum, Dictator, Hawk-Dove, Trust, Axelrod)
- **Group**: 所有 Agent 同时决策 → 全局收益计算 (Public Goods, Minority, Tragedy, Voting)
- **Network**: Agent 间存在空间/网络拓扑 → 局部交互 (Schelling, SIR, Social Influence)

### ws/handler.ts — WebSocket 处理器
每个 WS 连接创建一个 `SimulationHandler` 实例：
- 解析/校验消息 (Zod schema)
- 路由: start-simulation / pause / resume / stop / set-speed
- `createEnvironment(config)` — switch-case 分发到 14 种 Environment 实例
- 每 tick 回调: observatory.record → ws.send(tick data)

### index.ts — 服务入口
Fastify 5 + @fastify/websocket，端口 3001。

---

## 3. `packages/client/` — 前端

### stores/simulation.ts — Zustand Store
全局状态中心：
- Config: scenarioType, config, agents
- Runtime: status, currentTick, tickHistory, decisions, summary
- Actions: CRUD agents, handleWSMessage (解析 7 种 WS 事件)

### stores/ui.ts — UI Store
UI 层级状态 (面板开关等)。

### pages/
| 页面 | 功能 |
|------|------|
| `ScenarioSelect.tsx` | 14 场景卡片网格，含图标/描述/默认 Agent 数 |
| `CharacterCreate.tsx` | Agent 创建/编辑表单，4 个预设 (Alice/Bob/Carol/Dave)，支持 soul prompt 编辑 |
| `Simulation.tsx` | 主模拟页: 3D场景(左) + Timeline(右) + Dashboard(下) + ControlBar(上) |
| `MultiDashboard.tsx` | 多场景运行对比面板，localStorage 持久化 |

### scene/
- `AgentGraph.tsx` — R3F Canvas 容器，圆形排列 agents，交互连线，星空背景
- `AgentNode.tsx` — 单个 Agent 3D 节点: glTF 角色模型 (Quaternius CC0 包)，djb2 哈希确定性选模型，MeshToonMaterial，浮动动画，选中光环，名称标签

### ui/
- `ControlBar.tsx` — 顶部控制栏 (暂停/继续/停止/速度)
- `Dashboard.tsx` — 底部图表面板 (Recharts)
- `Timeline.tsx` — 右侧 tick 时间线
- `CharacterPanel.tsx` — 选中 Agent 详情面板
