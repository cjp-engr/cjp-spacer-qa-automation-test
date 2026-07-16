# Exercise 2 — API Contract Automation — Notes

## How to install dependencies and run the tests

Dependencies (`@playwright/test`, `typescript`, `@types/node`, `dotenv`) are installed once at the
repo root and shared by both exercises.

```bash
# 1. Move into this exercise's directory
cd 02-api-contract

# 2. Install dependencies (only needed once; npm resolves the shared
#    package.json/node_modules at the repo root even though this folder
#    doesn't have its own)
npm install

# 3. Run the suite against staging
npx playwright test --project=api
```

`npm install` pulls in `@playwright/test` itself (already listed as a devDependency), so no separate
install step for the Playwright package is needed. It does **not** download browser binaries — and
this exercise doesn't need them, since the `api` project talks to the endpoint directly over HTTP via
`APIRequestContext` and never launches a browser. Browser binaries (`npx playwright install`) are only
required for `01-web-e2e`'s `chromium` project.

`02-api-contract/playwright.config.ts` defaults `TEST_ENV` to `staging` and loads
`../env/.env.staging` for credentials (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_TOKEN_URL`,
`VALID_LISTING_ID`, `BASE_URL`). To point at a different environment, set `TEST_ENV` before running
(this expects a matching `env/.env.<name>` file at the repo root):

```powershell
$env:TEST_ENV="staging"; npx playwright test --project=api
```

Other useful invocations:

```bash
# Run a single test by name
npx playwright test --project=api -g "returns 401 when Bearer token is missing"

# View the HTML report after a run
npx playwright show-report
```

## Folder structure

```
02-api-contract/
├── playwright.config.ts          # Project config: api project, env loading, serial execution
├── test-fixtures/
│   └── api-fixture.ts            # Extends base test with apiActions fixture
├── tests/
│   └── api/
│       ├── spacer-configurations.spec.ts  # All contract test cases
│       └── NOTES.md              # This file
├── types/
│   └── spacer-configuration.ts   # SpacerConfiguration and ApiErrorResponse types
└── utils/
    ├── api-actions.ts            # APIActions class — wraps the endpoint call, no assertions
    ├── auth.ts                   # getAccessToken() — client_credentials OAuth flow
    └── spacer-configuration-assertions.ts  # expectValidSpacerConfiguration() — shape contract
```

## How cases are organized and response bodies are validated

All cases live in `spacer-configurations.spec.ts` under one outer
`test.describe('GET /api/v3/space_configurations', ...)` block, split into two nested groups:

**`when unauthenticated`** (no OAuth token needed):
1. `returns 401 when Bearer token is missing`
2. `returns 401 when Bearer token is invalid`

**`when authenticated`** (fetches a real token in `beforeAll`):
3. `returns 200 and valid space configurations for an authorized listing` — happy path.
4. `returns 400 when listing_id is missing`
5. `returns 400 when listing_id is not an integer`
6. `returns 404 when listing does not exist`

The split is deliberate: if the OAuth token endpoint is down, only the `when authenticated` group
fails — the unauthenticated cases (which test the endpoint's own auth rejection, not OAuth) are
unaffected and still run.

### Layers

The suite is split into layers so each file has one job:

- **`playwright.config.ts`** — environment loading (`TEST_ENV` → `env/.env.<name>`), the single `api`
  project, and shared run settings (serial execution, retries, reporters).
- **`test-fixtures/api-fixture.ts`** — extends the base Playwright `test` with an `apiActions`
  fixture, so specs `import { test, expect } from '../../test-fixtures/api-fixture'` instead of from
  `@playwright/test` directly. This is what wires `APIActions` into every test without each test
  constructing it by hand.
- **`utils/api-actions.ts`** — `APIActions.getSpaceConfigurations(listingId?, accessToken?)` is the
  only place that knows the endpoint path and how to build the request (query param, Bearer header).
  It returns the raw `APIResponse` and asserts nothing — this is the API-testing equivalent of a page
  object: actions perform the call, tests decide what "correct" means.
- **`utils/auth.ts`** — `getAccessToken(request)` performs the `client_credentials` OAuth flow once
  per `describe` block (called from `beforeAll`), reused across every test in the file, and returns
  the bearer token. It throws plain `Error`s on failure rather than asserting — same reasoning as
  above: a helper isn't a test, so it shouldn't own test assertions.
- **`utils/spacer-configuration-assertions.ts`** — `expectValidSpacerConfiguration(item)` is the single
  place that encodes the full response-shape contract; specs call it instead of re-asserting shape
  inline.
- **`types/spacer-configuration.ts`** — `SpacerConfiguration` and `ApiErrorResponse` give compile-time
  assurance that both success *and* error response handling stay in sync with the documented contract
  (every `response.json()` call in the spec is typed against one of these, not left as `any`).

`VALID_LISTING_ID` is read from the environment and validated (present, integer) in the same
`beforeAll`, so a misconfigured `.env` fails fast with one clear error instead of every test failing
individually with a confusing 404/400.

### Response body validation

Never just a status-code check:

- `expectValidSpacerConfiguration` asserts:
  - Required fields are present with the correct primitive type (`id`, `listing_id`: `number`;
    `name`, `unit_type`, `building_type`, `reservation_type`: `string`; `ev`, `stairs_access`,
    `tricky_access`: `boolean`; `created_at`, `updated_at`: ISO `string`).
  - Nullable fields (`stacker_type`, `height_restriction`, `level`, `level_type`) are asserted as
    *either* `null` *or* the documented type — not just "truthy/present" — since the documented
    contract explicitly allows `null` for these. Each of those checks carries a descriptive failure
    message (field name + actual value) so a failure is diagnosable from the report alone, without
    re-running with extra logging.
  - The happy-path test also asserts every returned item's `listing_id` matches the requested
    `listing_id`, and that the top-level body is a bare array (`Array.isArray`), per the documented
    "not wrapped in `{ data: ... }`" contract detail.
- Error-response tests assert the full JSON error body with `toEqual` (exact shape, not just
  `expect.any(String)` on `error`), matching the documented `{ error, error_description? }` shape for
  each status code — except the "invalid `listing_id`" 400 case, where the exact message text isn't
  documented, so only `error: expect.any(String)` is asserted there.

Config choices that affect validation reliability: `fullyParallel: false` and `workers: 1` in
`playwright.config.ts`, so tests run serially against the shared staging environment — deliberate,
since this endpoint is rate-limited and the suite reuses one OAuth token across all tests.

## Waiting strategy

API tests are synchronous request/response by nature — there is no UI rendering lag, no DOM
mutation, and no animation to wait for. Playwright's `APIRequestContext` awaits the full HTTP
response before returning, so there are no explicit waits in the spec file itself.

Flake prevention here is structural rather than timing-based:

### Serial execution

`fullyParallel: false` and `workers: 1` in `playwright.config.ts` ensure tests run one at a time
against the shared staging environment. Parallel requests against a rate-limited endpoint would
cause intermittent `429` failures that have nothing to do with the test logic.

### One token fetch per file, not per test

The OAuth token is fetched once in `beforeAll`, not inside each `test()`. The token endpoint was
previously observed to intermittently return `500` on staging regardless of credentials — it is
now confirmed working. Minimising calls to it still reduces unnecessary load on the shared
environment — six tests sharing one token means six fewer round-trips to the token endpoint per
run.

### Fast-fail on misconfiguration

`VALID_LISTING_ID` is validated (present, integer) in `beforeAll` before any test runs. A
misconfigured `.env` fails the entire suite immediately with one clear error rather than letting
every test fail individually with a confusing `400`/`404` that looks like a contract regression.

### What was deliberately avoided

| Avoided pattern | Why |
|---|---|
| Retry loops around `getAccessToken` | Retrying a failing token fetch masks infrastructure issues; better to fail fast and surface the problem |
| `page.waitForTimeout` / `sleep` between requests | Not needed — each request awaits its response before the next test starts |
| Parallel workers | Would race against the rate limit and produce intermittent `429`s unrelated to the contract |

## Assertion selection strategy

API contract tests don't use DOM locators, but there is an equivalent priority chain for how
response body assertions are written — from most to least specific.

### Priority chain

| Priority | Strategy | When to use |
|---|---|---|
| 1 | `toEqual({ ... })` — exact object match | The full response shape is documented and stable |
| 2 | `toEqual(expect.objectContaining({ ... }))` | Shape is partially documented; extra fields are allowed |
| 3 | `expect.any(Type)` inside `objectContaining` | Field must be present with the right type; exact value is undocumented |
| 4 | Hand-rolled boolean + `toBeTruthy` with a message | Nullable-or-typed field checks (`null` or `string`, etc.) that `toEqual` can't express in one matcher |

### Where each tier is used in this suite

**`toEqual` (exact match) — used for all fully-documented error responses:**

```ts
expect(body).toEqual({ error: 'token_missing', error_description: 'No Bearer token provided' });
expect(body).toEqual({ error: 'invalid_token', error_description: 'Token is invalid' });
expect(body).toEqual({ error: 'listing_id is missing' });
expect(body).toEqual({ error: 'Listing not found' });
```

Exact shape match fails loudly if the API adds, removes, or renames a field — the intended
behaviour for a contract test.

**`objectContaining` + `expect.any(String)` — used when the exact error message is undocumented:**

The 400 "listing_id is not an integer" case: the brief documents that an `error` field is present
but doesn't specify its value, so asserting the exact string would be guessing:

```ts
expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
```

**Hand-rolled boolean checks — used for nullable fields in `expectValidSpacerConfiguration`:**

Some fields (`stacker_type`, `height_restriction`, `level`, `level_type`) are documented as
nullable. No single Playwright/Jest matcher expresses "null or string" cleanly, so each is checked
with a conditional and a descriptive failure message:

```ts
const isValid = value === null || typeof value === 'string';
expect(isValid, `stacker_type should be null or string, got: ${value}`).toBeTruthy();
```

The message includes the field name and actual value so a failure is diagnosable from the report
alone without re-running with extra logging.

### Fallback decision tree (quick reference)

```
Is the full response shape documented (all fields, all values)?
  → YES: toEqual({ ... })
  → NO ↓

Are most fields documented but some values are unspecified?
  → YES: toEqual(expect.objectContaining({ knownField: 'value', unknownField: expect.any(Type) }))
  → NO ↓

Is only the field's type documented, not its value?
  → YES: expect.any(String | Number | Boolean) inside objectContaining
  → NO ↓

Is the field nullable (null or a specific type)?
  → YES: hand-rolled boolean check with descriptive toBeTruthy message
```

## Best practices applied

- **Actions vs. assertions kept separate.** `APIActions` and `getAccessToken` perform requests and
  return/throw on transport-level failure; they never call `expect`. All contract assertions
  (status code, body shape, error shape) live in the spec file or the dedicated assertions helper.
  This mirrors the Page-Object-Model rule "keep assertions in tests, not in the object" — applied here
  to an API actions class instead of a UI page object.
- **Fixture-based composition over manual wiring.** Tests receive `apiActions` as a Playwright fixture
  (`test-fixtures/api-fixture.ts`) rather than each test importing `APIActions` and instantiating it
  with `request` by hand — one less thing to get wrong or duplicate per test.
- **One setup call, not one per test.** The OAuth token is fetched once per file (`beforeAll`), not
  per test, to avoid hammering a shared, rate-limited staging environment. This is a deliberate
  exception to the generic "avoid shared state between tests" guideline: the shared value here is
  read-only (a token, a listing id), not mutated state that would make tests order-dependent, so the
  usual failure mode that rule guards against doesn't apply.
- **No untyped `response.json()`.** Every parsed body — success and error alike — is typed against
  `SpacerConfiguration[]` or `ApiErrorResponse`, so a contract drift shows up as a compile error, not
  just a runtime assertion failure.
- **Descriptive assertion messages.** Every hand-rolled boolean assertion (the nullable-field checks,
  the OAuth failure paths) includes a message with the field name and actual value, instead of relying
  on a bare `toBeTruthy()`/thrown-error message that only says "false" or "failed."
- **No dead code.** Fixture and helper files only import what they use (an earlier pass had unused
  `expect`/`request` imports in `test-fixtures/api-fixture.ts`, since removed).
- **Centralized, reusable contract checks.** Shape validation and endpoint-calling logic exist in
  exactly one place each (`spacer-configuration-assertions.ts`, `api-actions.ts`), so adding a new test
  case never means re-typing the request or the shape check inline.

## Assumptions and what I'd add with more time

**Assumptions:**
- The `client_id`/`client_secret` and `VALID_LISTING_ID` provided are for a client authorized to
  manage that listing (i.e., the happy path won't itself hit a `403`).
- The documented response shape is authoritative; where a field's nullability wasn't explicit for a
  given failure case (e.g., the exact error string for a non-integer `listing_id`), the test asserts
  only what's documented (`error` is a string) rather than guessing at exact wording.
- Read-only endpoint, so no setup/teardown of listing data is needed or attempted.

**What I'd add with more time:**
- A `403 Forbidden` case (token valid but for a client that doesn't manage the target listing) — not
  currently testable without a second client/listing pair.
- A `429 Too Many Requests` case — deliberately not exercised to avoid deliberately tripping the rate
  limit against shared staging.
- Explicit `Content-Type: application/json` header assertions on every response, not just body shape.
- Boundary/edge-case `listing_id` values (`0`, negative, decimal, extremely large) beyond the single
  "not an integer" case.
- Token-expiry handling (mocking or waiting out the 1-hour TTL) for the `token_expired` case
  documented in the brief but not currently covered.
- Replacing the hand-rolled `expect.objectContaining` shape checks with a JSON Schema (e.g. `ajv`) or
  `zod` validator, so one schema change updates validation without touching assertion code.
- Wiring this into CI (e.g. GitHub Actions) with the Playwright HTML report published as a build
  artifact.
