const test = require('node:test');
const assert = require('node:assert/strict');
const { shingleSet, jaccardIndex, similarityScore } = require('../src/similarity.js');

test('identical texts score exactly 100', () => {
  const t = 'the quick brown fox jumps over the lazy dog';
  assert.equal(similarityScore(t, t), 100);
});

test('unrelated texts score low', () => {
  const a = 'quantum mechanics describes the behaviour of subatomic particles';
  const b = 'the recipe calls for two cups of flour and a pinch of salt';
  assert.ok(similarityScore(a, b) < 15, 'expected a low score for unrelated text');
});

test('paraphrased overlap scores meaningfully high but not 100', () => {
  const a = 'A block of mass 2 kg slides down a frictionless incline at 30 degrees.';
  const b = 'A block of mass 2 kg slides down a smooth incline at 30 degrees.';
  const score = similarityScore(a, b);
  assert.ok(score > 40 && score < 100, 'score was ' + score + ', expected between 40 and 100');
});

test('empty strings do not throw and score 0', () => {
  assert.equal(similarityScore('', ''), 0);
  assert.equal(similarityScore('something', ''), 0);
});

test('shingleSet is case-insensitive and whitespace-normalising', () => {
  const a = shingleSet('Hello   World');
  const b = shingleSet('hello world');
  assert.deepEqual(a, b);
});

test('jaccardIndex of a set with itself is 1', () => {
  const s = shingleSet('some sample text for shingling');
  assert.equal(jaccardIndex(s, s), 1);
});
