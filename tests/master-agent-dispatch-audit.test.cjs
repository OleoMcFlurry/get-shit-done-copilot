/**
 * 主 agent 调度行为审计脚本测试
 *
 * 目标：确保行为审计与防漂移检查在关键约束缺失时可准确失败。
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { runAudit, AUDIT_SPEC } = require('../scripts/master-agent-dispatch-audit.cjs');

const ROOT = path.join(__dirname, '..');

describe('master-agent dispatch audit script', () => {
  test('审计规范包含预期关键检查项', () => {
    const ids = AUDIT_SPEC.map(item => item.id).sort();

    assert.ok(ids.includes('DO_COMPLETION_GATE'), '缺少 do completion gate 检查项');
    assert.ok(ids.includes('NEXT_COMPLETION_GATE'), '缺少 next completion gate 检查项');
    assert.ok(ids.includes('AUTONOMOUS_COMMAND_DISPATCH_ONLY'), '缺少 autonomous command 调度检查项');
    assert.ok(ids.includes('MANAGER_COMMAND_DISPATCH_ONLY'), '缺少 manager command 调度检查项');
    assert.ok(ids.includes('EXECUTE_PHASE_RUNTIME_COMPAT_AND_GATE'), '缺少 execute-phase 运行时兼容检查项');
  });

  test('当前仓库内容通过行为审计', () => {
    const result = runAudit({ rootDir: ROOT });

    assert.equal(result.passed, true, `行为审计失败: ${JSON.stringify(result, null, 2)}`);
    assert.equal(result.failedChecks, 0, '当前仓库不应存在失败检查项');
  });

  test('当关键约束缺失时，审计应失败并给出定位', () => {
    const targetFile = 'get-shit-done/workflows/do.md';
    const original = require('fs').readFileSync(path.join(ROOT, targetFile), 'utf8');
    const mutated = original.replace('Never exit immediately after dispatch without running this ask gate.', '');

    const result = runAudit({
      rootDir: ROOT,
      readFile(relPath) {
        if (relPath === targetFile) {
          return mutated;
        }
        return require('fs').readFileSync(path.join(ROOT, relPath), 'utf8');
      },
    });

    assert.equal(result.passed, false, '关键约束被删除后应审计失败');

    const failed = result.checks.find(item => item.id === 'DO_COMPLETION_GATE');
    assert.ok(failed, '应定位到 DO_COMPLETION_GATE 检查项');
    assert.equal(failed.passed, false, 'DO_COMPLETION_GATE 应失败');
    assert.ok(
      failed.failures.some(message => message.includes('未提问不得结束')),
      `失败原因应包含未提问不得结束约束: ${JSON.stringify(failed.failures)}`
    );
  });
});
