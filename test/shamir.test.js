const test = require('node:test');
const assert = require('node:assert/strict');
const Shamir = require('../src/shamir.js');

test('GF(256) log table is a full 255-cycle (generator 3 is primitive for this field)', () => {
  const seen = new Set();
  for (let x = 1; x < 256; x++) seen.add(Shamir._internal.GF_LOG[x]);
  assert.equal(seen.size, 255, 'expected all 255 nonzero elements to have a distinct log value');
});

test('gfMul/gfDiv are consistent inverses across sampled nonzero pairs', () => {
  for (let a = 1; a < 256; a += 7) {
    for (let b = 1; b < 256; b += 11) {
      const product = Shamir.gfMul(a, b);
      assert.equal(Shamir.gfDiv(product, b), a);
    }
  }
});

test('gfMul is commutative and zero-absorbing', () => {
  assert.equal(Shamir.gfMul(0, 200), 0);
  assert.equal(Shamir.gfMul(200, 0), 0);
  assert.equal(Shamir.gfMul(53, 91), Shamir.gfMul(91, 53));
});

test('splitByte throws on invalid k/n', () => {
  assert.throws(() => Shamir.splitByte(10, 1, 6)); // k < 2
  assert.throws(() => Shamir.splitByte(10, 6, 4)); // n < k
});

test('any k of n shares reconstruct a byte exactly, across many random secrets and random subsets', () => {
  for (let trial = 0; trial < 300; trial++) {
    const secretByte = Math.floor(Math.random() * 256);
    const shares = Shamir.splitByte(secretByte, 4, 6);
    const allXs = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    const subset = allXs.slice(0, 4);
    const points = subset.map((x) => [x, shares[x - 1]]);
    assert.equal(Shamir.reconstructByte(points), secretByte);
  }
});

test('more than k shares still reconstruct correctly', () => {
  for (let trial = 0; trial < 50; trial++) {
    const secretByte = Math.floor(Math.random() * 256);
    const shares = Shamir.splitByte(secretByte, 4, 6);
    const points = [1, 2, 3, 4, 5, 6].map((x) => [x, shares[x - 1]]);
    assert.equal(Shamir.reconstructByte(points), secretByte);
  }
});

test('fewer than k shares do not reliably reconstruct the byte', () => {
  const trials = 200;
  let mismatches = 0;
  for (let t = 0; t < trials; t++) {
    const secretByte = Math.floor(Math.random() * 256);
    const shares = Shamir.splitByte(secretByte, 4, 6);
    const points = [
      [1, shares[0]],
      [2, shares[1]],
    ]; // only 2 of the required 4
    if (Shamir.reconstructByte(points) !== secretByte) mismatches++;
  }
  assert.ok(
    mismatches > trials * 0.9,
    'expected almost all 2-of-4 attempts to fail, got ' + mismatches + '/' + trials
  );
});

test('splitSecret/reconstructSecret round-trip a full string with any 4 of 6 shares', () => {
  const secret = 'ALPHA-SEAL-9F2C';
  const table = Shamir.splitSecret(secret, 4, 6);
  assert.equal(Shamir.reconstructSecret(table, [1, 2, 3, 4]), secret);
  assert.equal(Shamir.reconstructSecret(table, [3, 4, 5, 6]), secret);
  assert.equal(Shamir.reconstructSecret(table, [2, 3, 5, 6]), secret);
  assert.equal(Shamir.reconstructSecret(table, [1, 2, 3, 4, 5, 6]), secret);
});

test('splitSecret/reconstructSecret with fewer than k shares does not return the secret', () => {
  const secret = 'ALPHA-SEAL-9F2C';
  const table = Shamir.splitSecret(secret, 4, 6);
  assert.notEqual(Shamir.reconstructSecret(table, [1, 2]), secret);
  assert.equal(Shamir.reconstructSecret(table, []), '');
});
