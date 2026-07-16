# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Two independent, self-contained Playwright/TypeScript exercises submitted for a QA automation
assessment against the Spacer (whereipark.com) staging app — see
`claude/skills/spacer-domain/README.md` for the original brief:

- `02-api-contract/` — API contract tests for `GET /api/v3/space_configurations`.
- `01-web-e2e/` — UI E2E test for the journey sign in → create listing → dashboard verification.

Neither exercise's test code imports from the other. They share only root-level tooling
(`package.json`/`node_modules`, `tsconfig.json`, `env/`), not code.

## Commands

Each exercise has its **own** `playwright.config.ts` and must be run from inside its own directory —
Playwright's config resolution looks only in the current working directory, not parent directories.

```bash
# one-time setup, from the repo root
npm install

# API contract tests
cd 02-api-contract
npx playwright test --project=api

# Web E2E test (requires browser binaries: npx playwright install chromium)
cd 01-web-e2e
npx playwright test --project=chromium
```

Both configs default `TEST_ENV` to `staging` and load `env/.env.${TEST_ENV}` (one level up from the
exercise directory) via `dotenv`. Override before running to point at a different environment:

```powershell
$env:TEST_ENV="staging"; npx playwright test --project=api
```

From within either exercise directory:

```bash
# Run a single test by name
npx playwright test --project=<api|chromium> -g "<test name>"

# View the HTML report after a run
npx playwright show-report
```

Typecheck the whole repo (no `tsc` binary was installed originally — `typescript` is now a
devDependency specifically so this works):

```bash
npx tsc --noEmit
```

## Environment configuration

`env/.env.<name>` at the repo root holds secrets shared across both exercises but consumed
differently by each:

- `02-api-contract` (`utils/auth.ts`): `OAUTH_TOKEN_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`
  (client-credentials grant), `VALID_LISTING_ID`.
- `01-web-e2e`: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (real browser form login); optionally
  `BASIC_AUTH_USERNAME`/`BASIC_AUTH_PASSWORD` if staging sits behind HTTP Basic Auth in front of the
  app (wired via `use.httpCredentials` in its `playwright.config.ts` — Basic Auth dialogs are native
  browser chrome, not part of the DOM, so they can't be reached with locators).
- `BASE_URL` — shared, defaults to `https://staging.whereipark.com` in both configs.

Never print, log, or commit these values.

## Architecture

### `02-api-contract` (API contract testing)

- `test-fixtures/api-fixture.ts` extends the base Playwright `test` with an `apiActions` fixture —
  import `test`/`expect` from here in specs, not from `@playwright/test` directly.
- `utils/api-actions.ts`: `APIActions` class wraps the endpoint call
  (`getSpaceConfigurations(listingId?, accessToken?)`). This is the API-testing equivalent of a page
  object — it performs the request and returns the raw response; it does **not** assert. Assertions
  belong in the spec file.
- `utils/auth.ts`: `getAccessToken(request)` performs one `client_credentials` OAuth flow per
  `describe` block (called from `beforeAll`), reused across every test in the file. Deliberate: don't
  fetch a token per-test — staging is shared and rate-limited, and the token endpoint has been
  observed to intermittently 500 regardless of credentials, so minimizing calls to it reduces flake
  surface.
- `utils/spacer-configuration-assertions.ts`: `expectValidSpacerConfiguration(item)` centralizes the
  full contract shape check for one space-configuration object, including which fields are nullable.
  Reuse this rather than re-asserting shape inline when adding cases.
- `types/spacer-configuration.ts`: `SpacerConfiguration`, `ApiErrorResponse` — keep in sync with the
  documented contract; type both success and error response bodies against these rather than leaving
  `response.json()` untyped.
- Single project (`api`), `fullyParallel: false`, `workers: 1` — deliberate serial execution against
  the shared, rate-limited staging environment.
- The endpoint under test is read-only; never add specs that call write endpoints
  (POST/PUT/DELETE) against staging data.

### `01-web-e2e` (UI E2E)

- `pages/*.page.ts`: Page Object Model (`LoginPage`, `ListingPage`, `HomePage`). Locators are
  accessibility-first (`getByRole`/`getByLabel`) — the app exposes no `data-testid` hooks, and the
  brief requires role/label/visible-text locators over brittle CSS/XPath/ids.
- `test-fixtures/base-fixture.ts` exists as scaffolding but is not yet implemented.
- Single journey under test per the brief (`tests/ui/create-listing.spec.ts`): sign in → create
  listing → confirm it appears on the dashboard, structured with `test.step()` per phase.

## Known gaps (WIP)

- `01-web-e2e/pages/dashboard.page.ts` has no `expectListingVisible` method yet, but
  `create-listing.spec.ts` already calls it — the spec won't typecheck or run until it's added.
- `claude/skills/` contains draft `playwright-best-practices` and `review-tests` skills, but the
  directory is missing its leading dot (`claude/` instead of `.claude/`), so neither is recognized as
  a slash command by Claude Code yet. Both files also still contain unedited boilerplate from an
  unrelated project ("EventHub", test users like `rahulshetty1@gmail.com`, references to a
  nonexistent `eventhub-domain` skill and `frontend/` source tree) — only the "Config Reference"
  section at the top of `playwright-best-practices/SKILL.md` has actually been adapted for this repo.
