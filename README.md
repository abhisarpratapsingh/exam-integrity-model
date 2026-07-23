# Exam Integrity Model

A demonstration toolkit for exam and document integrity supply chains: three small, working implementations of mechanisms that harden a custody chain against an insider with legitimate access, plus an interactive demo that runs all three live in the browser.

**[Live demo](https://sole-prop.github.io/exam-integrity-model/demo/)** · [What's real vs. illustrative](#whats-real-and-whats-illustration)

## What this is

Paper-based exams (and, more generally, any sensitive document that has to pass through multiple hands before it's used) are usually secured against theft in transit: sealed containers, armed transport, restricted printing. Those measures do little against a different threat model: someone who already has legitimate access reproducing the content themselves. This project is three small, tested mechanisms aimed specifically at that threat model, not a general security product.

- **`src/custody-chain.js`** — a SHA-256 hash-chained custody log. Each entry's signature depends on every entry before it, so a change to any single entry is detectable, and detectable specifically, not just "something's wrong somewhere."
- **`src/shamir.js`** — a from-scratch implementation of Shamir's Secret Sharing over GF(256). A secret (a decryption key, a seal code, anything) is split across n custodians such that any k of them reconstruct it exactly, and fewer than k reveal nothing usable.
- **`src/similarity.js`** — a Jaccard shingle-similarity comparator for flagging near-duplicate text automatically instead of by manual inspection.

It is **not** a production-ready secret-management or audit-log product, and none of it is connected to any real institution's systems or data. See [Security & scope](#security--scope).

## The three mechanisms

### 1. A custody chain that can't stay diffused (`src/custody-chain.js`)

Each custody entry's signature is:

```
SHA-256(previousSignature + "|" + role + "|" + note + "|" + time)
```

Change any field in any entry and that entry's signature no longer matches, and neither does every signature chained after it. This turns "who had this and when" from an unrecorded handoff into a specific, checkable, tamper-evident claim.

### 2. A secret with nothing whole to steal (`src/shamir.js`)

A real 4-of-6 threshold Shamir's Secret Sharing scheme, implemented from scratch over GF(256) (the finite field construction used in AES/Rijndael: generator 3, reducing polynomial `0x11B`). Any four of the six shares reconstruct the original secret exactly, byte for byte. Fewer than four reconstruct garbled bytes, not "a worse guess", because with too few points, Lagrange interpolation is mathematically underdetermined. This demonstrates *why* a single point of custody is a vulnerability, not just an assertion of it.

### 3. Detection that doesn't require manual inspection (`src/similarity.js`)

A Jaccard similarity score over 4-character text shingles: a standard, well-understood near-duplicate detection technique, applied to the question of whether a circulating document overlaps suspiciously with a reference document. It can run continuously and automatically rather than requiring someone to compare two documents by hand.

## What's real, and what's illustration

| Module | Status | What that means |
|---|---|---|
| Custody chain | **Real** | Genuine SHA-256 via the browser/Node's native `crypto.subtle`. Nothing precomputed. |
| Secret sharing | **Real** | Genuine Shamir's Secret Sharing over GF(256). Reconstruction succeeds or fails based on actual polynomial interpolation, not a scripted outcome. |
| Similarity | **Real** | Genuine Jaccard shingle similarity, computed on whatever text is in the two boxes, live. |

An earlier draft of this demo used a toy hash function and a scripted countdown timer dressed up to look like the mechanisms above. That version was replaced, looking like a working system without being one is worse than not shipping a demo at all for a project that explicitly invites technical scrutiny. Everything in the table above is backed by a passing test in `test/`, see [Verifying the claims yourself](#verifying-the-claims-yourself).

## Getting started

Requires Node.js 18 or later. No install step, this project has zero runtime dependencies.

```bash
git clone https://github.com/sole-prop/exam-integrity-model.git
cd exam-integrity-model

npm test          # run the full test suite (node's built-in test runner)
npm run demo       # serve the demo locally at http://localhost:8080/demo/
npm run lint       # syntax-check all source files
```

You can also open `demo/index.html` directly in a browser without a server. The three algorithm modules are loaded as plain `<script>` tags (not ES modules), so there's no CORS restriction to work around over `file://`.

## Verifying the claims yourself

Don't take "real, not simulated" on faith:

```bash
npm test
```

This runs 21 tests across the three modules, including:

- A check that the GF(256) log table produced by generator `3` is a full 255-element cycle. (An earlier draft used the simpler doubling construction, generator `2`, which is **not** primitive for this reducing polynomial and only cycles through 51 of 255 values, a bug caught by writing this exact test before shipping.)
- 300 randomized trials confirming any 4-of-6 share subset reconstructs the exact original secret byte, and a separate check that fewer than 4 shares essentially never coincidentally reconstruct it.
- A known-answer test for the SHA-256 implementation against the standard test vector for `"hello"`.
- A test confirming that editing one custody entry's note invalidates that entry and every entry chained after it, not just the one that was edited.

## Project structure

```
.
├── src/                    # the actual logic — zero dependencies, UMD-wrapped
│   ├── custody-chain.js     # SHA-256 hash-chained custody log
│   ├── shamir.js             # Shamir's Secret Sharing over GF(256)
│   └── similarity.js         # Jaccard shingle similarity
├── test/                   # node:test suite, one file per module
│   ├── custody-chain.test.js
│   ├── shamir.test.js
│   └── similarity.test.js
├── demo/                   # the interactive demo page
│   ├── index.html
│   ├── style.css
│   └── app.js                # DOM wiring only — calls into src/, doesn't reimplement it
├── scripts/
│   └── serve.js               # zero-dependency static server for local viewing
└── .github/workflows/
    └── test.yml                 # CI: runs the test suite on push and pull request
```

`src/*.js` files are UMD-wrapped: they attach to `window.CustodyChain` / `window.Shamir` / `window.Similarity` when loaded via `<script>` in a browser, and export the same API via `module.exports` when `require()`'d in Node. The exact same file that runs in the demo is the file the tests exercise.

## Security & scope

This is a demonstration project, not a security product. Specifically:

- `src/shamir.js` uses `Math.random()` for polynomial coefficients, **not** a cryptographically secure random number generator. A real deployment would need a CSPRNG (e.g., `crypto.getRandomValues` in the browser, `crypto.randomBytes` in Node).
- None of this code has been independently security-audited.
- The custody-chain model demonstrates tamper-*evidence* (you can tell something changed), not tamper-*prevention*, and doesn't address key management, access control, or how notes/timestamps are attested to be genuine in the first place.
- See [SECURITY.md](SECURITY.md) for how to report a concern.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE).
