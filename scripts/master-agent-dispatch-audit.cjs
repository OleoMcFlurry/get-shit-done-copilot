#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const AUDIT_SPEC = [
  {
    id: 'DO_COMPLETION_GATE',
    file: 'get-shit-done/workflows/do.md',
    mustInclude: [
      { pattern: /<step name="completion_gate" required="true">/, message: '缺少 required completion_gate 步骤' },
      { pattern: /After the dispatched command returns, call AskUserQuestion/, message: '缺少 AskUserQuestion 收尾闸门' },
      { pattern: /Never exit immediately after dispatch without running this ask gate/, message: '缺少未提问不得结束约束' },
    ],
  },
  {
    id: 'NEXT_COMPLETION_GATE',
    file: 'get-shit-done/workflows/next.md',
    mustInclude: [
      { pattern: /<step name="completion_gate" required="true">/, message: '缺少 required completion_gate 步骤' },
      { pattern: /After the invoked command returns, call AskUserQuestion/, message: '缺少 AskUserQuestion 收尾闸门' },
      { pattern: /Completion is valid only after ask gate response is processed/, message: '缺少 ask gate 完成前不得结束约束' },
    ],
  },
  {
    id: 'AUTONOMOUS_COMMAND_DISPATCH_ONLY',
    file: 'commands/gsd/autonomous.md',
    mustInclude: [
      { pattern: /主 agent 只负责/, message: '缺少主 agent 只调度声明' },
      { pattern: /不直接执行/, message: '缺少主 agent 不直执声明' },
      { pattern: /必须委派子代理/, message: '缺少执行动作委派子代理声明' },
      { pattern: /completion_gate/, message: '缺少 completion_gate 约束' },
    ],
  },
  {
    id: 'MANAGER_COMMAND_DISPATCH_ONLY',
    file: 'commands/gsd/manager.md',
    mustInclude: [
      { pattern: /主 agent 仅负责/, message: '缺少主 agent 仅调度声明' },
      { pattern: /不直接执行/, message: '缺少主 agent 不直执声明' },
      { pattern: /必须委派子代理/, message: '缺少执行动作委派子代理声明' },
      { pattern: /completion_gate/, message: '缺少 completion_gate 约束' },
    ],
  },
  {
    id: 'EXECUTE_PHASE_COMMAND_DISPATCH_ONLY',
    file: 'commands/gsd/execute-phase.md',
    mustInclude: [
      { pattern: /主 agent 仅负责编排/, message: '缺少主 agent 编排声明' },
      { pattern: /必须由子代理完成/, message: '缺少执行动作委派子代理声明' },
      { pattern: /执行阶段性结果后必须进入 completion_gate/, message: '缺少 completion_gate 约束' },
    ],
  },
  {
    id: 'AUTONOMOUS_WORKFLOW_BLOCKER_AND_GATE',
    file: 'get-shit-done/workflows/autonomous.md',
    mustInclude: [
      { pattern: /<step name="completion_gate">/, message: '缺少 completion_gate 步骤' },
      { pattern: /AskUserQuestion 或 ask_user/, message: '缺少统一提问工具约束' },
      { pattern: /失败、超时、部分完成/, message: '缺少失败超时部分完成覆盖' },
      { pattern: /回收并二次分派/, message: '缺少回收并二次分派策略' },
    ],
    mustNotInclude: [
      { pattern: /主 agent\s+直接执行/, message: '出现主 agent 直接执行描述，违反调度约束' },
    ],
  },
  {
    id: 'MANAGER_WORKFLOW_BLOCKER_AND_GATE',
    file: 'get-shit-done/workflows/manager.md',
    mustInclude: [
      { pattern: /discuss、plan、execute、verify、complete 一律委派子代理/, message: '缺少执行动作统一委派子代理约束' },
      { pattern: /任一关键结果返回后必须先进入 `completion_gate`/, message: '缺少关键结果后进入 completion_gate 约束' },
      { pattern: /AskUserQuestion 或 ask_user/, message: '缺少统一提问工具约束' },
      { pattern: /失败、超时、部分完成/, message: '缺少失败超时部分完成覆盖' },
    ],
  },
  {
    id: 'EXECUTE_PHASE_RUNTIME_COMPAT_AND_GATE',
    file: 'get-shit-done/workflows/execute-phase.md',
    mustInclude: [
      { pattern: /强制规则：主 agent 仅负责编排与门控/, message: '缺少主 agent 仅编排门控强制规则' },
      { pattern: /必须由 `gsd-executor` 子代理执行计划/, message: '缺少 Copilot 子代理执行强制规则' },
      { pattern: /不得降级为主流程执行/, message: '缺少禁止降级主流程执行约束' },
      { pattern: /若运行时不支持 Task 或等效子代理能力，必须立即调用 AskUserQuestion/, message: '缺少不支持 Task 时的强制提问策略' },
    ],
    mustNotInclude: [
      { pattern: /fallback to inline execution/i, message: '出现 inline 执行降级描述，违反防漂移约束' },
    ],
  },
  {
    id: 'TEMPLATE_GLOBAL_ASK_GATE',
    file: 'get-shit-done/templates/copilot-instructions.md',
    mustInclude: [
      { pattern: /ALWAYS: \(1\) offer the user the next step by prompting via `ask_user`/, message: '缺少全局 ask_user 闭环约束' },
      { pattern: /For `gsd-do` and `gsd-next`, enforce a completion gate/, message: '缺少 do\/next completion gate 一致性约束' },
    ],
  },
];

