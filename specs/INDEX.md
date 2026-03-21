# Group Dynamics Simulator — Spec Index

## 项目概览

Multi-Agent 群体动力学模拟系统，LLM 驱动 Agent 决策，模拟囚徒困境、财富分配等场景。

## 架构

- **Monorepo**: Turborepo 编排
- **Runtime**: Bun (运行时 + 包管理 + 测试)
- **后端**: Fastify + WebSocket + Vercel AI SDK
- **前端**: React 19 + Vite + React Three Fiber + Zustand + Tailwind
- **LLM**: OpenAI GPT-4o-mini (默认), 支持多模型切换

## 目录结构

```
packages/
  shared/     — 共享类型 + Zod schema
  server/     — 模拟引擎 + LLM 适配 + WebSocket API
  client/     — 3D 可视化前端
specs/        — 规范文档
```

## 相关文档

- [开发规范](./dev-conventions.md)
- [CI/CD 流程](./ci-cd.md)
- [今日任务](./daily-tasks/2026-03-22.md)

## 当前进度

- [x] Phase 0: 基础建设 (脚手架 + CI/CD)
- [ ] Phase 1: 后端核心框架
- [ ] Phase 2: 场景实现
- [ ] Phase 3: 前端
- [ ] Phase 4: 联调
