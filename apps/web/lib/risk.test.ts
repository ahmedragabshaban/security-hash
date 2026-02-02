import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classifyRisk, computeRiskScore } from './risk';

test('computeRiskScore returns low risk for strong, unbreached inputs', () => {
  const score = computeRiskScore({ breachCount: 0, zxcvbnScore: 4, length: 20, characterSets: 3 });
  assert.ok(score < 40);
  assert.equal(classifyRisk(score, 0), 'Safe-ish');
});

test('computeRiskScore returns unsafe for breached inputs', () => {
  const score = computeRiskScore({ breachCount: 1, zxcvbnScore: 4, length: 20, characterSets: 4 });
  assert.equal(score, 100);
  assert.equal(classifyRisk(score, 1), 'Unsafe');
});

test('computeRiskScore returns risky/unsafe for weak inputs even when unbreached', () => {
  const score = computeRiskScore({ breachCount: 0, zxcvbnScore: 0, length: 6, characterSets: 1 });
  assert.ok(score > 0);
  assert.notEqual(classifyRisk(score, 0), 'Safe-ish');
});
