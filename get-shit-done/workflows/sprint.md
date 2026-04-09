<purpose>

Front-load all phase decisions upfront, then execute all phases non-stop. Stage 1: intake + milestone check. Stage 2: discuss every phase sequentially (preserves cross-phase context). Stage 3: single review gate. Stage 4: delegate to autonomous execution.

The key invariant: autonomous skips discuss for any phase that already has CONTEXT.md — so all phases discussed in Stage 2 will proceed directly to plan+execute without pausing.

</purpose>

<required_reading>

Read all files referenced by the invoking prompt's execution_context before starting.

</required_reading>

<process>

<step name="initialize" priority="first">

## 1. Initialize

Parse `$ARGUMENTS`:

```bash
FROM_SCRATCH=""
if echo "$ARGUMENTS" | grep -q '\-\-from-scratch'; then FROM_SCRATCH="true"; fi

AUTO=""
if echo "$ARGUMENTS" | grep -q '\-\-auto'; then AUTO="true"; fi

SKIP_DISCUSS=""
if echo "$ARGUMENTS" | grep -q '\-\-skip-discuss'; then SKIP_DISCUSS="true"; fi

FROM_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-from\s+[0-9]'; then
  FROM_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-from\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
fi

TO_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-to\s+[0-9]'; then
  TO_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-to\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
fi
```

**If `--from-scratch`:** Invoke `gsd-new-milestone` first:

```
Skill(skill="gsd:new-milestone")
```

Wait for completion before continuing.

Bootstrap milestone context:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init milestone-op)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `milestone_version`, `milestone_name`, `phase_count`, `roadmap_exists`, `state_exists`.

**If `roadmap_exists` is false:** Error — "No ROADMAP.md found. Run `/gsd-new-milestone` first or use `--from-scratch`."
**If `state_exists` is false:** Error — "No STATE.md found. Run `/gsd-new-milestone` first."

Display sprint banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPRINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Phases: {phase_count} total
 Mode: {SKIP_DISCUSS ? "Skip discuss → autonomous" : "Front-load discuss → autonomous"}
```

If `FROM_PHASE` is set, display: ` Scope: Phase ${FROM_PHASE}` + (if `TO_PHASE`): `–${TO_PHASE}`
If `AUTO` is set, display: ` Review gate: disabled (--auto)`

</step>

<step name="discover_phases">

## 2. Discover Phases for Sprint Scope

Run phase discovery:

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

Parse the JSON `phases` array. Filter to incomplete phases (`disk_status !== "complete"` OR `roadmap_complete === false`).

Apply `--from N` / `--to N` filters (numeric comparison, handles decimals).

Sort by `number` ascending.

**If no incomplete phases remain:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPRINT ▸ NOTHING TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 All phases in scope are already complete.
```

Exit cleanly.

Store the filtered phase list as `SPRINT_PHASES` for use in Stage 3.

</step>

<step name="front_load_discuss">

## 3. Front-Load Discuss (Sequential)

**If `SKIP_DISCUSS` is set:** Skip this entire step. Display:

```
Discuss skipped (--skip-discuss) — autonomous will handle discuss per phase.
```

Proceed to step 4 (review_gate).

---

For each phase in `SPRINT_PHASES` **in order** (sequential — do NOT parallelize):

### 3a. Check context

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Parse `has_context` from JSON.

**If `has_context` is true:** Display:

```
Phase ${PHASE_NUM}: Context exists — skipping discuss.
```

Continue to next phase.

### 3b. Run discuss

