/**
 * 主 agent 调度化改造回归测试
 *
 * 目标：为 master-agent-dispatch-plan 的 P0/P1 验收约束提供自动化守护，
 * 防止后续变更破坏“主 agent 仅调度 + completion_gate 强制提问”基线。
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('master-agent dispatch regression', () => {
  test('do workflow 必须包含 completion_gate 与 AskUserQuestion 收尾闸门', () => {
    const content = read('get-shit-done/workflows/do.md');

    assert.ok(
      content.includes('<step name="completion_gate"'),
      'do workflow 缺少 completion_gate 步骤'
    );
    assert.ok(
      content.includes('After the dispatched command returns, call AskUserQuestion'),
      'do workflow completion_gate 缺少 AskUserQuestion 约束'
    );
    assert.ok(
      content.includes('Never exit immediately after dispatch without running this ask gate'),
      'do workflow 未声明“未提问不得结束”约束'
    );
  });

  test('next workflow 必须包含 completion_gate 与 AskUserQuestion 收尾闸门', () => {
    const content = read('get-shit-done/workflows/next.md');

    assert.ok(
      content.includes('<step name="completion_gate" required="true">'),
      'next workflow 缺少 required completion_gate 步骤'
    );
    assert.ok(
      content.includes('After the invoked command returns, call AskUserQuestion'),
      'next workflow completion_gate 缺少 AskUserQuestion 约束'
    );
    assert.ok(
      content.includes('Completion is valid only after ask gate response is processed'),
      'next workflow 未声明 ask gate 完成前不得结束'
    );
  });

  test('next command 必须声明 AskUserQuestion 工具', () => {
    const content = read('commands/gsd/next.md');

    assert.ok(
      content.includes('  - AskUserQuestion'),
      'next 命令未声明 AskUserQuestion 工具'
    );
  });

  test('autonomous command 必须声明主 agent 仅调度与 completion_gate', () => {
    const content = read('commands/gsd/autonomous.md');

    assert.ok(
      content.includes('主 agent 只负责') && content.includes('不直接执行'),
      'autonomous 命令未明确主 agent 仅调度约束'
    );
    assert.ok(
      content.includes('必须委派子代理'),
      'autonomous 命令未明确执行动作全部委派子代理'
    );
    assert.ok(
      content.includes('completion_gate'),
      'autonomous 命令缺少 completion_gate 约束'
    );
  });

  test('manager command 必须声明主 agent 仅调度与 completion_gate', () => {
    const content = read('commands/gsd/manager.md');

    assert.ok(
      content.includes('主 agent 仅负责') && content.includes('不直接执行'),
      'manager 命令未明确主 agent 仅调度约束'
    );
    assert.ok(
      content.includes('必须委派子代理'),
      'manager 命令未明确执行动作全部委派子代理'
    );
    assert.ok(
      content.includes('completion_gate'),
      'manager 命令缺少 completion_gate 约束'
    );
  });

  test('autonomous workflow 必须包含统一 completion_gate 决策选项', () => {
    const content = read('get-shit-done/workflows/autonomous.md');
    const gateStart = content.indexOf('<step name="completion_gate">');
    const gateEnd = content.indexOf('</step>', gateStart);

    assert.ok(gateStart > -1 && gateEnd > gateStart, 'autonomous workflow 缺少 completion_gate 步骤');

    const gateSection = content.slice(gateStart, gateEnd);
    assert.ok(gateSection.includes('AskUserQuestion 或 ask_user'), 'completion_gate 缺少提问工具约束');
    assert.ok(gateSection.includes('继续主流程'), 'completion_gate 缺少“继续主流程”选项');
    assert.ok(gateSection.includes('查看详情后继续'), 'completion_gate 缺少“查看详情后继续”选项');
    assert.ok(gateSection.includes('停止并退出'), 'completion_gate 缺少“停止并退出”选项');
  });

  test('autonomous workflow 必须在阻塞分支覆盖失败超时部分完成并进入提问决策', () => {
    const content = read('get-shit-done/workflows/autonomous.md');
    const blockerStart = content.indexOf('<step name="handle_blocker">');
    const blockerEnd = content.indexOf('</step>', blockerStart);

    assert.ok(blockerStart > -1 && blockerEnd > blockerStart, 'autonomous workflow 缺少 handle_blocker 步骤');

    const blockerSection = content.slice(blockerStart, blockerEnd);
    assert.ok(blockerSection.includes('失败、超时、部分完成'), 'handle_blocker 未覆盖失败/超时/部分完成场景');
    assert.ok(blockerSection.includes('AskUserQuestion'), 'handle_blocker 未进入 AskUserQuestion 决策分支');
    assert.ok(blockerSection.includes('回收并二次分派'), 'handle_blocker 缺少“回收并二次分派”选项');
    assert.ok(blockerSection.includes('直接重试'), 'handle_blocker 缺少“直接重试”选项');
    assert.ok(blockerSection.includes('跳过当前阶段'), 'handle_blocker 缺少“跳过当前阶段”选项');
    assert.ok(blockerSection.includes('停止 autonomous'), 'handle_blocker 缺少“停止 autonomous”选项');
  });

  test('manager workflow 必须声明执行动作委派子代理并在关键结果后进入 completion_gate', () => {
    const content = read('get-shit-done/workflows/manager.md');

    assert.ok(
      content.includes('discuss、plan、execute、verify、complete 一律委派子代理'),
      'manager workflow 未明确关键执行动作统一委派子代理'
    );
    assert.ok(
      content.includes('任一关键结果返回后必须先进入 `completion_gate`'),
      'manager workflow 未声明关键结果后必须进入 completion_gate'
    );
    assert.ok(
      content.includes('统一调用 AskUserQuestion 或 ask_user'),
      'manager workflow completion_gate 未声明统一提问方式'
    );
  });

  test('execute-phase command 必须声明主 agent 不直执与 completion_gate 收尾决策', () => {
    const content = read('commands/gsd/execute-phase.md');

    assert.ok(
      content.includes('主 agent 仅负责编排') && content.includes('必须由子代理完成'),
      'execute-phase 命令未明确主 agent 不直接执行'
    );
    assert.ok(
      content.includes('执行阶段性结果后必须进入 completion_gate'),
      'execute-phase 命令未声明阶段结果后的 completion_gate 约束'
    );
  });

  test('模板必须声明 gsd 命令全局 ask_user 闭环与 do/next completion gate', () => {
    const content = read('get-shit-done/templates/copilot-instructions.md');

    assert.ok(
      content.includes('ALWAYS: (1) offer the user the next step by prompting via `ask_user`'),
      '模板未声明全局 ask_user 闭环约束'
    );
    assert.ok(
      content.includes('For `gsd-do` and `gsd-next`, enforce a completion gate'),
      '模板未声明 do/next completion gate 一致性约束'
    );
  });
});
