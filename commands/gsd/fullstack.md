---
name: gsd:fullstack
description: Full-stack development orchestrator — 7-stage lifecycle from discuss to commit. Manages Init→Discuss→Plan→Dev→Refine→Test→Review→Commit with per-stage gates, auto-mode, and resume support.
argument-hint: "[--auto] [--skip-refine] [--skip-test] [--skip-review] [--resume] [--stage N]"
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
Run a complete full-stack development lifecycle for the current milestone phase. Orchestrates 7 stages: Init → Discuss → Plan → Dev → Refine → Test → Review → Commit, with optional Milestone Complete.

Each stage has a single user interaction gate (ask_user). Auto-mode (`--auto`) skips stage gates and runs fully unattended until completion.

**Creates/Updates:**
- `FULLSTACK-STATE.md` — persistent stage progress tracker
- `.planning/phases/{NN}-{slug}/` — standard GSD phase artifacts (PLAN.md, SUMMARY.md)
- `git tag gsd/stage-N-*` — per-stage safety snapshots

**After:** All stages complete; optionally triggers milestone archival.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/fullstack.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Optional flags:
- `--auto` — enable 全自动模式; skip all stage entry/exit ask_user gates; runs end-to-end unattended.
- `--skip-refine` — skip Stage 4 (Code Refinement) entirely.
- `--skip-test` — skip Stage 5 (Test & Verify) entirely.
- `--skip-review` — skip Stage 6 (Code Review) entirely.
- `--resume` — resume from last saved stage in FULLSTACK-STATE.md; skip completed stages.
- `--stage N` — start from a specific stage number (0-7); useful for re-running a single stage.

Project context, phase list, and state are resolved inside the workflow using init commands. No upfront context loading needed.
</context>

<process>
Execute the fullstack workflow from @~/.claude/get-shit-done/workflows/fullstack.md end-to-end.

Preserve all workflow gates: stage entry confirmations, wave execution, ask_user stage transitions, end-task double-confirm.

**调度约束：** 主 agent 只负责阶段发现、子代理委派、结果聚合，不直接执行 discuss、plan、execute 等操作。所有执行动作必须委派子代理完成。每个阶段性结果返回后必须进入 ask_user 闸门（除非 auto_mode == true）。
</process>
