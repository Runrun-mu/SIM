# Group Dynamics Simulator — 技术规格

## 项目概述

LLM 驱动的多 Agent 群体动力学模拟平台。每个 Agent 拥有独立人格(soul prompt)、持久记忆系统(短期/长期 + LLM 压缩)，在 14 种经典博弈论场景中做出决策，通过 WebSocket 实时推送到 3D 可视化前端。

## 技术栈

| 层 | 技术 |
|----|------|
| Runtime | Bun 1.3.11 |
| Monorepo | Turborepo 2.x + Bun Workspaces |
| Server | Fastify 5 + @fastify/websocket |
| Client | React 19 + Vite |
| 3D | React Three Fiber 9.5 + drei |
| 状态管理 | Zustand 5 |
| Validation | Zod |
| Lint | Biome |
| TypeScript | 5.6+ (strict) |

## Workspace 结构

```
packages/
  shared/     — 类型定义、Zod schemas、常量 (零运行时依赖)
  server/     — Fastify HTTP/WS 服务、模拟引擎、14 场景、LLM 适配层
  client/     — React SPA、3D 场景渲染、UI 面板、Zustand store
```

## 14 场景清单

| 场景 | 类型 | Agent 数 | 核心指标 |
|------|------|---------|----------|
| Prisoner's Dilemma | paired | 4 | cooperationRate, strategyDistribution |
| Wealth Distribution | paired | 6 | giniCoefficient, wealthDistribution |
| Public Goods | group | 6 | averageContribution, freeRiderRatio |
| Ultimatum Game | paired | 4 | averageOffer, rejectionRate |
| Dictator Game | paired | 4 | averageDictatorOffer, generosityRate |
| Hawk-Dove | paired | 4 | hawkRate, conflictRate |
| Trust Game | paired | 4 | averageInvestment, trustIndex |
| Minority Game | group | 7 | minorityChoice, switchRate |
| Tragedy of Commons | group | 6 | resourcePool, sustainabilityIndex |
| Axelrod Tournament | paired | 4 | tournamentScores, dominantStrategy |
| Schelling Segregation | network | 8 | segregationIndex, satisfactionRate |
| Voting Model | group | 7 | voteDistribution, winningCandidate |
| SIR Epidemic | network | 10 | susceptible/infected/recovered |
| Social Influence | network | 8 | consensusLevel, opinionDistribution |

## 端口 & 路由

- **Server**: `http://localhost:3001`
  - `GET /health` — 健康检查
  - `GET /api/scenarios` — 场景列表
  - `WS /ws` — 模拟控制 & 实时推送

- **Client**: `http://localhost:5173` (Vite dev)
  - `/` — 场景选择
  - `/characters` — Agent 创建/编辑
  - `/simulation` — 3D 模拟 + 仪表盘
  - `/dashboard` — 多场景对比面板
