# Completion Gate Protocol

A conditional end-of-session hook that keeps the main agent alive after each command completes,
allowing users to chain multiple tasks in a single billing session.

## When This Fires

Only fires at the **success completion path** of main-command workflows (final step).
Does NOT fire after sub-agent returns or mid-workflow.

## Behavior

**Step 1 — Check config:**
```bash
GATE_ENABLED=$(gsd-sdk query config.get workflow.completion_gate 2>/dev/null || gsd-tools.cjs config-get workflow.completion_gate 2>/dev/null || echo "")
```

If `GATE_ENABLED` is explicitly `"false"`, exit — do nothing. Workflow ends normally.
If `GATE_ENABLED` is empty (key not set) or any other value, proceed — gate fires by default.

**Step 2 — Load project state:**
```bash
INIT=$(gsd-sdk query init.status 2>/dev/null || gsd-tools.cjs init status 2>/dev/null || echo "{}")
```

Parse `INIT` to determine next-step options. If parsing fails or state is unavailable, fall back to generic prompt (Step 3b).

**Step 3a — Infer next steps from state:**

Evaluate in order:
1. If there is an unexecuted PLAN.md in the current phase → add `/gsd-execute-phase` as option
2. If current phase has executed but no VERIFICATION.md → add `/gsd-verify-work` as option
3. If there is a future phase with no PLAN.md → add `/gsd-plan-phase <N>` as option
4. If all phases in ROADMAP are complete and verified → add `/gsd-new-milestone` as option
5. Always add "结束会话（End session）" as the last option

**Step 3b — Fallback (if state unavailable):**

Show a generic prompt with: `/gsd-next`, `/gsd-progress`, "结束会话（End session）"

**Step 4 — Call ask_user:**

Use `ask_user` (or `vscode_askquestions` for Copilot VS Code) with:
- `message`: "命令已完成。下一步操作？"
- `options`: options derived from Step 3a/3b for single-select

If user selects "结束会话", end the session normally.
Otherwise, execute the selected next command.

## Error Handling

If `gsd-sdk` and `gsd-tools` are both unavailable or return errors, fall back to Step 3b.
Never let gate errors block workflow completion — on any exception, end session normally.
