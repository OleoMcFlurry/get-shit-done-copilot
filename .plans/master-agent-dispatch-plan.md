# 主 agent 调度化改造执行计划

## 背景

当前编排能力分散在多个工作流中，缺少统一主 agent 入口与统一收尾闸门。为保证执行一致性与会话连续性，需要建立主 agent 调度体系。

## 目标

1. 主 agent 仅承担调度，不直接执行搜索、规划、修改、测试等执行动作。
2. 所有执行动作下放子代理完成。
3. 每轮结果返回后主 agent 必须触发 ask_user，未明确结束前保持会话。
4. 全流程采用可打勾追踪，执行后立即标记。

## 范围

### 范围内

1. 入口统一与调度状态机落地。
2. 收尾 ask_user 闸门落地。
3. 异常处理、兼容策略、验收标准、回滚策略。

### 范围外

1. 不新增业务需求。
2. 不在本计划中执行发布与 git push。

## 状态规则

1. 未开始：`status=未开始`，`progress=0`。
2. 进行中：`status=进行中`，`progress=1-99`。
3. 阻塞：`status=阻塞`，必须填写阻塞原因与解除条件。
4. 完成：`status=完成`，`progress=100`，附验收证据。

## 标记规范

1. 每完成一个最小可交付单元，立即将对应任务由 `[ ]` 改为 `[x]`。
2. 部分完成任务使用：`[~]`，并在同一行注明剩余项。
3. 阻塞任务使用：`[!]`，并填写阻塞原因、责任人、预计解除时间。
4. 不允许跨阶段批量补标，必须在动作完成后即时标记。

## 阶段计划

## P0 验证阶段

- 阶段目标：形成最小主 agent 闭环并验证强制 ask_user。
- 阶段状态：完成
- 阶段进度：100%

### P0 任务清单

- [x] 冻结入口基线清单（do、next）
- [x] 定义主 agent 最小状态机（接收、分派、收集、ask、循环）
- [x] 为 do 收尾增加 ask_user 强制闸门
- [x] 为 next 收尾增加 ask_user 强制闸门
- [x] 增加“未 ask 不得结束”断言
- [x] 完成 P0 验收记录

### P0 完成定义

1. do 与 next 均触发统一收尾 ask_user。
2. 主 agent 无直接执行型动作。
3. 未出现未询问即结束会话。

### P0 验收记录

1. do 工作流已新增 `completion_gate`，并声明 `in_progress` 断言。
2. next 工作流已新增 `completion_gate`，并声明仅在 ask 完成后可结束。
3. next 命令已补齐 `AskUserQuestion` 工具声明。
4. 模板层已补充 do 与 next 的收尾闸门一致性约束。

## P1 最小可用阶段

- 阶段目标：覆盖核心编排命令并打通主调度链路。
- 阶段状态：完成
- 阶段进度：100%

### P1 任务清单

- [x] 接管 execute-phase 调度入口
- [x] 接管 autonomous 调度入口
- [x] 接管 manager 调度入口
- [x] 建立子代理失败与超时恢复路径
- [x] 建立部分完成回收与二次分派机制
- [x] 完成 P1 验收记录

### P1 完成定义

1. 核心编排命令统一通过主 agent 分派。
2. 失败、超时、部分完成均回到 ask_user 决策。
3. 主 agent 仍保持只调度。

### P1 验收记录

1. autonomous 命令与工作流已明确主 agent 只调度、执行动作全部委派子代理。
2. manager 命令与工作流已明确主 agent 只调度、执行动作全部委派子代理。
3. autonomous 与 manager 均新增 `completion_gate`，并要求关键结果返回后必须 AskUserQuestion 或 ask_user。
4. autonomous 与 manager 均补齐失败、超时、部分完成回收与二次分派规则，并进入 AskUserQuestion 决策分支。
5. P1 状态、进度、任务勾选、验收记录已同步更新。
6. 目标五文件差异已复核：`commands/gsd/autonomous.md`、`get-shit-done/workflows/autonomous.md`、`commands/gsd/manager.md`、`get-shit-done/workflows/manager.md`、`.plans/master-agent-dispatch-plan.md`。
7. 验证证据已补齐：在 `D:/workspace/get-shit-done-copilot` 执行 `git diff -- <五文件>` 与 `npm test`，输出用于 P1 验收归档。
8. 构建脚本核验：`npm run build` 在当前仓库不存在（通过 `npm run` 列出可用脚本确认仅含 `build:hooks`、`test`、`test:coverage`）。
9. 代码块闭合核验：`get-shit-done/workflows/autonomous.md` 与 `get-shit-done/workflows/manager.md` 的代码围栏行数均为偶数。
10. IDE 诊断核验：`ide-get_diagnostics` 当前不可用（IDE 插件未连接），已记录为环境侧证据缺口。

## P2 全量化阶段

- 阶段目标：形成统一规范、回归机制与可持续维护体系。
- 阶段状态：完成
- 阶段进度：100%

### P2 任务清单

- [x] 固化主 agent 白名单与黑名单规范
- [x] 完成跨运行时兼容策略
- [x] 增加行为审计与防漂移检查
- [x] 完成最小回归测试集合
- [x] 完成文档同步（架构、特性、配置）
- [x] 完成 P2 验收记录

### P2 完成定义

1. 所有入口遵循主 agent 调度模型。
2. 收尾 ask_user 机制全局一致。
3. 验收与回归结果完整归档。

### P2 验收记录

