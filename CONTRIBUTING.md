# Contributing

Thanks for considering a contribution. This project sits at the intersection of a real, still-sensitive news event and a small amount of real cryptography, so a few things matter more here than in a typical demo repo.

## Ground rules

1. **Keep the political framing out of the code and docs.** This project takes a position on a mechanism (diffused custody is a security failure, not a policing one), not on any party, politician, or protest movement. PRs that add commentary on who's "at fault" in the 2026 NEET-UG controversy beyond the sourced, quoted facts in the README will be redirected back to that scope.
2. **Every factual claim about the real 2026 leak needs a source.** If you're adding or correcting a fact in the README's background section, include where it came from (publication and date is enough, we're not trying to build a footnote apparatus).
3. **"Real" exhibits stay real.** If you touch `src/custody-chain.js`, `src/shamir.js`, or `src/similarity.js`, the change needs to keep passing `npm test`, and if you're changing behavior, add or update a test that would have caught the bug you're fixing. Do not reintroduce scripted/simulated behavior into anything currently labeled "Real" in the README or demo, that distinction is the point of this project (see the git history around the rewrite from a scripted demo to a working one for context on why this matters).
4. **No production security claims.** This is a teaching-grade implementation (see [SECURITY.md](SECURITY.md)). PRs that describe it as production-ready, audited, or suitable for real secret management without heavy caveats won't be merged as-is.

## Development

```bash
npm test        # required to pass before a PR is considered
npm run lint     # basic syntax check
npm run demo      # view the demo locally at http://localhost:8080/demo/
```

There are no build steps and no runtime dependencies. Keep it that way unless there's a strong reason not to, part of this project's point is that you can read every line of what's actually running.

## Reporting bugs in the math or crypto

If you find an error in the GF(256) construction, the hash-chaining logic, or the similarity metric, please open an issue with:

- A minimal reproduction (a failing test is ideal, even a rough one).
- What you expected vs. what happened.

The project's own history has one of these already: an earlier draft of `src/shamir.js` used generator `2` for the finite field, which is not primitive for the AES/Rijndael reducing polynomial used here and only cycles through 51 of 255 elements. It was caught by testing the field construction directly before shipping, that kind of catch is exactly the contribution this project benefits most from.

## Adding a new mechanism

If you want to propose a fourth mechanism (e.g., a real anomaly-detection model, a proper CSPRNG-backed variant of the secret sharing), open an issue first to discuss scope before writing code. The bar is the same as the existing three: it should be a real, working, tested implementation, not an illustration dressed up to look like one.
