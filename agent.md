# Group Dynamics Simulator — 项目索引

> LLM 驱动的多 Agent 群体动力学模拟平台
> Bun + Turborepo · Fastify 5 + WebSocket · React 19 + R3F · Zustand · 14 博弈场景

---

## 快速启动

```bash
bun install          # 安装依赖
bun run dev          # 启动 server (3001) + client (5173)
bun run typecheck    # 全 workspace 类型检查
bun run test         # 运行测试
```

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [技术规格](Docs/spec.md) | 技术栈、Workspace 结构、14 场景清单、端口路由 |
| [模块说明](Docs/modules.md) | shared/server/client 三层模块详解 |
| [数据结构](Docs/data-structures.md) | 核心类型定义 (Agent, Scenario, Interaction, Metrics, WS) |
| [关键链路](Docs/critical-paths.md) | 7 条核心链路时序图 (启动→tick→决策→记忆→推送→降级→渲染) |
| [美术资源](Docs/art-assets.md) | Quaternius 45 种低多边形角色清单 + 加载方式 |

---

## 目录结构

```
sim/
├── package.json                # Bun workspaces root
├── turbo.json                  # Turborepo 任务定义
├── biome.json                  # Biome lint 配置
├── tsconfig.base.json          # 共享 TS 配置
├── specs/                      # 需求规格 (原始)
├── bug/                        # Bug 跟踪 (bug1~5.md)
├── rawasset/                   # 原始美术资源 (Quaternius CC0 角色包)
├── Docs/                       # 技术文档
│   ├── spec.md
│   ├── modules.md
│   ├── data-structures.md
│   ├── critical-paths.md
│   └── art-assets.md
├── .claude/commands/           # Claude Code 自定义命令
│   ├── bugfix.md               # /bugfix — 自动扫描修复 bug
│   ├── bugProcess.md           # /bugProcess — 创建 bug 报告 + 触发修复
│   └── artparser.md            # /artparser — 美术资源解析与索引
│
└── packages/
    ├── shared/                 # @sim/shared — 零依赖共享层
    │   └── src/
    │       ├── types.ts        # 全部核心类型
    │       ├── schemas.ts      # Zod 校验 schemas
    │       ├── constants.ts    # 默认参数 & 常量
    │       └── index.ts        # Barrel export
    │
    ├── server/                 # @sim/server — 模拟引擎
    │   └── src/
    │       ├── index.ts        # Fastify 服务入口
    │       ├── core/
    │       │   ├── agent.ts        # Agent 类 (soul+memory+decide)
    │       │   ├── memory.ts       # 双层记忆 (短期20+长期50+LLM压缩)
    │       │   ├── interaction.ts  # 配对 & 交互记录
    │       │   ├── observatory.ts  # 度量收集 (Gini/合作率)
    │       │   └── simulation-engine.ts  # tick 循环引擎
    │       ├── llm/
    │       │   ├── types.ts        # LLMAdapter 接口
    │       │   ├── adapter.ts      # RealLLMAdapter (Vercel AI SDK)
    │       │   ├── mock-adapter.ts # MockLLMAdapter (4策略×14场景)
    │       │   └── index.ts        # 工厂 + 自动降级
    │       ├── scenarios/          # 14 场景实现
    │       │   ├── base.ts         # ScenarioFactory 接口
    │       │   ├── prisoners-dilemma/
    │       │   ├── wealth-distribution/
    │       │   ├── public-goods/
    │       │   ├── ultimatum-game/
    │       │   ├── dictator-game/
    │       │   ├── hawk-dove/
    │       │   ├── trust-game/
    │       │   ├── minority-game/
    │       │   ├── tragedy-of-commons/
    │       │   ├── axelrod-tournament/
    │       │   ├── schelling-segregation/
    │       │   ├── voting-model/
    │       │   ├── sir-epidemic/
    │       │   └── social-influence/
    │       └── ws/
    │           └── handler.ts      # WebSocket 消息路由
    │
    └── client/                 # @sim/client — React 前端
        ├── public/
        │   └── models/characters/  # → symlink → rawasset glTF
        └── src/
            ├── App.tsx             # React Router (4 routes)
            ├── main.tsx            # 入口
            ├── pages/
            │   ├── ScenarioSelect.tsx   # 场景选择 (14卡片)
            │   ├── CharacterCreate.tsx  # Agent 创建 (4预设)
            │   ├── Simulation.tsx       # 模拟主页面
            │   └── MultiDashboard.tsx   # 多场景对比
            ├── scene/
            │   ├── AgentGraph.tsx       # R3F Canvas + 场景
            │   └── AgentNode.tsx        # 单 Agent 3D 节点 (glTF)
            ├── stores/
            │   ├── simulation.ts        # Zustand 主 store
            │   └── ui.ts               # UI 状态
            └── ui/
                ├── ControlBar.tsx
                ├── Dashboard.tsx
                ├── Timeline.tsx
                └── CharacterPanel.tsx
```

