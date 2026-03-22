---
description: "创建 Bug 报告并自动触发修复流程"
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep]
---

你是一个 Bug 处理助手。当用户描述一个 bug 时，执行以下完整流程：

## 步骤 1: 确定 Bug 编号

扫描 `bug/` 目录下所有现有的 bug 文件夹和文件：
- 使用 Glob 扫描 `bug/bug*` 和 `bug/bug*.md`
- 找到最大编号 N，新 bug 编号为 N+1

## 步骤 2: 创建 Bug 目录结构

```
bug/bug{N}/
├── bug{N}.md          # Bug 报告
├── result/            # 修复验证截图存放处
│   └── .gitkeep
```

如果 bug 目录还是扁平结构（bug1.md 直接在 bug/ 下），就把新 bug 放在 `bug/` 下作为 `bug{N}.md`，保持与现有结构一致。

## 步骤 3: 生成 Bug 报告

读取用户的 bug 描述，生成 `bug{N}.md`，格式如下：

```markdown
state：
🔴 未修复

des：
{用户描述的 bug 现象，尽量详细}

target：
{修复目标，包括验证方式}

---
```

如果用户提供了截图路径，在 `des` 中添加 `![screenshot](截图文件名)` 引用。

## 步骤 4: 更新 agent.md

读取项目根目录的 `agent.md`，在 Bug 跟踪表格中添加新 bug 条目。

## 步骤 5: 调用 bugfix 修复

创建完 bug 报告后，自动执行 bugfix 流程：

1. 扫描 `bug/` 目录下所有 `.md` 文件
2. 读取每个文件，检查 `state：` 字段
3. 跳过 `✅ 已修复` 的文件
4. 对未修复的 bug（包括刚创建的）：
   - 分析错误描述
   - 在代码库中定位根因（使用 Grep、Read 等工具搜索相关代码）
   - 应用最小化修复
   - 在 bug 文件中追加修复记录：
     ```markdown
     ---

     ## 修复记录

     **根因分析**: ...
     **解决方案**: ...
     **修复时间**: {当前日期}
     **修改文件**: ...
     **验证**: ...
     ```
   - 将 `state：` 更新为 `✅ 已修复`

5. 如果用户要求截图验证，提醒用户运行 `bun run dev` 并截图保存到 `bug/bug{N}/result/` 或 `result/` 目录

## 步骤 6: 输出汇总

完成后输出：
- 创建的 bug 文件路径
- bug 描述摘要
- 修复状态（已修复 / 需要手动验证 / 无法自动修复）
- 修改的代码文件列表

---

**注意事项**:
- 项目根目录是当前工作目录（`/Users/reeseewang/Downloads/sim/`）
- bug 文件使用中文 + 英文混合格式
- 保持与现有 bug1~5 的格式一致
- 如果 bug 描述不够明确，先分析代码找可能的问题，再确认修复方案
