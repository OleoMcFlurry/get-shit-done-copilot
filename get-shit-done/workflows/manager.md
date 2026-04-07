<purpose>

里程碑单终端调度中枢。主 agent 仅负责看板展示、动作选择、子代理分派与结果汇总，不直接执行 discuss、plan、execute、verify、complete。每轮关键结果返回后必须进入 completion_gate，调用 AskUserQuestion 或 ask_user 决策后才可继续或结束。

</purpose>

<required_reading>

Read all files referenced by the invoking prompt's execution_context before starting.

</required_reading>

<process>

<step name="initialize" priority="first">

## 1. Initialize

Bootstrap via manager init:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init manager)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `milestone_version`, `milestone_name`, `phase_count`, `completed_count`, `in_progress_count`, `phases`, `recommended_actions`, `all_complete`, `waiting_signal`, `manager_flags`.

`manager_flags` contains per-step passthrough flags from config:

- `manager_flags.discuss` — appended to `/gsd-discuss-phase` args (e.g. `"--auto --analyze"`)
- `manager_flags.plan` — appended to plan agent init command
- `manager_flags.execute` — appended to execute agent init command

These are empty strings by default. Set via: `gsd-tools config-set manager.flags.discuss "--auto --analyze"`

**If error:** Display the error message and exit.

Display startup banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MANAGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 {milestone_version} — {milestone_name}
 {phase_count} phases · {completed_count} complete

 ✓ Discuss/Plan/Execute → delegated agents
 Dashboard auto-refreshes when background work is active.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Proceed to dashboard step.

主 agent 调度约束：

1. 主 agent 只调度，不直接执行实现动作。
2. discuss、plan、execute、verify、complete 一律委派子代理。
3. 任一关键结果返回后必须先进入 `completion_gate`。

</step>

<step name="dashboard">

## 2. Dashboard (Refresh Point)

**Every time this step is reached**, re-read state from disk to pick up changes from background agents:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init manager)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse the full JSON. Build the dashboard display.

Build dashboard from JSON. Symbols: `✓` done, `◆` active, `○` pending, `·` queued. Progress bar: 20-char `█░`.

**Status mapping** (disk_status → D P E Status):

- `complete` → `✓ ✓ ✓` `✓ Complete`
- `partial` → `✓ ✓ ◆` `◆ Executing...`
- `planned` → `✓ ✓ ○` `○ Ready to execute`
- `discussed` → `✓ ○ ·` `○ Ready to plan`
- `researched` → `◆ · ·` `○ Ready to plan`
- `empty`/`no_directory` + `is_next_to_discuss` → `○ · ·` `○ Ready to discuss`
- `empty`/`no_directory` otherwise → `· · ·` `· Up next`
- If `is_active`, replace status icon with `◆` and append `(active)`

If any `is_active` phases, show: `◆ Background: {action} Phase {N}, ...` above grid.

Use `display_name` (not `name`) for the Phase column — it's pre-truncated to 20 chars with `…` if clipped. Pad all phase names to the same width for alignment.

Use `deps_display` from init JSON for the Deps column — shows which phases this phase depends on (e.g. `1,3`) or `—` for none.

Example output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ████████████░░░░░░░░ 60%  (3/5 phases)
 ◆ Background: Planning Phase 4
 | # | Phase                | Deps | D | P | E | Status              |
 |---|----------------------|------|---|---|---|---------------------|
 | 1 | Foundation           | —    | ✓ | ✓ | ✓ | ✓ Complete          |
 | 2 | API Layer            | 1    | ✓ | ✓ | ◆ | ◆ Executing (active)|
 | 3 | Auth System          | 1    | ✓ | ✓ | ○ | ○ Ready to execute  |
 | 4 | Dashboard UI & Set…  | 1,2  | ✓ | ◆ | · | ◆ Planning (active) |
 | 5 | Notifications        | —    | ○ | · | · | ○ Ready to discuss  |
 | 6 | Polish & Final Mail… | 1-5  | · | · | · | · Up next           |
