---
name: gsd:manager
description: Interactive command center for managing multiple phases from one terminal
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
  - Task
---

<objective>
里程碑多阶段管理中枢，采用主 agent 纯调度模式。主 agent 仅负责展示状态、选择动作、分派子代理与汇总结果，不直接执行 discuss、plan、execute。

所有执行动作必须委派子代理完成。每轮关键结果返回后必须进入 `completion_gate`，通过 `AskUserQuestion` 或 `ask_user` 收集决策；未触发提问禁止结束。

流程内置失败、超时、部分完成的回收与二次分派规则，并统一进入 AskUserQuestion 决策分支。

**创建或更新：**

- 不直接创建文件，仅通过子代理分派既有 GSD 命令。
- 读取 `.planning/STATE.md`、`.planning/ROADMAP.md` 与阶段目录状态。

**完成后：**仅在 completion_gate 完成提问后允许退出。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/manager.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
No arguments required. Requires an active milestone with ROADMAP.md and STATE.md.

Project context, phase list, dependencies, and recommendations are resolved inside the workflow using `gsd-tools.cjs init manager`. No upfront context loading needed.
</context>

<process>
Execute the manager workflow from @~/.claude/get-shit-done/workflows/manager.md end-to-end.
Maintain the dashboard refresh loop until the user exits or all phases complete.
</process>
