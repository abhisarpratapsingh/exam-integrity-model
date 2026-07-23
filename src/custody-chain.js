/**
 * custody-chain.js
 *
 * A minimal hash-chained custody log. Each entry's signature is:
 *
 *     SHA-256(previousSignature + "|" + role + "|" + note + "|" + time)
 *
 * so changing any field of any entry invalidates that entry's signature
 * and every signature chained after it. This is the same core idea
 * behind any hash-chained audit log (including, loosely, a blockchain):
 * the "diffused accountability" problem becomes visible as a specific,
 * checkable, tamper-evident record instead of an unrecorded handoff.
 *
 * Uses the native Web Crypto API (crypto.subtle) directly, available
 * globally in browsers and in Node 19+. No external crypto library.
 *
 * Works unmodified in a browser via <script src="custody-chain.js">
 * (attaches to `window.CustodyChain`) and in Node via
 * require('./custody-chain.js').
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CustodyChain = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * SHA-256 hex digest of a UTF-8 string.
   * @param {string} input
   * @returns {Promise<string>} 64-character hex string
   */
  async function sha256Hex(input) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  /**
   * Build a sealed hash chain over an ordered list of custody entries.
   * @param {Array<{role: string, note: string, time: number}>} entries
   * @param {string} [genesisSeed='custody-chain'] distinguishes independent chains
   * @returns {Promise<{genesisHash: string, blocks: Array<{role:string, note:string, time:number, sealedHash:string}>}>}
   */
  async function buildChain(entries, genesisSeed) {
    const genesisHash = await sha256Hex('GENESIS-' + (genesisSeed || 'custody-chain'));
    let prev = genesisHash;
    const blocks = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const hash = await sha256Hex(prev + '|' + entry.role + '|' + entry.note + '|' + entry.time);
      blocks.push({ role: entry.role, note: entry.note, time: entry.time, sealedHash: hash });
      prev = hash;
    }
    return { genesisHash: genesisHash, blocks: blocks };
  }

  /**
   * Re-verify a sealed chain against a (possibly edited) set of notes.
   * Returns one result per block: { ok, recomputedHash }. `ok` is true
   * only if that block's hash still matches its sealed hash AND every
   * block before it also verified. A tamper at index i therefore
   * invalidates every index >= i, exactly as a real hash chain would
   * behave, and `recomputedHash` lets a caller show the actual mismatched
   * value rather than just a pass/fail flag.
   * @param {string} genesisHash from buildChain
   * @param {Array} sealedBlocks from buildChain
   * @param {string[]} currentNotes current (possibly edited) note values, same length/order as sealedBlocks
   * @returns {Promise<Array<{ok: boolean, recomputedHash: string}>>}
   */
  async function verifyChain(genesisHash, sealedBlocks, currentNotes) {
    let prev = genesisHash;
    let broken = false;
    const results = [];
    for (let i = 0; i < sealedBlocks.length; i++) {
      const b = sealedBlocks[i];
      const recomputed = await sha256Hex(prev + '|' + b.role + '|' + currentNotes[i] + '|' + b.time);
      const ok = !broken && recomputed === b.sealedHash;
      if (!ok) broken = true;
      results.push({ ok: ok, recomputedHash: recomputed });
      prev = ok ? b.sealedHash : recomputed;
    }
    return results;
  }

  return { sha256Hex: sha256Hex, buildChain: buildChain, verifyChain: verifyChain };
});
