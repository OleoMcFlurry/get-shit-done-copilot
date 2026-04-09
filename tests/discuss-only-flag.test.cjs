/**
 * GSD Tools Tests - discuss-phase --discuss-only flag
 *
 * Validates that the discuss-phase workflow correctly documents and implements
 * the --discuss-only flag which prevents auto-chaining to plan-phase.
 *
 * Used by gsd-sprint to front-load discuss across all phases without
 * triggering plan+execute per phase.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('discuss-phase --discuss-only flag', () => {
  const workflowPath = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'discuss-phase.md');

  test('discuss-phase.md exists', () => {
    assert.ok(fs.existsSync(workflowPath), 'discuss-phase.md should exist');
  });

  test('mode flags section documents --discuss-only', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('--discuss-only') && content.includes('Discuss-only mode'),
      'mode flags section should document Discuss-only mode'
    );
  });

  test('--discuss-only description states it combines with --auto', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const section = content.substring(content.indexOf('Discuss-only mode'), content.indexOf('Discuss-only mode') + 500);
    assert.ok(
      section.includes('--auto') && (section.includes('combine') || section.includes('Always combine')),
      '--discuss-only description should state it combines with --auto'
    );
  });

  test('--discuss-only description states it does NOT chain to plan-phase', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const section = content.substring(content.indexOf('Discuss-only mode'), content.indexOf('Discuss-only mode') + 600);
    assert.ok(
      section.includes('plan-phase') && (section.includes('NOT chain') || section.includes('Does NOT chain') || section.includes('not chain')),
      '--discuss-only description should state it does not chain to plan-phase'
    );
  });

  test('--discuss-only description mentions sprint orchestration use case', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const section = content.substring(content.indexOf('Discuss-only mode'), content.indexOf('Discuss-only mode') + 700);
    assert.ok(
      section.includes('sprint'),
      '--discuss-only description should mention sprint orchestration'
    );
  });

  test('auto_advance step has early return guard for --discuss-only', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const autoAdvanceSection = content.substring(content.indexOf('<step name="auto_advance">'));
    // The guard must appear at the TOP of auto_advance (before any config mutation)
    const guardIndex = autoAdvanceSection.indexOf('--discuss-only');
    const configMutationIndex = autoAdvanceSection.indexOf('_auto_chain_active');
    assert.ok(guardIndex !== -1, 'auto_advance step should have --discuss-only guard');
    assert.ok(
      guardIndex < configMutationIndex,
      '--discuss-only guard must appear before _auto_chain_active mutation in auto_advance step'
    );
  });

  test('--discuss-only early return instructs to skip the step entirely', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const autoAdvanceSection = content.substring(
      content.indexOf('<step name="auto_advance">'),
      content.indexOf('<step name="auto_advance">') + 400
    );
    assert.ok(
      autoAdvanceSection.includes('Skip this entire step') || autoAdvanceSection.includes('skip this entire step'),
      '--discuss-only guard should instruct agent to skip the entire auto_advance step'
    );
  });

  test('--discuss-only guard explicitly forbids setting _auto_chain_active', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const autoAdvanceSection = content.substring(content.indexOf('<step name="auto_advance">'));
    // Guard appears at top of auto_advance; check within the first ~500 chars
    const guardSection = autoAdvanceSection.substring(0, 500);
    assert.ok(
      guardSection.includes('_auto_chain_active') && (guardSection.includes('NOT') || guardSection.includes('Do NOT')),
      '--discuss-only guard should forbid setting workflow._auto_chain_active'
    );
  });

  test('--discuss-only guard explicitly forbids invoking plan-phase', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const autoAdvanceSection = content.substring(content.indexOf('<step name="auto_advance">'));
    const guardSection = autoAdvanceSection.substring(0, 500);
    assert.ok(
      guardSection.includes('plan-phase') && (guardSection.includes('NOT') || guardSection.includes('Do NOT')),
      '--discuss-only guard should forbid invoking plan-phase'
    );
  });
});
