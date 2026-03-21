# 开发规范

## 代码风格

- **Biome**: lint + format 合一 (比 ESLint+Prettier 快 35x)
- 单引号, 分号, 2 空格缩进, 100 字符行宽
- `biome check` 统一检查

## 提交规范

- **Conventional Commits**: `feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`
- 每次提交必须包含相关测试用例
- 每次提交前执行: `bun run ci` (biome check → typecheck → test)
- 每次提交更新 specs/ 下的相关文档
- 每次 daily task 完成后提交一次 + 跑全量测试

## 测试策略

- Mock 优先: `LLM_MOCK=true` 跑通所有流程
- 真实 API: `LLM_MOCK=false` 手动验证
- Bun test 内置测试框架

## Git Hooks

- `pre-commit`: biome check → typecheck → test (via Husky)

## Daily Task 规范

- 每天至少一个 UI/体验优化
- 每天至少添加一个新场景 case
- 完成后浏览器截图验证全流程
- 更新 specs/daily-tasks/ 下的当日任务文档
- 总结发现的 bug 和改进点到下一天的任务

## Bug 记录

记录 CI/CD 过程中遇到的问题和解决方案。

| 日期 | 问题 | 解决方案 |
|------|------|----------|
| 2026-03-22 | Turborepo 需要 packageManager 字段 | 在 root package.json 添加 |
| 2026-03-22 | server tsconfig 使用了 bun-types | 改为 @types/bun |
| 2026-03-22 | R3F v8 JSX 类型缺失 | ThreeElements 全局扩展 + @ts-nocheck |
| 2026-03-22 | Biome a11y 误报 3D mesh | 关闭 useKeyWithClickEvents 规则 |
