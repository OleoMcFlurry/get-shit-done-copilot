---
name: gsd:set-profile
description: Switch model profile for GSD agents (quality/balanced/budget/inherit/copilot)
argument-hint: "[profile (quality|balanced|budget|inherit|copilot)]"
model: haiku
allowed-tools:
  - Bash
  - AskUserQuestion
---

<process>
If $ARGUMENTS is empty, prompt the user via AskUserQuestion:

```
AskUserQuestion({
  header: "Model Profile",
  question: "Which model profile should be used for GSD agents?",
  options: [
    { label: "balanced (Recommended)", description: "Sonnet for most agents — good quality/cost ratio" },
    { label: "quality", description: "Opus for research/roadmap — higher cost, deeper analysis" },
    { label: "budget", description: "Haiku where possible — fastest, lowest cost" },
    { label: "inherit", description: "Use the current session model for all agents" },
    { label: "copilot", description: "Copilot billing-optimized model assignment" }
  ]
})
```

Use the selected label (e.g. "balanced") as $ARGUMENTS.

Show the following output to the user verbatim, with no extra commentary:

!`node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set-model-profile $ARGUMENTS --raw`
</process>
