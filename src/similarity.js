/**
 * similarity.js
 *
 * A small, dependency-free text-similarity utility using Jaccard
 * similarity over character n-grams ("shingles"). Used in the
 * exam-integrity demo to illustrate how a resale-chatter pattern match
 * could be flagged automatically instead of by hand.
 *
 * This is a standard, well-known technique (shingling + Jaccard index),
 * not a novel algorithm, and it is intentionally simple and auditable.
 * It is a reasonable starting point for near-duplicate text detection,
 * not a production plagiarism-detection system: it is insensitive to
 * word order beyond shingle length, and does not do semantic matching.
 *
 * Works unmodified in a browser via <script src="similarity.js"> (attaches
 * to `window.Similarity`) and in Node via require('./similarity.js').
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Similarity = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Build the set of n-character shingles from a text. Case-insensitive
   * and collapses runs of whitespace to a single space before shingling.
   * @param {string} text
   * @param {number} [n=4] shingle length in characters
   * @returns {Set<string>}
   */
  function shingleSet(text, n) {
    n = n || 4;
    const clean = String(text).toLowerCase().replace(/\s+/g, ' ').trim();
    const set = new Set();
    for (let i = 0; i <= clean.length - n; i++) {
      set.add(clean.slice(i, i + n));
    }
    return set;
  }

  /**
   * Jaccard similarity between two sets: |A ∩ B| / |A ∪ B|.
   * @param {Set<any>} a
   * @param {Set<any>} b
   * @returns {number} a value between 0 and 1 inclusive
   */
  function jaccardIndex(a, b) {
    let intersection = 0;
    a.forEach(function (v) {
      if (b.has(v)) intersection++;
    });
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Convenience wrapper: similarity score between two raw texts, 0-100.
   * @param {string} textA
   * @param {string} textB
   * @param {number} [n=4] shingle length in characters
   * @returns {number} integer 0-100
   */
  function similarityScore(textA, textB, n) {
    return Math.round(jaccardIndex(shingleSet(textA, n), shingleSet(textB, n)) * 100);
  }

  return { shingleSet: shingleSet, jaccardIndex: jaccardIndex, similarityScore: similarityScore };
});
