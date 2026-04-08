---
name: gsd:autonomous
description: Run all remaining phases autonomously — discuss→plan→execute per phase
argument-hint: "[--from N] [--to N] [--only N] [--interactive]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
以主 agent 调度模式执行里程碑剩余阶段。主 agent 只负责阶段发现、任务分派、结果汇总与用户决策，不直接执行 discuss、plan、execute、review、lifecycle 等动作。

所有执行动作必须委派子代理完成。每轮关键结果返回后必须进入 `completion_gate`，通过 `AskUserQuestion` 或 `ask_user` 收集决策；未触发提问禁止结束流程。

失败、超时、部分完成均进入 AskUserQuestion 决策分支，按用户选择执行回收、重试、二次分派或停止。

**创建或更新：**

- `.planning/STATE.md`：每阶段后更新状态
- `.planning/ROADMAP.md`：每阶段后更新进度
- 阶段产物：每阶段 CONTEXT、PLAN、SUMMARY、VERIFICATION

**完成后：**流程进入里程碑生命周期收尾，且收尾前必须经过 completion_gate。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/autonomous.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`. They are equivalent for the completion gate and blocker decision branches.
</runtime_note>

<context>
Optional flags:
- `--from N` — start from phase N instead of the first incomplete phase.
- `--to N` — stop after phase N completes (halt instead of advancing to next phase).
- `--only N` — execute only phase N (single-phase mode).
- `--interactive` — 通过子代理执行 discuss 并保留交互提问；plan→execute 继续以后台子代理执行，主上下文保持精简。

Project context, phase list, and state are resolved inside the workflow using init commands (`gsd-tools.cjs init milestone-op`, `gsd-tools.cjs roadmap analyze`). No upfront context loading needed.
</context>

<process>
Execute the autonomous workflow from @~/.claude/get-shit-done/workflows/autonomous.md end-to-end.
Preserve all workflow gates (phase discovery, per-phase execution, blocker handling, progress display).
</process>