1. 白名单与黑名单规范已固化到 `docs/ARCHITECTURE.md` 的 `Main Agent Dispatch Guardrails` 章节。
2. 跨运行时兼容策略已对齐到 `docs/ARCHITECTURE.md` 与 `docs/CONFIGURATION.md`，明确 L1/L2 与 text-mode 回退。
3. 特性文档已同步 `docs/FEATURES.md`，补充 autonomous 的 allowlist/denylist 与兼容分级要求。
4. 阶段状态已更新为进行中，P2-1、P2-2、P2-5 已勾选完成，P2-6 先行完成部分验收记录。
5. P2-3、P2-4 已由 qa-verifier 完成并提供证据：`tmp/p2/master-agent-dispatch-audit.json`、`tmp/p2/master-agent-min-regression.json`、`tmp/p2/master-agent-dispatch-audit-via-npm.json`、`tmp/p2/master-agent-min-regression-via-npm.json`；验证命令 `node --test "tests/master-agent-dispatch-audit.test.cjs"`、`node "scripts/master-agent-dispatch-audit.cjs" --json --report "tmp/p2/master-agent-dispatch-audit.json"`、`node "scripts/run-master-agent-regression.cjs" --json --report "tmp/p2/master-agent-min-regression.json"`、`npm run "audit:master-agent-dispatch" -- --json --report "tmp/p2/master-agent-dispatch-audit-via-npm.json"`、`npm run "test:master-agent-min" -- --json --report "tmp/p2/master-agent-min-regression-via-npm.json"` 均通过。

## 风险与缓解

1. 功能风险：局部入口绕过主 agent。
   缓解：入口门禁检查与统一模板约束。

2. 维护风险：约束散落导致漂移。
   缓解：统一规范文档与校验清单。

3. 兼容风险：不同运行时 ask 语义差异。
   缓解：按运行时定义 L1/L2 兼容分级。

## 回滚策略

1. 回滚开关：关闭主 agent 模式，恢复原入口路径。
2. 分阶段回滚：优先回滚 P1 高影响入口，再回滚 P0。
3. 回滚后校验：验证原流程可执行与会话行为恢复。

## 变更日志

| 时间             | 阶段       | 动作                                                     | 结果 | 证据                                                                                                                                                                               |
| ---------------- | ---------- | -------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-07 14:26 | 计划初始化 | 创建真实计划文档                                         | 完成 | .plans/master-agent-dispatch-plan.md                                                                                                                                               |
| 2026-04-07 14:37 | P0         | do/next 增加 completion_gate 与 ask 收尾断言             | 完成 | get-shit-done/workflows/do.md, get-shit-done/workflows/next.md                                                                                                                     |
| 2026-04-07 14:37 | P0         | next 命令补齐 AskUserQuestion 工具声明                   | 完成 | commands/gsd/next.md                                                                                                                                                               |
| 2026-04-07 14:37 | P0         | 模板补充 do/next 收尾闸门规则                            | 完成 | get-shit-done/templates/copilot-instructions.md                                                                                                                                    |
| 2026-04-07 15:20 | P1         | autonomous/manager 切换为主 agent 纯调度与子代理执行模式 | 完成 | commands/gsd/autonomous.md, get-shit-done/workflows/autonomous.md, commands/gsd/manager.md, get-shit-done/workflows/manager.md                                                     |
| 2026-04-07 15:20 | P1         | 增加 completion_gate 与失败超时部分完成回收二次分派规则  | 完成 | get-shit-done/workflows/autonomous.md, get-shit-done/workflows/manager.md                                                                                                          |
| 2026-04-07 15:20 | P1         | 同步 P1 状态进度任务勾选与验收记录                       | 完成 | .plans/master-agent-dispatch-plan.md                                                                                                                                               |
| 2026-04-07 15:36 | P1         | 复核五文件差异正文并补齐验收证据路径                     | 完成 | git diff -- commands/gsd/autonomous.md get-shit-done/workflows/autonomous.md commands/gsd/manager.md get-shit-done/workflows/manager.md .plans/master-agent-dispatch-plan.md       |
| 2026-04-07 15:37 | P1         | 执行仓库测试验证                                         | 完成 | npm test                                                                                                                                                                           |
| 2026-04-07 15:48 | P1         | 执行构建脚本可用性检查                                   | 完成 | `npm run build`（脚本缺失）与 `npm run`（脚本清单）                                                                                                                                |
| 2026-04-07 15:50 | P1         | 执行代码块闭合核验                                       | 完成 | `node -e` 统计代码围栏（autonomous/manager 均为偶数）                                                                                                                              |
| 2026-04-07 15:50 | P1         | 执行 IDE 诊断连接检查                                    | 完成 | `ide-get_diagnostics`（IDE connection not available）                                                                                                                              |
| 2026-04-08 03:05 | P2         | 固化主 agent 白名单黑名单规范与跨运行时 L1/L2 兼容策略   | 完成 | docs/ARCHITECTURE.md, docs/FEATURES.md, docs/CONFIGURATION.md                                                                                                                      |
| 2026-04-08 03:06 | P2         | 同步文档与计划状态，补充 P2 验收记录                     | 完成 | .plans/master-agent-dispatch-plan.md                                                                                                                                               |
| 2026-04-08 03:10 | P2         | 回填 P2-3/P2-4 审计与最小回归验收证据并完成收口          | 完成 | tmp/p2/master-agent-dispatch-audit.json, tmp/p2/master-agent-min-regression.json, tmp/p2/master-agent-dispatch-audit-via-npm.json, tmp/p2/master-agent-min-regression-via-npm.json |

## 执行记录规范

1. 每执行完一部分，立即更新对应任务勾选状态。
2. 同步更新阶段状态、阶段进度、变更日志。
3. 每次更新必须附一条可追踪证据路径。
