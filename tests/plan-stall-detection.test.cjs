const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planPhasePath = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'plan-phase.md');
const planPhaseContent = fs.readFileSync(planPhasePath, 'utf8');

describe('plan-phase stall detection', () => {
  test('plan-phase.md contains stall detection', () => {
    assert.ok(
      /[Ss]tall detection/i.test(planPhaseContent),
      'plan-phase.md should mention stall detection'
    );
  });

  test('plan-phase.md mentions fingerprint normalization', () => {
    assert.ok(
      /fingerprint normalization/i.test(planPhaseContent) ||
      /normalize.*fingerprint/i.test(planPhaseContent) ||
      /normaliz.*issue/i.test(planPhaseContent),
      'plan-phase.md should describe fingerprint normalization rules'
    );
  });

  test('plan-phase.md preserves the 3-iteration cap as backstop', () => {
    assert.ok(
      /iteration_count\s*>=\s*3/i.test(planPhaseContent) ||
      /max\s+3\s+iteration/i.test(planPhaseContent) ||
      /Max 3 Iterations/i.test(planPhaseContent),
      'plan-phase.md should still have the 3-iteration cap'
    );
  });

  test('plan-phase.md mentions developer input escalation for stalled loops', () => {
    assert.ok(
      /developer input/i.test(planPhaseContent),
      'plan-phase.md should mention developer input for stalled loops'
    );
    assert.ok(
      /requirements clarification/i.test(planPhaseContent),
      'plan-phase.md should mention requirements clarification'
    );
  });

  test('plan-phase.md includes stall recovery suggestions', () => {
    assert.ok(
      /REQUIREMENTS\.md/i.test(planPhaseContent),
      'plan-phase.md should suggest updating REQUIREMENTS.md'
    );
    assert.ok(
      /gsd-discuss-phase/i.test(planPhaseContent),
      'plan-phase.md should suggest running /gsd-discuss-phase'
    );
    assert.ok(
      /--skip-verify/i.test(planPhaseContent),
      'plan-phase.md should suggest using --skip-verify to bypass the plan-checker'
    );
  });

  test('stall detection occurs before sending to planner', () => {
    const stallIdx = planPhaseContent.indexOf('Stall detection');
    const sendIdx = planPhaseContent.indexOf('Sending back to planner for revision');
    assert.ok(stallIdx > 0, 'Stall detection section should exist');
    assert.ok(sendIdx > 0, 'Send to planner section should exist');
    assert.ok(
      stallIdx < sendIdx,
      'Stall detection should appear before sending back to planner'
    );
  });

  test('fingerprint normalization includes lowercase and whitespace collapsing', () => {
    assert.ok(
      /[Cc]onvert to lowercase/i.test(planPhaseContent),
      'Normalization should include lowercase conversion'
    );
    assert.ok(
      /[Cc]ollapse whitespace/i.test(planPhaseContent),
      'Normalization should include whitespace collapsing'
    );
  });

  test('fingerprint normalization includes line number and path removal', () => {
    assert.ok(
      /[Rr]emove line number/i.test(planPhaseContent),
      'Normalization should include line number removal'
    );
    assert.ok(
      /[Rr]emove file path/i.test(planPhaseContent),
      'Normalization should include file path removal'
    );
  });
});
