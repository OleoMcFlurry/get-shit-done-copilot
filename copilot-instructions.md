<!-- GSD:project-start source:PROJECT.md -->
## Project

**GSD Copilot 计费优化魔改版**

GSD (Get Shit Done) Copilot CLI 的计费优化定制版本。核心目标是利用 GitHub Copilot 的计费机制特性——仅对主 Agent 的用户侧提示词计费、子 Agent 调用不额外计费——最大化每个计费单元的开发产出。通过两项改造实现：主 Agent 完成任务后强制询问用户下一步而非直接结束（保持单次会话持续工作），以及为不同任务类型的子 Agent 分配最优模型（低倍率编排 + 高能力执行）。

**Core Value:** **一次计费，持续交付**：主 Agent 永不自动结束，每次会话可完成任意多个工作流；子 Agent 按任务特性分配最强适配模型，最大化代码质量产出。

### Constraints

- **兼容性**：新 `copilot` 档位必须在不破坏现有 quality/balanced/budget/adaptive/inherit 档位的前提下追加
- **可选性**：`workflow.completion_gate` 默认关闭，用户主动开启（避免影响现有用户体验）
- **模型 ID 格式**：新档位使用完整模型 ID（如 `claude-opus-4-6`、`gpt-5.3-codex`），遵循现有 model_overrides 文档规范
- **语言**：项目代码为 TypeScript（SDK）+ CommonJS（bin/lib），测试用 vitest
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- **JavaScript/TypeScript** — Node.js runtime; used across SDK, tools, hooks, and agents
- **Shell Scripts** (.sh) — Git hooks and installation logic (`hooks/` directory)
- **Markdown** — Plan templates, documentation, configuration specs
## Runtime
- **Node.js** ≥22.0.0 (main package)
- **Node.js** ≥20.0.0 (SDK package `@gsd-build/sdk`)
- **Package Manager:** npm (lockfile: `package-lock.json` present)
- Main CLI: `bin/install.js` — Installation and setup orchestrator
- SDK CLI: `sdk/dist/cli.js` — Programmatic plan execution interface
- Core tools: `get-shit-done/bin/gsd-tools.cjs` — State management and operations
## Frameworks & Libraries
- **@anthropic-ai/claude-agent-sdk** (^0.2.84) — Agent execution runtime; provides `query()` function for multi-turn conversations, tool use, and event streaming
- **ws** (^8.20.0) — WebSocket server for event broadcasting in `sdk/src/ws-transport.ts`
- **TypeScript** (^5.7.0) — Transpilation, type checking, declarations
- **vitest** (^4.1.2 main, ^3.1.1 SDK) — Unit and integration testing framework
- **esbuild** (^0.24.0) — ESM bundling for hook sources
- **c8** (^11.0.0) — Code coverage reporting
- **@types/node** (^22.0.0) — Node.js standard library types
- **@types/ws** (^8.18.1) — WebSocket type definitions
## Build & Tooling
- **TypeScript Compiler** — Targets ES2022, NodeNext module resolution
- **esbuild** — Compiles hook sources from `hooks/src/` to `hooks/dist/`
- **Build Script:** `npm run build:hooks` (required before publishing)
- `tsconfig.json` (root) — References SDK project with `"references": [{ "path": "sdk" }]`
- `sdk/tsconfig.json` — ES2022 target, strict mode, declaration maps and source maps enabled
- `vitest.config.ts` — Dual project mode: unit tests (exclude .integration.test.ts) and integration tests (120s timeout)
- `sdk/vitest.config.ts` — Individual SDK test configuration
- **vitest** 4.1.2 → Run framework
- **Test Structure:** Co-located `.test.ts` and `.integration.test.ts` files in `sdk/src/`
- **Test Exclusion:** Build excludes `src/**/*.test.ts` and `src/**/*.integration.test.ts`
## Configuration
- Location: `{projectDir}/.planning/config.json`
- Schema: Defined in `sdk/src/config.ts` (GSDConfig interface)
- Defaults: 40+ keys for workflows, git, models, search features, hooks
- Loader: `sdk/src/config.ts` — three-level deep merge (defaults → file → runtime overrides)
- `balanced` → `claude-sonnet-4-6`
- `quality` → `claude-opus-4-6`
- `speed` → `claude-haiku-4-5`
- Custom: Any fully-qualified model ID (e.g., `openai/o3`, `google/gemini-2.5-pro`)
- `model_profile` — Model selection strategy (default: "balanced")
- `commit_docs` — Auto-commit planning artifacts (default: true)
- `parallelization` — Enable parallel phase execution (default: true)
- `workflow.research` — Enable research phase (default: true)
- `workflow.plan_check` — Enable plan verification (default: true)
- `workflow.verifier` — Enable execution verification (default: true)
- `workflow.auto_advance` — Skip discussion and proceed (default: false)
- `git.branching_strategy` — none | feature | trunk (default: "none")
- `brave_search` — Enable Brave web search (requires `BRAVE_API_KEY`)
- `firecrawl` — Enable Firecrawl scraping (requires `FIRECRAWL_API_KEY`)
- `exa_search` — Enable Exa semantic search (requires `EXA_API_KEY`)
- `BRAVE_API_KEY` — Brave Search API key (detected at config time)
- `FIRECRAWL_API_KEY` — Firecrawl API key (detected at config time)
- `EXA_API_KEY` — Exa Search API key (detected at config time)
- Credentials can be stored in `~/.gsd/{service}_api_key` files as alternative to env vars
- **Claude Code:** `.claude/skills/gsd-*/SKILL.md` (2.1.88+) or `commands/gsd/` (older versions)
- **Gemini CLI, Copilot, etc:** Similar skill/command registration
- **Cline:** `.clinerules` file format
- **Global install:** `~/.claude/get-shit-done/`
- **Local install:** `./.claude/get-shit-done/`
## Platform Support
- macOS, Linux, Windows (WSL)
- Node.js 22.0.0+ (main), 20.0.0+ (SDK)
- npm for dependency management
- Claude Code (2.1.88+, or older versions)
- Gemini CLI
- OpenCode
- Kilo
- Codex
- Copilot
- Cursor
- Windsurf
- Antigravity
- Augment
- Trae
- Cline
- Containerized execution supported via SDK
## Version Information
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Language & Style
- Version: Latest (ESM modules with `import`/`export`)
- Strict mode enabled (implicitly via TypeScript configuration in `tsconfig.json`)
- Target: ES2020+
- Module system: ESM with `.js` extensions in import paths (see `sdk/src/config.ts` line 8)
- No explicit linter configuration (no `.eslintrc`, `.prettierrc`, or biome.json detected)
- Consistent indentation: 2 spaces
- Line length: Variable (pragmatic, no enforced limit)
- Semicolons: Required (TypeScript convention)
- Quotes: Single quotes for strings (e.g., `'import'`, `'types.js'`)
## Naming Conventions
- Kebab-case: `config.ts`, `context-engine.ts`, `plan-parser.ts`, `cli-transport.ts`
- Pattern: Descriptive, action-oriented names (`event-stream.ts`, `prompt-builder.ts`, `session-runner.ts`)
- Test files: `{name}.test.ts` for unit tests, `{name}.integration.test.ts` for integration tests (see `vitest.config.ts`)
- Classes and interfaces in separate files from implementations (see `config.ts` and `config.test.ts`)
- camelCase: `parseAgentTools()`, `extractFrontmatter()`, `loadConfig()`, `resolveContextFiles()`
- Export functions directly at module level (see `sdk/src/plan-parser.ts` line 38: `export function extractFrontmatter(content: string)`)
- Private/internal functions: PascalCase for class methods (e.g., `private readFileIfExists()` in `context-engine.ts`)
- No prefixes like `get`, `set`, or `is` unless semantically necessary
- camelCase for variables: `tmpDir`, `filePath`, `scriptPath`, `projectDir`
- UPPER_SNAKE_CASE for public constants: `DEFAULT_TIMEOUT_MS`, `BUNDLED_GSD_TOOLS_PATH`, `DEFAULT_ALLOWED_TOOLS` (see `sdk/src/gsd-tools.ts` and `sdk/src/prompt-builder.ts` line 13)
- Private class fields: Prefixed with `private readonly` (e.g., `private readonly projectDir: string;` in `context-engine.ts` line 76)
- PascalCase: `GSDConfig`, `WorkflowConfig`, `ParsedPlan`, `GSDLogger`, `ContextEngine`, `CLITransport`
- Convention: Generic types use `Type` suffix (e.g., `PhaseType`, `LogLevel`)
- Interfaces for configuration: Descriptive names ending in `Config` (e.g., `GitConfig`, `HooksConfig`)
- Union types explicit: `type LogLevel = 'debug' | 'info' | 'warn' | 'error';` (logger.ts line 13)
- Objects with optional fields use `?` notation: `interface GSDLoggerOptions { level?: LogLevel; ... }` (logger.ts line 36)
- snake_case: `phase_branch_template`, `branching_strategy`, `context_warnings` (see `config.ts` for interface definitions)
- Reflects YAML/JSON configuration format from `.planning/config.json`
## Code Patterns
- Prefer pure functions where possible (e.g., `parseAgentTools()`, `extractFrontmatter()`)
- Higher-order functions: `Array.map()`, `.filter()`, `.reduce()` used frequently
- Function composition not heavily used; methods on objects preferred
- Classes for stateful services: `GSDLogger`, `ContextEngine`, `GSDTools`, `GSDEventStream`, `CLITransport`
- Constructor injection for dependencies (e.g., `ContextEngine(projectDir, logger?, truncation?)` in line 80 of context-engine.ts)
- Private fields for encapsulation: `private readonly` on class properties
- No inheritance chains; composition favored
- All async operations use `async`/`await` (not Promise chains)
- Error handling: `try/catch` blocks or Promise rejection propagation
- Examples: `async resolveContextFiles(phaseType)` (context-engine.ts), `async loadConfig(projectDir)` (config.ts line 102)
- Concurrent operations: Used selectively, not heavily parallelized in SDK code
- Custom error classes extending `Error` (e.g., `GSDToolsError` in gsd-tools.ts)
- Structured error properties: `command`, `args`, `exitCode`, `stderr` (gsd-tools.ts lines 45-49)
- Thrown immediately on critical failure; logged via logger for warnings
- No silent failures; failures propagate up for caller to handle
- Barrel files: `index.ts` exports public API (sdk/src/index.ts line 40: `export class GSD`)
- Named exports for types: `export interface`, `export type` (config.ts)
- Default exports: Not used; named exports only
- Re-exports: Minimal; each module exports what it defines (types, classes, functions)
## Import Organization
- No path aliases (`@/`, `~`) used in SDK; full relative paths with `.js` extensions
- External packages referenced by full package name: `@anthropic-ai/claude-agent-sdk`
- `import type { ... } from './types.js'` for type-only imports (compiler optimization)
- Consistent usage across all TypeScript files in SDK
## Error Handling
- **Custom errors:** Create custom error classes for domain-specific failures (e.g., `GSDToolsError` extends `Error`)
- **Logger integration:** Use `logger.warn()`, `logger.error()` for non-fatal issues (context-engine.ts lines 110-113)
- **Propagation:** Throw errors immediately when operation cannot proceed; let caller decide handling
- **Message clarity:** Error messages include context (command, args, exit code, stderr) for debugging
- Levels: `debug`, `info`, `warn`, `error` (logger.ts line 13)
- Contextual data: Passed as second parameter: `logger.warn(message, { phase, file, path })` (context-engine.ts line 112)
- Structured JSON output: Each log entry includes timestamp, level, message, and optional data object (logger.ts lines 24-32)
## Comments
- **Block headers:** Multi-line comments with `// ─── ` separator pattern (visual organization)
- **Complex logic:** Explain WHY, not WHAT (WHAT is readable from code)
- **Unusual patterns:** Justify non-obvious decisions (e.g., "Skip config.json — structured data, not markdown" in context-engine.ts line 153)
- **Gotchas:** Flag edge cases that aren't obvious (context-engine.ts line 115: "Apply context reduction: milestone extraction then truncation")
- Used for public APIs and exported functions
- Format: `/** ... */` with `@param`, `@returns`, `@example` tags
- Examples present in core functions (index.ts lines 7-17, prompt-builder.ts lines 99-101)
- Parameter documentation: `@param name - Description`
- Return value: `@returns Type - Description`
## Function Design
- Typical range: 10-50 lines for single-responsibility functions
- Longer functions only when logic is tightly coupled (e.g., parsing with multiple regex patterns)
- Private helper functions extract common sub-tasks
- Positional: 1-3 parameters typical
- Options objects for >3 parameters or optional flags
- Use destructuring: `{ projectDir, logger?, truncation? }` (context-engine.ts constructor)
- No default parameters in function signatures; use object spread instead
- Single, clear return type (TypeScript enforced)
- `async` functions return `Promise<T>`
- Async operations never silent-fail; exceptions bubble up
- Nullable returns explicit: `string | undefined` rather than `string | null` (except where null semantically matters)
- Minimized in pure utility functions
- File I/O isolated to dedicated methods: `readFileIfExists()` (context-engine.ts line 160)
- Class methods may modify state; documented if non-obvious
- No hidden dependencies; injected via constructor
## Module Design
- **Public API:** Named exports only (no default exports)
- **Classes:** Exported as named exports (e.g., `export class ContextEngine { ... }`)
- **Functions:** Exported at module level, not nested (e.g., `export function parsePlan(content: string)`)
- **Types:** Exported with `export type` or `export interface` for type-only modules
- Located at `sdk/src/index.ts`
- Re-exports public API classes and types
- Selective: Only exports meant for external use (internal utilities not re-exported)
- No circular dependencies
- Dependency direction: Tests → Implementations → Types
- Clear layers: Logger at lowest level, domain services build on logger + types
## Structural Patterns
- Each TypeScript file exports one primary entity (class, set of functions, or types)
- Test file pairs: `config.ts` + `config.test.ts` in same directory
- Shared types: `types.ts` (centralized, imported by all)
- Pure utility functions at top level, grouped by concern
- Helper functions below main exports
- Comments separate logical sections with `// ─── Name ───────────...` dividers
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Separation of concerns:** Workflows (orchestration logic) → Commands (CLI/dispatch) → Library modules (core utilities)
- **Agent-spawning architecture:** CLI commands trigger specialized AI agents via task dispatch, each with domain-specific instructions
- **File-based state machine:** Phase progression tracked through markdown files (STATE.md, ROADMAP.md, PLAN.md, SUMMARY.md) in `.planning/` directory
- **Structured markdown:** All domain data (plans, requirements, verifications) stored as YAML frontmatter + markdown body
- **Multi-repo support:** Detects and routes operations to sub-repositories when present
## Layers & Modules
### Layer 1: Entry Points & Installation
- Global CLI installation entry point
- Sets up package.json `bin` field for `get-shit-done-cc` command
- Minimal bootstrap — delegates to workflow/command layer
### Layer 2: Workflows (Orchestration Logic)
- Parses arguments and initializes context via `gsd-tools init` 
- Spawns specialized agents with `Task(subagent_type="gsd-*")` 
- Validates outputs and iterates until success or max retries
- Coordinates between planning phase → execution → verification
- `plan-phase.md` — Research → Plan → Verify loop for phase planning
- `execute-phase.md` — Task selection → Execution → Summary verification
- `discuss-phase.md` — Interactive phase requirements discovery
- `new-project.md` — Initialize `.planning/` structure and config
- `complete-milestone.md` — Archive phase directories and create MILESTONES.md
- `add-tests.md` — Generate test files from SUMMARY.md
### Layer 3: Commands (CLI Dispatch)
- Description and argument hints
- Agent to spawn (via `agent:` field)
- Allowed tools
- Execution context (which files to load)
- Orchestrator role (argument parsing, validation, error handling)
- `plan-phase.md` → spawns `gsd-planner` agent
- `execute-phase.md` → spawns `gsd-executor` agent
- `code-review.md` → spawns `gsd-code-reviewer` agent
- `map-codebase.md` → spawns `gsd-codebase-mapper` agent
### Layer 4: Agents (AI-Driven Specialists)
- Domain-specific instructions (e.g., testing patterns for gsd-executor)
- Context files (PLAN.md, codebase analysis, conventions)
- Task execution tools (Read, Write, Bash, Glob, Grep)
- Tool constraints (what agents can/cannot access)
- `gsd-planner` — Break down phase requirements into executable plans
- `gsd-executor` — Execute plan tasks and produce SUMMARY.md
- `gsd-phase-researcher` — Research phase requirements and constraints
- `gsd-code-reviewer` — Review code changes and generate feedback
- `gsd-codebase-mapper` — Analyze codebase architecture/stack
- `gsd-project-researcher` — Deep research on project context
- `gsd-verifier` — Validate execution outputs
### Layer 5: Library Modules (Core Utilities)
- Path utilities: `planningDir()`, `findProjectRoot()`, `detectSubRepos()`
- Git integration: `execGit()`, `commit()`, `getCurrentBranch()`
- Phase operations: `findPhaseInternal()`, `comparePhaseNum()`, `normalizePhaseName()`
- Config loading: `loadConfig()`, `CONFIG_DEFAULTS`
- Frontmatter helpers: `extractFrontmatter()`, `parseMustHavesBlock()`
- STATE.md read/write: `cmdStateLoad()`, `cmdStateJson()`, `cmdStateUpdate()`
- Field manipulation: `stateExtractField()`, `stateReplaceField()`
- Milestone tracking: `extractCurrentMilestone()`, `getMilestoneInfo()`
- Phase progression: `updatePerformanceMetricsSection()`
- Phase listing: `cmdPhasesList()` (supports --type=plans, summaries)
- Phase creation: `cmdPhaseAdd()`, `cmdPhaseInsert()`
- Phase completion: `cmdPhaseComplete()`
- Numbering: `cmdPhaseNextDecimal()`, `comparePhaseNum()`
- Summary verification: `cmdVerifySummary()` (checks files exist, commits present, self-check)
- Health validation: `cmdValidateHealth()`, `cmdValidateConsistency()`
- Self-repair: `repairPhase()`, `autoFixPhaseOrder()`
- Agent validation: `checkAgentsInstalled()`
- Standalone utilities: `cmdGenerateSlug()`, `cmdCurrentTimestamp()`, `cmdListTodos()`
- Phase status determination: `determinePhaseStatus()` (checks plans vs summaries vs verification status)
- Roadmap operations: `cmdRoadmapAnalyze()`
- Compound init operations: `cmdInitExecutePhase()`, `cmdInitResearchPhase()`
- Milestone metadata extraction: `getMilestoneInfo()`, `stripShippedMilestones()`
- Agent installation status: `checkAgentsInstalled()`
- YAML frontmatter parsing: `extractFrontmatter()`, `reconstructFrontmatter()`
- Task parsing: `parseTaskBlocks()`, `extractTaskIds()`
- MustHaves validation: `parseMustHavesBlock()`
- Research intel storage: `cmdIntelQuery()`, `cmdIntelDiff()`
- Intel snapshots: `cmdIntelSnapshot()`, `cmdIntelPatchMeta()`
- Export detection: `extractExports()`
- `roadmap.cjs` — ROADMAP.md parsing and phase extraction
- `config.cjs` — Config.json loading and env var resolution
- `security.cjs` — Secret scanning and security validation
- `profile-pipeline.cjs` — Model profile resolution and selection
- `workstream.cjs` — Session state and workstream tracking
- `model-profiles.cjs` — Model capability definitions and selection logic
### Layer 6: CLI Tool Runner
```bash
```
## Data Flow
### Phase Planning Flow
```
```
### Phase Execution Flow
```
```
### State Progression
```
- **current_phase**: Integer or decimal phase number
- **phase_status**: 'Planned' → 'In Progress' → 'Executed' → 'Complete'
- **last_phase_completed**: Version or timestamp
- **phase_start_date**: When phase work began
- **phase_end_date**: When phase finished
- **active_flags**: List of --flags used in current phase (e.g., --rush, --prd)
- 0 plans → 'Pending' (no work planned yet)
- plans > 0, summaries < plans → 'Planned' or 'In Progress'
- summaries ≥ plans, no VERIFICATION.md → 'Executed'
- summaries ≥ plans, VERIFICATION.md status:passed → 'Complete'
- summaries ≥ plans, VERIFICATION.md status:gaps_found → 'Executed'
```
## Entry Points
### Binary Entry Point
- Called by: `npm install` (via package.json `bin` field)
- Runs: Installation hooks setup
- Returns: Exit code 0/1
### Orchestrator Entry Points
- `/gsd-plan-phase` → `commands/gsd/plan-phase.md`
- `/gsd-execute-phase` → `commands/gsd/execute-phase.md`
- `/gsd-code-review` → `commands/gsd/code-review.md`
- etc.
### CLI Tool Entry Point
```bash
```
- Workflows for initialization and validation
- Hooks for git operations and state updates
- Tests for direct module testing
### Workflow Entry Points
- User intent matches dispatcher rules
- Another workflow calls `Execute workflow: <workflow_name>`
### Hook Entry Points
- `pre-commit` → Phase validation
- `post-commit` → State update
- Custom hooks (gsd-session-state.sh, gsd-workflow-guard.js)
## Key Abstractions
### Phase Abstraction
- `.planning/phases/<N>-<name>/PLAN.md` — Tasks and acceptance criteria
- `.planning/phases/<N>-<name>/<task_id>-SUMMARY.md` — Execution results
- `.planning/phases/<N>-<name>/VERIFICATION.md` — Test results and verification status
- `.planning/phases/<N>-<name>/CONTEXT.md` — Domain knowledge and requirements
```
```
### Task Abstraction
```xml
```
### Milestone Abstraction
```yaml
```
- Archive phases after completion
- Track shipping history
- Organize roadmap into releases
### Model Profile Abstraction
- `claude-opus` → Can handle complex planning with extended thinking
- `claude-sonnet` → Balanced capability, general-purpose
- `gpt-4o` → Multi-modal capable
- `gemini-2.0-flash` → Fast, good for execution tasks
## Error Handling
- `0` — Success
- `1` — User error (missing phase, bad arguments)
- `2` — System error (file not found, git failure)
- `3` — Validation error (state inconsistency)
```javascript
```
- `--repair` flag on health validation auto-fixes numbering/ordering
- Phase completion rollback not yet implemented (TODO)
## Cross-Cutting Concerns
- `--raw` flag outputs plain text for shell capture
- JSON mode for orchestrator parsing
- `--pick <field>` filters JSON output
- Frontmatter schema validation for PLAN.md, SUMMARY.md
- File existence spot-checks in summary verification
- Phase number consistency checks across ROADMAP and disk
- Git integration validation (commits exist, branches clean)
- External integrations (web search via Brave, webhook calls) managed by agents
- Secrets stored in user's environment or `.env` (not in repo)
- Prevents simultaneous writes to STATE.md, ROADMAP.md
- Acquired before phase operations, released after
- Timeout: 5 seconds (configurable)
- Routes commits to sub-repos when present
- Maintains separate git histories
- Syncs .planning/ at root level only
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.github/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
