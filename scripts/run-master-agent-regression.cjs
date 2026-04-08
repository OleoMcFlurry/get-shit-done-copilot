#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

const MINIMAL_REGRESSION_TESTS = [
  'tests/master-agent-dispatch-regression.test.cjs',
  'tests/master-agent-dispatch-audit.test.cjs',
  'tests/workflow-compat.test.cjs',
];

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

function runSingleTest(testFile) {
  const result = spawnSync(
    process.execPath,
    ['--test', '--test-concurrency=1', testFile],
    {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      env: { ...process.env },
    }
  );

  return {
    file: testFile,
    passed: result.status === 0,
    exitCode: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function runMinimalRegressionSuite() {
  const startedAt = new Date();
  const testResults = MINIMAL_REGRESSION_TESTS.map(runSingleTest);
  const endedAt = new Date();

  const passed = testResults.every(item => item.passed);

  return {
    suite: 'master-agent-dispatch-minimal-regression',
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    total: testResults.length,
    passed: testResults.filter(item => item.passed).length,
    failed: testResults.filter(item => !item.passed).length,
    overallPassed: passed,
    tests: testResults,
  };
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

function printTextReport(result) {
  console.log('主 agent 调度最小回归测试报告');
  console.log(`状态: ${result.overallPassed ? '通过' : '失败'}`);
  console.log(`总数: ${result.total}`);
  console.log(`通过: ${result.passed}`);
  console.log(`失败: ${result.failed}`);

  for (const item of result.tests) {
    console.log(`\n[${item.passed ? 'PASS' : 'FAIL'}] ${item.file}`);
    console.log(`exitCode=${item.exitCode}`);
    if (!item.passed && item.stderr.trim()) {
      console.log('stderr:');
      console.log(item.stderr.trim());
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = runMinimalRegressionSuite();

  writeReport(args.reportPath, result);

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    printTextReport(result);
  }

  process.exit(result.overallPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  MINIMAL_REGRESSION_TESTS,
  parseArgs,
  runMinimalRegressionSuite,
};
