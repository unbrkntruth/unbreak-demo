# unbreak-demo

A small inventory API on Express 4.19, with 18 tests, ESLint and TypeScript, kept here so anyone can watch [Unbreak](https://unbrkn.co) fix a failing dependency PR on the record.

**How to watch a run**

1. Dependabot opens the Express 4 → 5 bump against this repository (weekly, `express` only). This app uses several things Express 5 changed, so CI goes red.
2. Unbreak posts a check run on that PR with one button, **Unbreak this**.
3. Someone with write access presses it. The agent runs in this repository's own GitHub Actions (`.github/workflows/unbreak.yml`), on Unbroken Truth's own Anthropic account, runs the tests before and after, and pushes the fix under the App's own identity.
4. CI goes green, and the check run shows the report: tests before and after, regressions, every changed file with its reason, cost and time.

The PR is never merged, so the app stays on Express 4 and the next bump can be watched too. Past runs are listed below.

**Runs on the record**

| PR | Result | Links |
|---|---|---|
| [#1](https://github.com/unbrkntruth/unbreak-demo/pull/1) express 4.19.2 → 5.2.1 | Fixed: CI green, 0 regressions (18/18 before and after), $0.18 of API usage, 10 turns, 52 s | [check run](https://github.com/unbrkntruth/unbreak-demo/runs/102988662367) · [full report](https://github.com/unbrkntruth/unbreak-demo/actions/runs/34512161903) · fix commit [`11df61d`](https://github.com/unbrkntruth/unbreak-demo/commit/11df61d830f7f86c9da24de71cf76dc1bdff8c1e) |

**What is in the code that breaks on Express 5**

`req.query` mutation, a nested `filter[status]=` query, an async handler without `next(err)`, `app.all("*")`, and `app.del()`. Each one is a real pattern from real apps, and each one is something Express 5 changed.

**Run it yourself**

```sh
pnpm install
pnpm test
```

MIT. Unbreak and UNBRKN are trademarks of Unbroken Truth. The agent that runs here, `@unbrkn/agent`, is Apache-2.0 and its source ships in the tarball the workflow installs.