```

**Recommendations section:**

If `all_complete` is true:

```
╔══════════════════════════════════════════════════════════════╗
║  MILESTONE COMPLETE                                          ║
╚══════════════════════════════════════════════════════════════╝

All {phase_count} phases done. Ready for final steps:
  → /gsd-verify-work — run acceptance testing
  → /gsd-complete-milestone — archive and wrap up
```

Ask user via AskUserQuestion:

- **question:** "All phases complete. What next?"
- **options:** "Verify work" / "Complete milestone" / "Exit manager"

处理分支：

- "Verify work"：仅分派子代理执行。
  ```
  Task(
    description="里程碑验收",
    run_in_background=true,
    prompt="执行 gsd-verify-work：Skill(skill=\"gsd-verify-work\")"
  )
  ```
  子代理返回后进入 `completion_gate`，再回到 dashboard。
- "Complete milestone"：仅分派子代理执行。
  ```
  Task(
    description="完成里程碑",
    run_in_background=true,
    prompt="执行 gsd-complete-milestone：Skill(skill=\"gsd-complete-milestone\")"
  )
  ```
  子代理返回后进入 `completion_gate`，再决定是否退出。
- "Exit manager"：进入 `completion_gate` 后再进入 exit step。

**If NOT all_complete**, build compound options from `recommended_actions`:

**组合动作逻辑：**将后台动作（plan/execute）与 discuss 子代理动作统一组合，所有动作均通过子代理执行，主 agent 仅负责调度。

**Building options:**

1. Collect all background actions (execute and plan recommendations) — there can be multiple of each.
2. Collect discuss action (if any) — it must also run via a delegated sub-agent.
3. Build compound options:

   **If there are ANY recommended actions (background, discuss, or both):**
   Create ONE primary "Continue" option that dispatches ALL of them together:

   - Label: `"Continue"` — always this exact word
   - Below the label, list every action that will happen. Enumerate ALL recommended actions — do not cap or truncate:
     ```
     Continue:
       → Execute Phase 32 (background)
       → Plan Phase 34 (background)
       → Discuss Phase 35 (agent)
     ```
   - This dispatches all actions via sub-agents.
   - If discuss is included, wait for discuss sub-agent result, then refresh dashboard.

   **Important:** The Continue option must include EVERY action from `recommended_actions` — not just 2. If there are 3 actions, list 3. If there are 5, list 5.

4. Always add:
   - `"Refresh dashboard"`
   - `"Exit manager"`

Display recommendations compactly:

```
───────────────────────────────────────────────────────────────
▶ Next Steps
───────────────────────────────────────────────────────────────

Continue:
  → Execute Phase 32 (background)
  → Plan Phase 34 (background)
  → Discuss Phase 35 (agent)
