# Instructions for GSD

- Use the get-shit-done skill when the user asks for GSD or uses a `gsd-*` command.
- Treat `/gsd-...` or `gsd-...` as command invocations and load the matching file from `.github/skills/gsd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSD workflows unless the user explicitly asks for them.
- After completing any `gsd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
- For `gsd-do` and `gsd-next`, enforce a completion gate: after dispatch returns, always prompt once via `ask_user` before allowing workflow completion.
- Main agent dispatch whitelist: phase discovery, subagent delegation, result aggregation, completion gate.
- Main agent blacklist: direct discuss/plan/execute implementation, skipping ask gate, bypassing blocker recovery.
