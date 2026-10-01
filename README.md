# Scholar Path — frontend prototype

A single-file, dependency-free HTML prototype of the matching UI for a personalized
scholarship/Master's-program discovery platform. Built to design and validate the matching logic
— eligibility shown separately from five independent fit dimensions, field-level data verification,
"why this matches you" / "why you don't qualify" evidence, alternative pathways, side-by-side
comparison — before porting that logic to real backend code.

**Backend repo:** https://github.com/attahDev/SCHOLAR-PATH-BACKEND — the matching engine here was
ported there as tested TypeScript, along with auth, a catalog/admin layer, notifications, and an
HTTP API. The backend's `test/decision.test.ts` encodes the same rules this prototype's
`engine-fixtures.test.cjs` checks.

## Status: prototype, not wired to the backend

**Important:** `index.html` runs entirely in the browser against fictional sample data defined at
the top of its script. It does **not** call the backend API — there isn't a single `fetch()` in it.
Building real screens (login, onboarding, dashboard, opportunity detail) that call
SCHOLAR-PATH-BACKEND's endpoints is the next body of work, not yet started.

## Running it

Open `index.html` directly in a browser — no build step, no dependencies.

To check the embedded matching logic against 22 hand-labelled cases:

    node engine-fixtures.test.cjs index.html

## What's deliberately demonstrated here

- **Eligibility and fit are separate.** No single "match %" — an eligibility label
  (Eligible / Potentially Eligible / Not Eligible / Unknown) plus five independent fit bands
  (Academic, Financial, Funding, Language, Geographic).
- **Unverified data can't reject anyone.** A requirement that looks unmet on unverified data shows
  as "unknown", not a rejection.
- **GPA scale conversion is always labelled indicative**, never claimed as an official equivalency,
  and a result within 5% of a threshold on a converted scale is treated as uncertain rather than a
  hard pass/fail.
- **Comparison never declares a winner.**
