# Exam Integrity Model

An interactive "case file" arguing that exam-paper leaks, like the 2026 NEET-UG leak in India, are a **supply-chain security problem**, not primarily a policing problem, and demonstrating three concrete mechanisms that address it. Built to accompany a public discussion of the leak, not as a pitch for a product.

**[Live demo](https://sole-prop.github.io/exam-integrity-model/demo/)** · [What's real vs. illustrative](#whats-real-and-whats-illustration) · [Background](#background-the-2026-neet-ug-leak)

---

## What this is, and isn't

This repository contains:

- **Three small, working implementations** of mechanisms that could harden an exam's supply chain against an insider leak:
  1. A **SHA-256 hash-chained custody log** (`src/custody-chain.js`)
  2. A **Shamir's Secret Sharing** (k-of-n threshold) scheme over GF(256) (`src/shamir.js`)
  3. A **Jaccard shingle-similarity** text comparator (`src/similarity.js`)
- **A test suite** (`test/`) that verifies each of them, including the finite-field math and the tamper-cascade behavior, not just "it renders."
- **An interactive demo** (`demo/`) that puts all three in front of a reader, alongside a narrative reconstruction of the real leak's timeline.

It is **not**:

- Connected to NTA, the National Testing Agency, or any real exam board's systems or data.
- A production-ready secret-management or audit-log product. See [Security & scope](#security--scope).
- A claim that any specific individual or institution is guilty of anything. The custody-chain roles are generic placeholders (`Question Setter`, `Print Vendor`, etc.), not real people or organizations.

## Why this exists

On May 3, 2026, roughly 22.7 lakh (2.27 million) students sat the NEET-UG exam in India. A version of the question paper had already been circulating through coaching networks for close to a month, reportedly written out by hand by someone with legitimate access to the question bank, not stolen in transit. The leak was ultimately caught by a chemistry teacher in Sikar, comparing a "guess paper" against the real one at 1:30am, a day after the exam.

A Supreme Court bench reviewing the case observed that the underlying problem persists as long as accountability stays, in the Court's own word, "diffused" across an agency, a vendor, and a proctor, with no individual duty holder. That observation is the spine of this project: **diffused accountability is not a policy failure you can fix with a stronger law, it's an architecture failure you fix with an architecture.**

Every reform on the record for this class of exam assumes theft in transit: better guards, sealed trucks, prison-printed papers. This leak wasn't that. The three mechanisms here are aimed at the actual threat model, an insider with legitimate access, not the one most reforms are built for.

## The three mechanisms

### 1. A custody chain that can't stay diffused (`src/custody-chain.js`)

Each custody entry's signature is:

```
SHA-256(previousSignature + "|" + role + "|" + note + "|" + time)
```

Change any field in any entry and that entry's signature no longer matches, and neither does every signature chained after it. This is the same core idea behind any hash-chained audit log: it turns "who had this and when" from an unrecorded handoff into a specific, checkable, tamper-evident claim.

### 2. A secret with nothing whole to steal (`src/shamir.js`)

A real 4-of-6 threshold Shamir's Secret Sharing scheme, implemented from scratch over GF(256) (the same finite field construction used in AES/Rijndael, generator 3, reducing polynomial `0x11B`). Any four of the six shares reconstruct the original secret exactly, byte for byte. Fewer than four reconstruct garbled bytes, not "a worse guess", because with too few points, Lagrange interpolation is mathematically underdetermined. This is a demonstration of *why* a single point of custody is the vulnerability, not just an assertion of it.

### 3. Detection that doesn't wait for a hero (`src/similarity.js`)

A Jaccard similarity score over 4-character text shingles. It's a standard, well-understood near-duplicate detection technique, not a novel algorithm, applied here to make the point that "does this circulating document overlap suspiciously with the real one" doesn't have to be a question one teacher answers by hand at 1am. It can run continuously, automatically, on chatter and documents as they surface.

## What's real, and what's illustration

This distinction matters enough that the demo marks it on every section, and it's worth being explicit here too:

| Exhibit | Status | What that means |
|---|---|---|
| A — Timeline | **Narrative reconstruction** | Recounts the publicly reported timeline of the actual leak. Not a live system. The "copies in circulation" counter is an illustrative spread model, explicitly labeled as such, not a reported statistic. |
| B — Custody chain | **Real** | Genuine SHA-256 via the browser/Node's native `crypto.subtle`. Nothing precomputed. |
| C — Secret sharing | **Real** | Genuine Shamir's Secret Sharing over GF(256). Reconstruction succeeds or fails based on actual polynomial interpolation, not a scripted outcome. |
| D — Similarity | **Real** | Genuine Jaccard shingle similarity, computed on whatever text is in the two boxes, live. |

An earlier version of this demo used a toy hash function and a scripted countdown timer dressed up to look like the mechanisms above. That version was replaced because looking like a working system without being one is worse than not shipping a demo at all, especially for a project explicitly inviting technical scrutiny. Everything marked "Real" in the table above is backed by a passing test in `test/`, and you don't have to take that on faith, see [Verifying the claims yourself](#verifying-the-claims-yourself).

## Background: the 2026 NEET-UG leak

Facts referenced in this project, with sourcing:

- **The leak and cancellation**: over 2.27 million candidates sat NEET-UG on May 3, 2026; the exam was cancelled May 12, 2026 after investigators found a "guess paper" with roughly 120 of ~400 questions matching the real one, including all Biology and Chemistry questions. (Wikipedia, "2026 NEET controversy"; SCC Online, May 2026; Countercurrents, June 2026)
- **The whistleblower**: a chemistry teacher in Sikar, Rajasthan, first reported the match to police at approximately 1:30am on May 4, 2026, the day after the exam. (MedBound Times, June 2026)
- **The mechanism**: investigators believe the paper was reproduced by hand by someone with legitimate access, not intercepted in transit, then circulated through coaching networks in several states for roughly a month before the exam. (MedBound Times; How2Shout, July 2026)
- **The Supreme Court's "diffused accountability" framing**: a bench of Justices P.S. Narasimha and Alok Aradhe observed that the real problem would persist unless accountability is fixed on identifiable duty holders, since otherwise obligations become "diffused." (How2Shout, July 2026)
- **The 1997 parallel and 2026 ministerial statement**: Union Education Minister Dharmendra Pradhan was injured in a 1997 Odisha protest over a state exam paper leak, as a student ABVP leader; in 2026, as minister, he stated "We owe our students more than outrage. We owe them answers, reforms and accountability." (The Indian Express profile via Brut, July 2026; Oneindia, July 2026)

This project does not take a position on any political actor, party, or individual involved in the 2026 controversy beyond what is directly quoted and sourced above. The custody-chain roles used in the demo (`Question Setter`, `Print Vendor`, `Transport Custodian`, `District Coordinator`, `Centre Proctor`, `Records Clerk`) are generic, illustrative roles, not references to any real person or organization.

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

- A check that the GF(256) log table produced by generator `3` is a full 255-element cycle. (An earlier draft used the simpler doubling construction, generator `2`, which is **not** primitive for this reducing polynomial and only cycles through 51 of 255 values, a bug that was caught by writing this exact test before shipping.)
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
├── demo/                   # the interactive case-file page
│   ├── index.html
│   ├── style.css
│   └── app.js                # DOM wiring only — calls into src/, doesn't reimplement it
├── scripts/
│   └── serve.js              # zero-dependency static server for local viewing
└── .github/workflows/
    └── test.yml               # CI: runs the test suite on push and pull request
```

`src/*.js` files are UMD-wrapped: they attach to `window.CustodyChain` / `window.Shamir` / `window.Similarity` when loaded via `<script>` in a browser, and export the same API via `module.exports` when `require()`'d in Node. This means the exact same file that runs in the demo is the file the tests exercise, there's no separate "browser version" and "tested version" to drift apart.

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