Display progress:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPRINT ▸ Discuss Phase {N} of {T}: {Phase Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Invoke discuss-phase using the Skill tool (flat invocation — avoids nested Task sessions):

```
Skill(skill="gsd:discuss-phase", args="${PHASE_NUM} --auto --discuss-only")
```

**After completion:** Verify CONTEXT.md was written:

```bash
PADDED=$(printf "%02d" ${PHASE_NUM})
ls .planning/phases/${PADDED}-*/  ${PADDED}-CONTEXT.md 2>/dev/null | grep -q CONTEXT.md && echo "CONTEXT_OK" || echo "CONTEXT_MISSING"
```

**If CONTEXT_MISSING:** Log a warning:

```
⚠️  Phase ${PHASE_NUM}: discuss-phase completed but CONTEXT.md not found. Sprint will continue — autonomous will re-run discuss for this phase.
```

Continue to next phase regardless.

</step>

<step name="review_gate">

## 4. Review Gate

**If `AUTO` is set:** Skip this step entirely. Proceed directly to step 5 (execute).

---

Generate `.planning/SPRINT-SUMMARY.md` from all CONTEXT.md files in scope:

```bash
for PHASE_NUM in ${SPRINT_PHASES}; do
  PADDED=$(printf "%02d" ${PHASE_NUM})
  CONTEXT_FILE=$(ls .planning/phases/${PADDED}-*/${PADDED}-CONTEXT.md 2>/dev/null | head -1)
  if [[ -f "$CONTEXT_FILE" ]]; then
    # Extract phase name and up to 5 items from <decisions> section
    echo "Processing Phase ${PHASE_NUM} from ${CONTEXT_FILE}"
  fi
done
```

Write `.planning/SPRINT-SUMMARY.md` with this structure:

```markdown
# Sprint Summary

**Milestone:** {milestone_version} — {milestone_name}
**Generated:** {date}
**Scope:** Phase {FROM_PHASE or first} – Phase {TO_PHASE or last}

---

## Phase {N}: {Phase Name}

**Decisions made:**
1. {decision 1 from <decisions> section}
2. {decision 2}
... (max 5 decisions per phase)

---
```

If a phase has no CONTEXT.md (discuss was skipped or failed), note:

```markdown
## Phase {N}: {Phase Name}

_No context file — discuss will run during execution._
```

**Commit SPRINT-SUMMARY.md:**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(sprint): generate sprint summary" --files .planning/SPRINT-SUMMARY.md 2>/dev/null || true
```

Display the full SPRINT-SUMMARY.md content to the user.

**Present review gate:**

Ask the user using AskUserQuestion:

```
Sprint decisions are locked in. Review above and choose how to proceed.

Options:
1. Execute — start autonomous execution for all phases
2. Re-discuss phase N — re-run discuss for a specific phase (enter phase number after selecting)
3. Exit — stop here; run /gsd-autonomous later when ready
```

**If user selects "Execute":** Proceed to step 5.

**If user selects "Re-discuss phase N":**
- Ask which phase number to re-discuss
- Re-run step 3b for that phase only (`Skill(skill="gsd:discuss-phase", args="${PHASE_NUM} --auto --discuss-only")`)
- Return to review gate (regenerate SPRINT-SUMMARY.md and present again)

**If user selects "Exit":** Display:

```
Sprint paused. CONTEXT.md files are saved.
Run /gsd-autonomous to start execution when ready.
```

Exit cleanly.

</step>

<step name="execute">

## 5. Execute — Delegate to Autonomous

Build the autonomous args:

```bash
AUTO_ARGS=""
if [[ -n "$FROM_PHASE" ]]; then AUTO_ARGS="$AUTO_ARGS --from ${FROM_PHASE}"; fi
if [[ -n "$TO_PHASE" ]];   then AUTO_ARGS="$AUTO_ARGS --to ${TO_PHASE}";   fi
```

Display handoff banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPRINT ▸ EXECUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 All phase contexts are ready. Handing off to autonomous...
 Phases with CONTEXT.md will skip discuss and go straight to plan→execute.
```

Invoke autonomous using the Skill tool:

```
Skill(skill="gsd:autonomous", args="${AUTO_ARGS}")
```

Autonomous handles the full execution lifecycle: per-phase plan→execute, milestone audit, completion, and cleanup.

</step>

</process>
