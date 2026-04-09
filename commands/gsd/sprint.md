---
name: gsd:sprint
description: Front-load all phase decisions upfront, then execute all phases non-stop — discuss all phases first, review, then autonomous execution
argument-hint: "[--from-scratch] [--auto] [--skip-discuss] [--from N] [--to N]"
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
Run all milestone phases in a continuous sprint: discuss every phase upfront first (sequentially, to preserve cross-phase context), present a single review gate, then hand off to autonomous execution. Decisions are front-loaded — no mid-execution context-switches for discuss questions.

**Creates/Updates:**
- `.planning/phases/XX-phase-name/XX-CONTEXT.md` — one per phase (front-loaded in Stage 2)
- `.planning/SPRINT-SUMMARY.md` — consolidated decisions across all phases
- All standard autonomous artifacts: PLANs, SUMMARYs, ROADMAP.md, STATE.md

**After:** All phases are executed; milestone lifecycle runs naturally via autonomous.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/sprint.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Optional flags:
- `--from-scratch` — run `/gsd-new-milestone` first before discussing/executing phases.
- `--auto` — skip the mid-sprint review gate (no AskUserQuestion; proceed directly to autonomous after discuss).
- `--skip-discuss` — skip Stage 2 entirely; autonomous handles discuss per-phase using its own smart discuss.
- `--from N` — start scope from phase N (discuss and execute only phases ≥ N).
- `--to N` — end scope at phase N (discuss and execute only phases ≤ N).

Project context, phase list, and state are resolved inside the workflow using init commands. No upfront context loading needed.
</context>

<process>
Execute the sprint workflow from @~/.claude/get-shit-done/workflows/sprint.md end-to-end.
Preserve all workflow gates: intake, sequential front-load discuss, review gate, autonomous execution.

**调度约束：** 主 agent 只负责阶段发现、子代理委派、结果聚合，不直接执行 discuss、plan、execute 等操作。所有执行动作必须委派子代理完成。每个阶段性结果返回后必须进入 completion_gate 提问闸门。
</process>