function defaultRead(rootDir, relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

function runAudit(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const reader = options.readFile || (relPath => defaultRead(rootDir, relPath));

  const checks = [];

  for (const rule of AUDIT_SPEC) {
    const failures = [];
    let content = '';

    try {
      content = reader(rule.file);
    } catch (error) {
      failures.push(`文件读取失败: ${rule.file} (${error.message})`);
      checks.push({
        id: rule.id,
        file: rule.file,
        passed: false,
        failures,
      });
      continue;
    }

    for (const condition of rule.mustInclude || []) {
      if (!condition.pattern.test(content)) {
        failures.push(condition.message);
      }
    }

    for (const condition of rule.mustNotInclude || []) {
      if (condition.pattern.test(content)) {
        failures.push(condition.message);
      }
    }

    checks.push({
      id: rule.id,
      file: rule.file,
      passed: failures.length === 0,
      failures,
    });
  }

  const passed = checks.every(item => item.passed);
  return {
    timestamp: new Date().toISOString(),
    rootDir,
    totalChecks: checks.length,
    passedChecks: checks.filter(item => item.passed).length,
    failedChecks: checks.filter(item => !item.passed).length,
    passed,
    checks,
  };
}

function parseArgs(argv) {
  const args = {
    json: false,
    reportPath: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') {
      args.json = true;
      continue;
    }
    if (token === '--report') {
      args.reportPath = argv[i + 1] || '';
      i += 1;
    }
  }

  return args;
}

function printTextReport(result) {
  console.log('主 agent 调度行为审计报告');
  console.log(`状态: ${result.passed ? '通过' : '失败'}`);
  console.log(`检查项: ${result.totalChecks}`);
  console.log(`通过: ${result.passedChecks}`);
  console.log(`失败: ${result.failedChecks}`);

  for (const item of result.checks) {
    console.log(`\n[${item.passed ? 'PASS' : 'FAIL'}] ${item.id}`);
    console.log(`文件: ${item.file}`);
    if (!item.passed) {
      for (const failure of item.failures) {
        console.log(`  - ${failure}`);
      }
    }
  }
}

function writeReport(reportPath, result) {
  if (!reportPath) {
    return;
  }
  const absolutePath = path.isAbsolute(reportPath)
    ? reportPath
    : path.join(process.cwd(), reportPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = runAudit();

  writeReport(args.reportPath, result);

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    printTextReport(result);
  }

  process.exit(result.passed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  AUDIT_SPEC,
  runAudit,
  parseArgs,
};
