# Security Policy

## Scope and honest limitations

This is a **teaching-grade demonstration project**, not a security product, and it has not been independently audited. Specifically, before relying on any part of it for anything beyond demonstration:

- **`src/shamir.js`** generates polynomial coefficients with `Math.random()`, which is **not** a cryptographically secure random number generator in any current JavaScript engine. A real threshold secret-sharing deployment must use a CSPRNG (`crypto.getRandomValues` in browsers, `crypto.randomBytes` or `crypto.webcrypto.getRandomValues` in Node).
- **`src/shamir.js`** is not implemented in constant time. Timing side-channels have not been considered or mitigated.
- **`src/custody-chain.js`** demonstrates tamper-*evidence* (a change is detectable after the fact), not tamper-*prevention*, key management, or access control. It also does not address how the underlying `role`, `note`, and `time` values are attested to be genuine before they're hashed, garbage in, faithfully hashed garbage out.
- **`src/similarity.js`** is a simple shingle/Jaccard comparator. It is not resistant to adversarial paraphrasing or translation, and produces no confidence interval, only a point estimate.

None of the three modules are connected to any real exam board, government system, or dataset. There is nothing in this repository that touches production infrastructure of any kind.

## Reporting a vulnerability or a mathematical error

If you find:

- A bug in the GF(256) field construction or Shamir reconstruction that could cause incorrect (not just "not production-hardened") behavior,
- A flaw in the hash-chaining logic that would let a tampered entry pass verification,
- Or a similar correctness issue in any of the three modules,

please open a GitHub issue with a minimal reproduction. If you'd prefer not to disclose it publicly first, contact the maintainer listed in the repository's GitHub profile before opening a public issue.

This project has no bug bounty and no formal SLA on response time, it's a demonstration repository maintained on a best-effort basis. Correctness issues in the tested modules (`src/`) will be prioritized over issues in the demo UI (`demo/`).
