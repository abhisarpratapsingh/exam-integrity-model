/**
 * shamir.js
 *
 * A from-scratch implementation of Shamir's Secret Sharing over GF(256),
 * used to demonstrate k-of-n threshold custody: a secret is split across
 * n shares such that any k of them reconstruct it exactly, and fewer
 * than k reveal nothing usable (not "a worse guess", nothing).
 *
 * Field notes:
 *   - Reduction polynomial: AES/Rijndael's x^8 + x^4 + x^3 + x + 1 (0x11B).
 *   - Generator: 3. Generator 2 is NOT primitive for this polynomial,
 *     it only cycles through 51 of the 255 nonzero field elements, which
 *     would silently produce a broken, non-bijective log table. This was
 *     verified computationally before writing this file; see
 *     test/shamir.test.js for the full-cycle assertion.
 *
 * This is a teaching-grade implementation built for a public
 * demonstration. It has not been independently security-audited and
 * uses Math.random() (not a CSPRNG) for polynomial coefficients. See
 * SECURITY.md before using this for anything beyond demonstration.
 *
 * Works unmodified in a browser via <script src="shamir.js"> (attaches
 * to `window.Shamir`) and in Node via require('./shamir.js').
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Shamir = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);

  (function buildTables() {
    function gfMulSlow(a, b) {
      let r = 0;
      for (let i = 0; i < 8; i++) {
        if (b & 1) r ^= a;
        const hi = a & 0x80;
        a = (a << 1) & 0xFF;
        if (hi) a ^= 0x1b;
        b >>= 1;
      }
      return r;
    }
    let x = 1;
    const GENERATOR = 3;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x = gfMulSlow(x, GENERATOR);
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  /** Multiply two GF(256) elements. */
  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  /** Divide two GF(256) elements (a / b). Throws on division by zero. */
  function gfDiv(a, b) {
    if (a === 0) return 0;
    if (b === 0) throw new Error('Shamir: division by zero in GF(256)');
    return GF_EXP[(GF_LOG[a] - GF_LOG[b] + 255) % 255];
  }

  /**
   * Split a single byte (0-255) into n shares with threshold k.
   * @param {number} secretByte
   * @param {number} k threshold, must be >= 2
   * @param {number} n total shares, must be >= k and <= 255
   * @returns {number[]} share values indexed 0..n-1, corresponding to x = 1..n
   */
  function splitByte(secretByte, k, n) {
    if (k < 2) throw new Error('Shamir: k must be at least 2');
    if (n < k) throw new Error('Shamir: n must be >= k');
    if (n > 255) throw new Error('Shamir: n must be <= 255');
    if (secretByte < 0 || secretByte > 255) throw new Error('Shamir: secretByte must be 0-255');

    const coeffs = [secretByte];
    for (let i = 1; i < k; i++) coeffs.push(Math.floor(Math.random() * 256));

    const shares = [];
    for (let x = 1; x <= n; x++) {
      let y = 0;
      for (let i = coeffs.length - 1; i >= 0; i--) y = gfMul(y, x) ^ coeffs[i];
      shares.push(y);
    }
    return shares;
  }

  /**
   * Reconstruct a byte from a set of (x, y) points via Lagrange
   * interpolation at x = 0 in GF(256). Works correctly with exactly k
   * points, or with more than k points as long as they all lie on the
   * same original polynomial. Fewer than k points reconstructs the
   * wrong value (not the secret), by design.
   * @param {Array<[number, number]>} points
   * @returns {number}
   */
  function reconstructByte(points) {
    let secret = 0;
    for (let i = 0; i < points.length; i++) {
      let num = 1;
      let den = 1;
      const xi = points[i][0];
      const yi = points[i][1];
      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const xj = points[j][0];
        num = gfMul(num, xj);
        den = gfMul(den, xi ^ xj);
      }
      secret ^= gfMul(yi, gfDiv(num, den));
    }
    return secret;
  }

  /**
   * Split a UTF-8 string secret into n shares with threshold k.
   * @param {string} secretText
   * @param {number} k
   * @param {number} n
   * @returns {number[][]} shareTable[byteIndex][x-1]
   */
  function splitSecret(secretText, k, n) {
    const bytes = new TextEncoder().encode(secretText);
    const table = [];
    for (let b = 0; b < bytes.length; b++) table.push(splitByte(bytes[b], k, n));
    return table;
  }

  /**
   * Reconstruct a UTF-8 string from a share table and a list of
   * cooperating share indices (1-based x values). Returns whatever the
   * math produces, garbled bytes if given fewer than the true threshold.
   * @param {number[][]} shareTable
   * @param {number[]} xs
   * @returns {string}
   */
  function reconstructSecret(shareTable, xs) {
    if (!xs || xs.length === 0) return '';
    const out = new Uint8Array(shareTable.length);
    for (let b = 0; b < shareTable.length; b++) {
      const points = xs.map(function (x) {
        return [x, shareTable[b][x - 1]];
      });
      out[b] = reconstructByte(points);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(out);
  }

  return {
    gfMul: gfMul,
    gfDiv: gfDiv,
    splitByte: splitByte,
    reconstructByte: reconstructByte,
    splitSecret: splitSecret,
    reconstructSecret: reconstructSecret,
    _internal: { GF_EXP: GF_EXP, GF_LOG: GF_LOG }
  };
});