```

**Auto-refresh:** If background agents are running (`is_active` is true for any phase), set a 60-second auto-refresh cycle. After presenting the action menu, if no user input is received within 60 seconds, automatically refresh the dashboard. This interval is configurable via `manager_refresh_interval` in GSD config (default: 60 seconds, set to 0 to disable).

Present via AskUserQuestion:

- **question:** "What would you like to do?"
- **options:** (compound options as built above + refresh + exit, AskUserQuestion auto-adds "Other")

**On "Other" (free text):** Parse intent — if it mentions a phase number and action, dispatch accordingly. If unclear, display available actions and loop to action_menu.

Proceed to handle_action step with the selected action.

</step>

<step name="handle_action">

## 4. Handle Action

### Refresh Dashboard

Loop back to dashboard step.

### Exit Manager

Go to exit step.

### Compound Action

当选择组合动作时：

1. 先并行分派全部后台动作。
2. discuss 也必须通过子代理分派，不允许主 agent 直执。

```
Task(
  description="Discuss phase {PHASE_NUM}: {phase_name}",
  run_in_background=true,
  prompt="Skill(skill=\"gsd-discuss-phase\", args=\"{PHASE_NUM} {manager_flags.discuss}\")"
)
```

所有子代理返回后统一进入 `completion_gate`，再回 dashboard。

### 计划阶段 N

计划阶段仅允许子代理执行：

```
Task(
  description="计划阶段 {N}: {phase_name}",
  run_in_background=true,
  prompt="执行第 {N} 阶段计划流程。

工作目录：{cwd}
阶段：{N} — {phase_name}
目标：{goal}
管理参数：{manager_flags.plan}

执行：Skill(skill=\"gsd-plan-phase\", args=\"{N} --auto {manager_flags.plan}\")

若出现阻塞、超时、部分完成，写入 STATE.md 后停止。"
)
```

显示分派提示后，不直接结束，等待结果进入 `completion_gate`。

### 执行阶段 N

执行阶段仅允许子代理执行：

```

Task(
description="执行阶段 {N}: {phase_name}",
run_in_background=true,
prompt="执行第 {N} 阶段实施流程。

工作目录：{cwd}
阶段：{N} — {phase_name}
目标：{goal}
管理参数：{manager_flags.execute}

执行：Skill(skill=\"gsd-execute-phase\", args=\"{N} {manager_flags.execute}\")

若出现阻塞、超时、部分完成，写入 STATE.md 后停止。"
)

```

显示分派提示后，不直接结束，等待结果进入 `completion_gate`。

</step>

<step name="background_completion">

## 5. Background Agent Completion

当后台子代理返回结果时：

1. 读取子代理结果。
2. 输出简要通知。
3. 必须进入 `completion_gate`。

若结果为失败、超时、部分完成或阻塞，统一进入 AskUserQuestion 决策分支：

- **question:** "Phase {N} 返回 {result_type}：{error}，如何处理？"
- **options:** "回收并二次分派" / "直接重试" / "跳过并继续" / "查看详情"

处理规则：

1. 回收并二次分派：先回收 `STATE.md` 当前阶段未完成项，再重派同动作子代理。
2. 直接重试：直接重派同动作子代理。
3. 跳过并继续：保留当前阶段状态并回 dashboard。
4. 查看详情：读取 `STATE.md` 阻塞段并重新展示决策。

任何路径都不得绕过 `completion_gate`。

</step>

<step name="exit">

## 6. Exit

退出前必须进入 `completion_gate` 并完成提问确认。

显示最终状态：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SESSION END
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 {milestone_version} — {milestone_name}
 {PROGRESS_BAR} {progress_pct}%  ({completed_count}/{phase_count} phases)

 Resume anytime: /gsd-manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

若仍有后台子代理运行，保留提示信息并允许后续回读。

</step>

<step name="completion_gate">

## 7. Completion Gate

任一关键结果返回时，主 agent 必须先提问，不得直接结束流程。

统一调用 AskUserQuestion 或 ask_user：

- **question:** "关键结果已返回：{gate_reason}。请选择后续动作。"
- **options:** "继续主流程" / "查看详情后继续" / "停止并退出"

规则：

1. 未 ask 不得结束。
2. 选择继续后跳转到调用方指定步骤。
3. 选择停止后先输出摘要再退出。

</step>

</process>

<success_criteria>

- [ ] Dashboard displays all phases with correct status indicators (D/P/E/V columns)
- [ ] Progress bar shows accurate completion percentage
- [ ] Dependency resolution: blocked phases show which deps are missing
- [ ] Recommendations prioritize: execute > plan > discuss
- [ ] Discuss phases run via delegated Task agents — interactive questions are handled by discuss sub-agents
- [ ] Plan phases spawn background Task agents — return to dashboard immediately
- [ ] Execute phases spawn background Task agents — return to dashboard immediately
- [ ] Dashboard refreshes pick up changes from background agents via disk state
- [ ] Background agent completion triggers notification and dashboard refresh
- [ ] Background agent errors present retry/skip options
- [ ] All-complete state offers verify-work and complete-milestone
- [ ] Exit shows final status with resume instructions
- [ ] "Other" free-text input parsed for phase number and action
- [ ] Manager loop continues until user exits or milestone completes
      </success_criteria>