---

## 架构总览

```
┌─────────────────────────────────────────────────────┐
│                    Client (React 19)                 │
│  ScenarioSelect → CharacterCreate → Simulation      │
│      ↓ Zustand Store                                 │
│  AgentGraph (R3F) ← ─ ─ WebSocket ─ ─ ─ ─ ─ ─ ─┐  │
│  Dashboard (Recharts)                             │  │
│  Timeline / CharacterPanel                        │  │
└───────────────────────────────────────────────────┼──┘
                                                    │
┌───────────────────────────────────────────────────┼──┐
│                    Server (Fastify 5)             │  │
│  WebSocket Handler ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│      ↓                                               │
│  SimulationEngine (tick loop)                        │
│      ↓                                               │
│  ScenarioEnvironment (14 场景插件)                    │
│      ↓                                               │
│  Agent.decide() → LLMAdapter                         │
│      ↓               ↓                               │
│  Memory System    Real / Mock LLM                    │
│  (短期+长期+压缩)                                     │
└──────────────────────────────────────────────────────┘
```

---

## Bug 跟踪

| Bug | 状态 | 描述 |
|-----|------|------|
| [bug1](bug/bug1.md) | ✅ 已修复 | 端口 5173 占用 |
| [bug2](bug/bug2.md) | ✅ 已修复 | R3F v8 + React 19 不兼容 → 升级 R3F 9.5 |
| [bug3](bug/bug3.md) | ✅ 已修复 | 模拟停滞 → LLM 无 key 自动降级 + 15s 超时 |
| [bug4](bug/bug4.md) | ✅ 已修复 | 八面体线框 → glTF 角色模型 |
| [bug5](bug/bug5.md) | 空 | — |
| [bug6](bug/bug6.md) | ✅ 已修复 | Timeline: agent 名字 + tick 选择 + 14 场景指标 |
| [bug7](bug/bug7.md) | ✅ 已修复 | 场景光照提升 + Agent 交互动画 (光束+弹跳+发光) |

---

## 美术资源

| 资源包 | 类型 | 风格 | 数量 | 许可证 | 索引 |
|--------|------|------|------|--------|------|
| Quaternius Character Pack | 角色 (Character) | 低多边形卡通 | 45 种模型 | CC0 | [详情](rawasset/Ultimate%20Animated%20Character%20Pack%20-%20Nov%202019/art-index.md) |
| KayKit Block Bits 1.0 | 场景方块 (Block) | 体素像素风 | 40 种方块 | CC0 | [详情](rawasset/KayKit_BlockBits_1.0_FREE/art-index.md) |

### 资源用途速查

- **Agent 3D 模型**: Quaternius 角色包 → `AgentNode.tsx` (djb2 hash 确定性分配)
- **场景地形**: KayKit Block Bits → grass/dirt/sand/stone 方块组合
- **资源/矿石标记**: Block Bits → stone_with_gold/silver/copper
- **区域标记**: Block Bits → colored_block 系列 (红/蓝/绿/黄)
- **环境装饰**: Block Bits → tree/water/lava
