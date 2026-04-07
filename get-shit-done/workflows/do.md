<purpose>
Analyze freeform text from the user and route to the most appropriate GSD command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate">
**Check for input.**

If `$ARGUMENTS` is empty, ask via AskUserQuestion:

```
What would you like to do? Describe the task, bug, or idea and I'll route it to the right GSD command.
```

Wait for response before continuing.
</step>

<step name="check_project">
**Check if project exists.**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load 2>/dev/null)
```

Track whether `.planning/` exists — some routes require it, others don't.
</step>

<step name="route">
**Match intent to command.**

Evaluate `$ARGUMENTS` against these routing rules. Apply the **first matching** rule:

| If the text describes...                                                         | Route to                  | Why                                      |
| -------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------- |
| Starting a new project, "set up", "initialize"                                   | `/gsd-new-project`        | Needs full project initialization        |
| Mapping or analyzing an existing codebase                                        | `/gsd-map-codebase`       | Codebase discovery                       |
| A bug, error, crash, failure, or something broken                                | `/gsd-debug`              | Needs systematic investigation           |
| Exploring, researching, comparing, or "how does X work"                          | `/gsd-research-phase`     | Domain research before planning          |
| Discussing vision, "how should X look", brainstorming                            | `/gsd-discuss-phase`      | Needs context gathering                  |
| A complex task: refactoring, migration, multi-file architecture, system redesign | `/gsd-add-phase`          | Needs a full phase with plan/build cycle |
| Planning a specific phase or "plan phase N"                                      | `/gsd-plan-phase`         | Direct planning request                  |
| Executing a phase or "build phase N", "run phase N"                              | `/gsd-execute-phase`      | Direct execution request                 |
| Running all remaining phases automatically                                       | `/gsd-autonomous`         | Full autonomous execution                |
| A review or quality concern about existing work                                  | `/gsd-verify-work`        | Needs verification                       |
| Checking progress, status, "where am I"                                          | `/gsd-progress`           | Status check                             |
| Resuming work, "pick up where I left off"                                        | `/gsd-resume-work`        | Session restoration                      |
| A note, idea, or "remember to..."                                                | `/gsd-add-todo`           | Capture for later                        |
| Adding tests, "write tests", "test coverage"                                     | `/gsd-add-tests`          | Test generation                          |
| Completing a milestone, shipping, releasing                                      | `/gsd-complete-milestone` | Milestone lifecycle                      |
| A specific, actionable, small task (add feature, fix typo, update config)        | `/gsd-quick`              | Self-contained, single executor          |

**Requires `.planning/` directory:** All routes except `/gsd-new-project`, `/gsd-map-codebase`, `/gsd-help`, and `/gsd-join-discord`. If the project doesn't exist and the route requires it, suggest `/gsd-new-project` first.

**Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via AskUserQuestion with the top 2-3 options. For example:

```
"Refactor the authentication system" could be:
1. /gsd-add-phase — Full planning cycle (recommended for multi-file refactors)
2. /gsd-quick — Quick execution (if scope is small and clear)

Which approach fits better?
```

</step>

<step name="display">
**Show the routing decision.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command}
**Reason:** {one-line explanation}
```

</step>

<step name="dispatch">
**Invoke the chosen command.**

Run the selected `/gsd-*` command, passing `$ARGUMENTS` as args.

If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via AskUserQuestion.

After invoking the command, continue to `completion_gate`.
Do NOT end the workflow directly after dispatch.
</step>

<step name="completion_gate" required="true">
**Mandatory ask gate before completion.**

After the dispatched command returns, call AskUserQuestion:

- **question:** "当前轮次已完成。下一步操作是什么？"
- **options:** "继续下一步（推荐）" / "输入新的命令目标" / "结束本次会话"

If user selects "继续下一步（推荐）":

- If `.planning/` exists, invoke `/gsd-next`.
- If `.planning/` does not exist, invoke `/gsd-help` and wait for the next command.

If user selects "输入新的命令目标":

- Ask for freeform text input.
- Re-enter routing flow using that input.

If user selects "结束本次会话":

- Stop workflow.

State assertion:

- Treat this workflow as `in_progress` until the ask gate is completed.
- Never exit immediately after dispatch without running this ask gate.
  </step>

</process>

<success_criteria>

- [ ] Input validated (not empty)
- [ ] Intent matched to exactly one GSD command
- [ ] Ambiguity resolved via user question (if needed)
- [ ] Project existence checked for routes that require it
- [ ] Routing decision displayed before dispatch
- [ ] Command invoked with appropriate arguments
- [ ] No work done directly — dispatcher only
      </success_criteria>
