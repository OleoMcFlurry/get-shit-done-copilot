/**
 * GSD Tools Tests - gsd-sprint command and workflow
 *
 * Validates that the sprint command definition and workflow correctly implement
 * the front-load discuss → review gate → autonomous execution flow.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('gsd-sprint command definition', () => {
  const commandPath = path.join(__dirname, '..', 'commands', 'gsd', 'sprint.md');

  test('commands/gsd/sprint.md exists', () => {
    assert.ok(fs.existsSync(commandPath), 'sprint command file should exist');
  });

  test('command has correct name in frontmatter', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    assert.ok(content.includes('name: gsd:sprint'), 'frontmatter should have name: gsd:sprint');
  });

  test('command has a description', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    assert.ok(content.includes('description:'), 'frontmatter should have a description');
  });

  test('argument-hint includes all five sprint flags', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    const hintMatch = content.match(/argument-hint:.*\r?\n/);
    assert.ok(hintMatch, 'command should have argument-hint');
    assert.ok(content.includes('--from-scratch'), 'argument-hint should include --from-scratch');
    assert.ok(content.includes('--auto'), 'argument-hint should include --auto');
    assert.ok(content.includes('--skip-discuss'), 'argument-hint should include --skip-discuss');
    assert.ok(content.includes('--from N'), 'argument-hint should include --from N');
    assert.ok(content.includes('--to N'), 'argument-hint should include --to N');
  });

  test('allowed-tools includes required tools', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    assert.ok(content.includes('- Read'), 'should allow Read tool');
    assert.ok(content.includes('- Write'), 'should allow Write tool');
    assert.ok(content.includes('- Bash'), 'should allow Bash tool');
    assert.ok(content.includes('- Task'), 'should allow Task tool');
    assert.ok(content.includes('- AskUserQuestion'), 'should allow AskUserQuestion tool');
  });

  test('execution_context references sprint.md workflow', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    assert.ok(
      content.includes('sprint.md'),
      'execution_context should reference sprint.md workflow'
    );
  });

  test('command has a <process> block', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    assert.ok(content.includes('<process>') && content.includes('</process>'), 'should have a <process> block');
  });

  test('command context block describes all five flags', () => {
    const content = fs.readFileSync(commandPath, 'utf8');
    const contextMatch = content.match(/<context>([\s\S]*?)<\/context>/);
    assert.ok(contextMatch, 'command should have a <context> block');
    const context = contextMatch[1];
    assert.ok(context.includes('--from-scratch'), 'context should describe --from-scratch');
    assert.ok(context.includes('--auto'), 'context should describe --auto');
    assert.ok(context.includes('--skip-discuss'), 'context should describe --skip-discuss');
    assert.ok(context.includes('--from N'), 'context should describe --from N');
    assert.ok(context.includes('--to N'), 'context should describe --to N');
  });
});

describe('gsd-sprint workflow', () => {
  const workflowPath = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'sprint.md');

  test('get-shit-done/workflows/sprint.md exists', () => {
    assert.ok(fs.existsSync(workflowPath), 'sprint workflow file should exist');
  });

  test('workflow has all four steps', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('<step name="initialize"'), 'should have initialize step');
    assert.ok(content.includes('<step name="discover_phases"'), 'should have discover_phases step');
    assert.ok(content.includes('<step name="front_load_discuss"'), 'should have front_load_discuss step');
    assert.ok(content.includes('<step name="review_gate"'), 'should have review_gate step');
    assert.ok(content.includes('<step name="execute"'), 'should have execute step');
  });

  // --- Flag parsing ---

  test('workflow parses --from-scratch flag', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('--from-scratch') && content.includes('FROM_SCRATCH'),
      'workflow should parse --from-scratch into FROM_SCRATCH variable'
    );
  });

  test('workflow parses --auto flag', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('--auto') && content.includes('AUTO'),
      'workflow should parse --auto into AUTO variable'
    );
  });

  test('workflow parses --skip-discuss flag', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('--skip-discuss') && content.includes('SKIP_DISCUSS'),
      'workflow should parse --skip-discuss into SKIP_DISCUSS variable'
    );
  });

  test('workflow parses --from N into FROM_PHASE', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('--from') && content.includes('FROM_PHASE') && content.includes('[0-9]'),
      'workflow should parse --from N into FROM_PHASE with numeric extraction'
    );
  });

  test('workflow parses --to N into TO_PHASE', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('--to') && content.includes('TO_PHASE') && content.includes('[0-9]'),
      'workflow should parse --to N into TO_PHASE with numeric extraction'
    );
  });

  // --- Milestone init ---

  test('workflow runs init milestone-op', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('init milestone-op'),
      'workflow should bootstrap via gsd-tools.cjs init milestone-op'
    );
  });

  test('workflow errors when no ROADMAP.md and no --from-scratch', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('roadmap_exists') && content.includes('gsd-new-milestone'),
      'workflow should error when roadmap_exists is false and suggest gsd-new-milestone'
    );
  });

  test('workflow runs gsd-new-milestone when --from-scratch is set', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('FROM_SCRATCH') && content.includes('gsd:new-milestone'),
      'workflow should invoke gsd:new-milestone when --from-scratch is set'
    );
  });

  test('workflow displays sprint banner with milestone info', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('GSD ► SPRINT') && content.includes('milestone_version'),
      'workflow should display sprint banner with milestone version'
    );
  });

  // --- Phase discovery ---

  test('workflow calls roadmap analyze for phase discovery', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('roadmap analyze'),
      'workflow should call roadmap analyze in discover_phases step'
    );
  });

  test('workflow applies --from and --to filters to phase list', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const discoverSection = content.substring(content.indexOf('<step name="discover_phases">'));
    assert.ok(
      discoverSection.includes('FROM_PHASE') && discoverSection.includes('TO_PHASE'),
      'discover_phases step should apply FROM_PHASE and TO_PHASE filters'
    );
  });

  test('workflow exits cleanly when no incomplete phases remain', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('NOTHING TO DO') || content.includes('Nothing to do') || content.includes('already complete'),
      'workflow should exit cleanly when all phases in scope are complete'
    );
  });

  // --- Front-load discuss ---

  test('front_load_discuss step skips when --skip-discuss is set', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const discussSection = content.substring(content.indexOf('<step name="front_load_discuss">'));
    assert.ok(
      discussSection.includes('SKIP_DISCUSS') && (discussSection.includes('Skip this entire step') || discussSection.includes('skip Stage 2') || discussSection.includes('Discuss skipped')),
      'front_load_discuss should be skippable via SKIP_DISCUSS'
    );
  });

  test('front_load_discuss checks has_context before discussing each phase', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const discussSection = content.substring(content.indexOf('<step name="front_load_discuss">'));
    assert.ok(
      discussSection.includes('has_context') && discussSection.includes('init phase-op'),
      'front_load_discuss should check has_context via init phase-op before each discuss'
    );
  });

  test('front_load_discuss invokes discuss-phase with --auto --discuss-only', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const discussSection = content.substring(content.indexOf('<step name="front_load_discuss">'));
    assert.ok(
      discussSection.includes('gsd:discuss-phase') &&
      discussSection.includes('--auto') &&
      discussSection.includes('--discuss-only'),
      'front_load_discuss should invoke gsd:discuss-phase with --auto --discuss-only'
    );
  });

  test('front_load_discuss verifies CONTEXT.md was written after each discuss', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const discussSection = content.substring(content.indexOf('<step name="front_load_discuss">'));
    assert.ok(
      discussSection.includes('CONTEXT.md') && (discussSection.includes('CONTEXT_OK') || discussSection.includes('CONTEXT_MISSING') || discussSection.includes('verify') || discussSection.includes('Verify')),
      'front_load_discuss should verify CONTEXT.md exists after each discuss'
    );
  });

  test('front_load_discuss handles missing CONTEXT.md as warning not error', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const discussSection = content.substring(content.indexOf('<step name="front_load_discuss">'));
    assert.ok(
      discussSection.includes('⚠️') || discussSection.includes('warning') || discussSection.includes('continue'),
      'front_load_discuss should continue sprint even if CONTEXT.md is missing (warning not fatal error)'
    );
  });

  // --- Review gate ---

  test('review_gate is skipped when --auto is set', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const gateSection = content.substring(content.indexOf('<step name="review_gate">'));
    assert.ok(
      gateSection.includes('AUTO') && (gateSection.includes('Skip this step') || gateSection.includes('skip this step') || gateSection.includes('Proceed directly')),
      'review_gate should be skipped when AUTO is set'
    );
  });

  test('review_gate generates SPRINT-SUMMARY.md', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const gateSection = content.substring(content.indexOf('<step name="review_gate">'));
    assert.ok(
      gateSection.includes('SPRINT-SUMMARY.md'),
      'review_gate should generate SPRINT-SUMMARY.md'
    );
  });

  test('review_gate caps decisions per phase at 5', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const gateSection = content.substring(content.indexOf('<step name="review_gate">'));
    assert.ok(
      gateSection.includes('5') && (gateSection.includes('max 5') || gateSection.includes('up to 5')),
      'review_gate should cap decisions shown per phase at 5'
    );
  });

  test('review_gate offers Execute, Re-discuss, and Exit options', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const gateSection = content.substring(content.indexOf('<step name="review_gate">'));
    assert.ok(gateSection.includes('Execute'), 'review gate should offer Execute option');
    assert.ok(
      gateSection.includes('Re-discuss') || gateSection.includes('re-discuss'),
      'review gate should offer Re-discuss option'
    );
    assert.ok(gateSection.includes('Exit'), 'review gate should offer Exit option');
  });

  test('review_gate Exit option instructs to run /gsd-autonomous later', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const gateSection = content.substring(content.indexOf('<step name="review_gate">'));
    assert.ok(
      gateSection.includes('gsd-autonomous'),
      'Exit path should tell user to run /gsd-autonomous when ready'
    );
  });

  // --- Execute stage ---

  test('execute step delegates to gsd:autonomous', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const execSection = content.substring(content.indexOf('<step name="execute">'));
    assert.ok(
      execSection.includes('gsd:autonomous'),
      'execute step should delegate to gsd:autonomous via Skill tool'
    );
  });

  test('execute step passes --from and --to flags to autonomous', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const execSection = content.substring(content.indexOf('<step name="execute">'));
    assert.ok(
      execSection.includes('FROM_PHASE') && execSection.includes('TO_PHASE'),
      'execute step should forward FROM_PHASE and TO_PHASE to autonomous'
    );
  });

  test('execute step explains autonomous will skip discuss for phases with CONTEXT.md', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const execSection = content.substring(content.indexOf('<step name="execute">'));
    assert.ok(
      execSection.includes('CONTEXT.md') && (execSection.includes('skip') || execSection.includes('Skip')),
      'execute step should explain that autonomous skips discuss when CONTEXT.md exists'
    );
  });
});
