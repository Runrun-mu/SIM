# CI/CD 流程

## 本地 (Pre-commit)

```
git commit → husky → biome check → tsc --noEmit → bun test → 允许提交
```

快捷命令: `bun run ci`

## GitHub Actions

```
push/PR → bun install → biome check → typecheck → bun test → build → ✅/❌
```

配置文件: `.github/workflows/ci.yml`

## 全量 CI

每 10 次提交执行: `bun run ci:full` (lint + typecheck + test + build)

## 遇到的 CI/CD 问题

| 日期 | 问题 | 解决方案 |
|------|------|----------|
| (暂无) | | |
