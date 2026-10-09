# ScholarPath — frontend

React + Vite app for the ScholarPath education decision engine. Talks to
[SCHOLAR-PATH-BACKEND](https://github.com/attahDev/SCHOLAR-PATH-BACKEND) over its HTTP API.

## Run

```bash
cp .env.example .env      # set VITE_API_URL to the backend URL
npm install
npm run dev               # http://localhost:5173
npm run build             # static output in dist/ (Vercel: vercel.json handles SPA routing)
```

The backend must list this site's origin in `ALLOWED_ORIGINS` (e.g. `http://localhost:5173`).

## Screens

Sign in / register · 5-step onboarding · For you (matches with why/fit/cost) · Search ·
Opportunity detail (eligibility, why this matches, why not, requirement check, readiness,
alternative pathways, report a problem) · Saved · Compare · Applications tracker + readiness checklist ·
GPA calculator with indicative conversion · Profile · Alerts + notification preferences ·
Subscription / upgrade (Paystack checkout) · Admin (staging, publish, activate/archive, user reports)

## Principles the UI enforces

- Eligibility and the five fit dimensions are shown separately; there is no single "match score",
  and fit is never described as admission probability.
- Conversions are labelled indicative unless an official/institution rule was used.
- "Not provided" is shown instead of blanks; the compare view never ranks options.
- Sponsored opportunities carry a visible label and the UI states sponsorship does not affect results.

## Not built yet

Document upload (needs object storage), password reset, Google sign-in, AI advisor / natural-language
onboarding, field-level verification screen in Admin, search subscriptions, WhatsApp delivery.
Not yet tested in a real browser — the request flow is covered by the backend's `test/frontend-flow.test.ts`.

`prototype/` holds the original single-file prototype and its fixture test (`npm run test:prototype`).
