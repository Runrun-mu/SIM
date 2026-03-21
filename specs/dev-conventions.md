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

## 测试策略

- Mock 优先: `LLM_MOCK=true` 跑通所有流程
- 真实 API: `LLM_MOCK=false` 手动验证
- Bun test 内置测试框架

## Git Hooks

- `pre-commit`: biome check → typecheck → test (via Husky)

## Bug 记录

记录 CI/CD 过程中遇到的问题和解决方案。

| 日期 | 问题 | 解决方案 |
|------|------|----------|
| (暂无) | | |
