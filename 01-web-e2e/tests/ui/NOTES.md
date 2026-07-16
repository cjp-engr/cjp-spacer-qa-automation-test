# Exercise 1 — Web E2E Automation — Notes

## How to install dependencies and run the tests

Dependencies are installed once at the repo root and shared with `02-api-contract`.

```bash
# 1. One-time setup from the repo root
npm install

# 2. Install Chromium browser binaries (only needed once)
npx playwright install chromium

# 3. Move into this exercise's directory
cd 01-web-e2e

# 4. Run the full suite against staging
npx playwright test --project=chromium
```

`playwright.config.ts` defaults `TEST_ENV` to `staging` and loads `../env/.env.staging`
for credentials (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `BASE_URL`, and optionally
`BASIC_AUTH_USERNAME`/`BASIC_AUTH_PASSWORD` if staging sits behind HTTP Basic Auth).

```powershell
# Point at a different environment
$env:TEST_ENV="staging"; npx playwright test --project=chromium
```

Other useful invocations:

```bash
# Run by test name
npx playwright test --project=chromium -g "User can create a listing"

# View the HTML report after a run
npx playwright show-report
```

## Folder structure

```
01-web-e2e/
├── playwright.config.ts              # setup + chromium projects, saved auth state, env loading
├── playwright/
│   └── .auth/
│       └── user.json                 # Saved browser storage state (written by auth.setup.ts)
├── test-fixtures/
│   ├── auth-file.ts                  # Single source of truth for the auth file path
│   ├── auth.setup.ts                 # setup project: logs in and saves storage state
│   └── base-fixture.ts               # Extends base test with page-object fixtures
├── pages/
│   ├── home.page.ts                  # HomePage — myAccountButton for post-login assertion
│   ├── login.page.ts                 # LoginPage — navigates to sign-in, submits credentials
│   ├── listings.page.ts              # ListingsPage — reads listing count from dashboard
│   └── createListingPage/
│       ├── create-listing.page.ts    # CreateListingPage — composes all step sections
│       └── sections/
│           ├── picture-and-location.ts   # Step 1: address entry
│           ├── listing-details.ts        # Step 2: parking type + specification
│           ├── listing-description.ts    # Step 3: title, description, instructions
│           ├── listing-availability.ts   # Step 4: spots, booking notice, min length
│           ├── listing-price.ts          # Step 5: monthly price
│           ├── photos-of-listing.ts      # Step 6: skip photo upload
│           ├── review-listing.ts         # Step 7: click submit, wait for redirect
│           └── completed.ts              # Step 8: verify confirmation, go to dashboard
├── tests/
│   └── ui/
│       ├── create-listing.spec.ts    # The single @smoke E2E journey
│       └── NOTES.md                  # This file
└── utils/
    └── test-data.ts                  # Random address, booking time, booking length generators
```

## How the suite is structured

### Projects and authentication

`playwright.config.ts` defines two projects:

- **`setup`** — runs `test-fixtures/auth.setup.ts` first. It navigates to the login page,
  submits credentials from the environment, waits for `homePage.myAccountButton` to confirm
  sign-in, then saves the browser storage state to `playwright/.auth/user.json`.
- **`chromium`** — depends on `setup`. Every test starts with that saved storage state
  (`storageState: authFile`) already loaded, so no test has to log in manually.

The auth file path is exported from `test-fixtures/auth-file.ts` and imported by both
`auth.setup.ts` (writes) and `playwright.config.ts` (reads) — one source of truth for the path.

> **Note:** `test-fixtures/.auth/` is an orphaned directory with no code references — only
> `playwright/.auth/user.json` is live.

### Fixture layer (`test-fixtures/base-fixture.ts`)

Extends the base Playwright `test` with four page-object fixtures — `homePage`, `loginPage`,
`createListingPage`, `listingsPage` — so specs receive them as named parameters without
constructing them by hand.

### Page Object Model (`pages/`)

- **`login.page.ts`** — `LoginPage`: navigates to `/users/sign_in`, fills email/password, submits.
- **`home.page.ts`** — `HomePage`: exposes `myAccountButton` used to assert post-login state.
- **`listings.page.ts`** — `ListingsPage`: navigates to `/listings`, reads `"You have N Listings"`
  count text and exposes `getListingsCount()`.
- **`createListingPage/create-listing.page.ts`** — `CreateListingPage`: composes all step sections
  as named properties.

`CreateListingPage` is split into section classes under `createListingPage/sections/`:

| Section class | File | Responsibility |
|---|---|---|
| `PictureAndLocationSection` | `picture-and-location.ts` | Opens listing creation, fills address, advances |
| `ListingDetailsSection` | `listing-details.ts` | Selects parking type + specification, advances |
| `ListingDescriptionSection` | `listing-description.ts` | Fills title, description, instructions, advances |
| `ListingAvailabilitySection` | `listing-availability.ts` | Sets spots, booking notice, min length, advances |
| `ListingPriceSection` | `listing-price.ts` | Sets monthly price, advances |
| `PhotosOfListingSection` | `photos-of-listing.ts` | Skips photo upload |
| `ReviewListingSection` | `review-listing.ts` | Clicks "Next: Submit Listing", waits for redirect |
| `CompletedSection` | `completed.ts` | Verifies confirmation page, navigates to dashboard |

Locators are accessibility-first throughout (`getByRole`, `getByLabel`, `getByText`) — the app
exposes no `data-testid` hooks, and the brief requires role/label/visible-text selectors over
brittle CSS/XPath/ids.

## The single journey under test

`tests/ui/create-listing.spec.ts` covers one end-to-end flow tagged `@smoke`:

> **User can create a listing and see it on the dashboard**

Steps in order:

1. **Verify sign-in** — navigate to `/`, assert `myAccountButton` is visible (confirms saved
   auth state was applied correctly).
2. **Record current listings count** — navigate to `/listings`, read the count before creation so
   the final assertion is relative, not hardcoded.
3. **Click List Your Space** — opens the multi-step creation wizard.
4. **Picture and Location** — fills a randomly selected address from `getRandomTestAddress()`,
   advances.
5. **Listing Details** — selects "Indoor Lot" parking type + "Full sized sedan" specification,
   advances.
6. **Listing Description** — fills a `Date.now()`-suffixed title, description, and instructions
   (unique per run to avoid duplicate-listing collisions on retry), advances.
7. **Listing Availability** — fills random spot count (1–10), booking notice time, minimum booking
   length, advances.
8. **Listing Price** — fills random monthly price (100–1000), advances.
9. **Photos of Listing** — clicks "Skip this step and complete later", advances.
10. **Review Listing** — clicks "Next: Submit Listing", waits for redirect to `/listing_submitted`.
11. **Completed** — asserts URL matches `/listing_submitted`, verifies listing description on the
    confirmation page, clicks "Go to your dashboard".
12. **Dashboard verification** — asserts URL matches `/listing`, then polls `getListingsCount()`
    with `expect(...).toPass({ timeout: 10_000 })` until the count equals
    `listingsCountBeforeCreation + 1`.

Test-level timeout is set to `120_000 ms` via `testInfo.setTimeout()` — the wizard has several
steps and the staging environment can be slow.

Unique values (`uniqueListingName`, `uniqueDescription`, `uniqueInstructions`, `address`,
`numberOfSpots`, `bookingNoticeTime`, `bookingLength`, `monthlyBooking`) are generated inside the
test body, not at module scope, so retries (`playwright.config.ts` sets `retries: 2` in CI) get
fresh values instead of re-attempting with the same data that caused the prior failure.

## Waiting strategy

Flaky tests almost always come down to timing — asserting or interacting with something before the
page is ready. Every wait in this suite is explicit and action-specific. There are no `sleep` or
`waitForTimeout` calls anywhere; those mask symptoms instead of fixing the underlying race.

### Priority chain

| Priority | Strategy | When to use |
|---|---|---|
| 1 | Auto-waiting via action (`click`, `fill`) | Playwright waits for the element to be actionable before every interaction — this is the default and covers most cases |
| 2 | `expect(locator).toBeVisible()` | Before a critical action where you need to assert readiness first, not just wait for it |
| 3 | `waitForURL(pattern)` | After a navigation-triggering action; confirms the redirect completed before the next step runs |
| 4 | `.waitFor({ state: 'visible' })` | Third-party or dynamically injected elements that Playwright's auto-wait doesn't cover |
| 5 | `expect(...).toPass({ timeout })` | Async UI state that updates after the page has already settled (polling until the assertion passes) |
| 6 | `pressSequentially` with `delay` | Simulates realistic typing speed for inputs that trigger debounced API calls |

### Where each strategy is used in this suite

**Auto-waiting (built-in) — the default for all interactions:**

Every `click()`, `fill()`, `selectOption()`, and `scrollIntoViewIfNeeded()` call waits
automatically for the element to be attached, visible, stable, and enabled before acting. This
covers the majority of the wizard steps without any explicit waits.

**`expect(locator).toBeVisible()` — used before a critical first action:**

```ts
// picture-and-location.ts
await expect(this.listYourSpaceButton).toBeVisible();
await this.listYourSpaceButton.click();
```

The "List Your Space" button is the entry point for the entire wizard. Asserting visibility before
clicking makes the failure message clear ("element not visible") rather than a generic action
timeout, and confirms the home page has fully rendered before proceeding.

**`waitForURL(pattern)` — used after every section that triggers a redirect:**

```ts
// photos-of-listing.ts — after skipping photos
await this.page.waitForURL(/listing_review/, { waitUntil: 'domcontentloaded' });

// review-listing.ts — after submitting the listing
await this.page.waitForURL(/listing_submitted/, { waitUntil: 'domcontentloaded' });

// completed.ts — after clicking Go to Dashboard
await this.page.waitForURL(/listings/, { waitUntil: 'domcontentloaded' });
```

Without this, the next step would run immediately after the click and find the previous page's
elements still in the DOM. `waitUntil: 'domcontentloaded'` is used instead of the default `load`
event — it unblocks as soon as the HTML is parsed, without waiting for all images, fonts, and
third-party scripts to finish, which is faster and sufficient for the next locator interaction.

**`.waitFor({ state: 'visible' })` — used for the Google Places autocomplete dropdown:**

```ts
// picture-and-location.ts
const firstSuggestion = this.page.locator('.pac-item').first();
await firstSuggestion.waitFor({ state: 'visible' });
await firstSuggestion.click();
```

The `.pac-item` dropdown is injected by the Google Maps Places API after a debounced network call
— it is not present in the DOM when `fillLocationAddress()` starts. Playwright's auto-wait doesn't
cover elements that don't exist yet, so an explicit `.waitFor()` is needed here.

**`expect(...).toPass({ timeout })` — used for the async dashboard count:**

```ts
// create-listing.spec.ts
await expect(async () => {
  const currentCount = await listingsPage.getListingsCount();
  expect(currentCount).toBe(listingsCountBeforeCreation + 1);
}).toPass({ timeout: 10_000 });
```

After the redirect to `/listings`, the dashboard count updates asynchronously — the page renders
before the server-side data is reflected. A single assertion would fail on the stale render.
`toPass()` retries the entire async block on a short interval until it passes or the 10-second
timeout is hit, without any manual polling loop or `sleep`.

**`pressSequentially` with `delay` — used for the address autocomplete input:**

```ts
// picture-and-location.ts
await addressInput.pressSequentially(address, { delay: 100 });
```

`fill()` sets the full value instantly, which doesn't trigger the Google Places keystroke listeners
— the autocomplete dropdown never appears. `pressSequentially` with a 100ms delay between
characters mimics realistic typing, giving the Places API time to fire its debounced request and
render suggestions. This is the deliberate exception to preferring `fill()`.

**`scrollIntoViewIfNeeded()` — used before clicking "Next" buttons:**

```ts
await this.nextListingDetailsButton.scrollIntoViewIfNeeded();
await this.nextListingDetailsButton.click();
```

The wizard's "Next" buttons sit at the bottom of each section and may be off-screen on smaller
viewports or when the page loads mid-scroll. Scrolling before clicking prevents Playwright from
clicking a covered or partially-visible element, which would either fail or mis-fire.

### What was deliberately avoided

| Avoided pattern | Why |
|---|---|
| `page.waitForTimeout(ms)` / `sleep` | Hardcoded delays either wait too long (slow runs) or not long enough (flaky on slow CI). Every wait here is condition-based, not time-based. |
| `waitUntil: 'load'` on `goto()` | Waits for all resources including third-party scripts (analytics, ads). `domcontentloaded` is sufficient and significantly faster on staging. |
| `waitUntil: 'networkidle'` | Unreliable on pages with polling or persistent WebSocket connections; staging has analytics beacons that keep the network perpetually "busy". |
| Re-querying the DOM inside a loop | `toPass()` handles the retry loop; manual polling with `while` or `setInterval` is harder to read and harder to time out cleanly. |

## Locator selection strategy

The app exposes no `data-testid` hooks, so locators fall through a priority chain from most to least
preferred. The rule is: use the highest tier that is actually available for the element.

### Priority chain

| Priority | Strategy | When to use |
|---|---|---|
| 1 | `getByRole` | Interactive elements with a semantic role — buttons, links, textboxes, comboboxes |
| 2 | `getByLabel` | Form inputs associated with a visible `<label>` via `for`/`id` or `aria-label` |
| 3 | `getByText` | Non-interactive elements identified by stable visible text |
| 4 | Label-parent traversal | Input is near its label but the `for`/`id` pairing is broken |
| 5 | CSS `id` selector | Stable, unique `id` on the element; no accessible role or label available |
| 6 | CSS class selector (`.pac-item`) | Third-party widget with no semantic hooks — last resort, flagged for review |

### Where each tier is used in this suite

**`getByRole` — used everywhere a semantic role is available:**
- `page.getByRole('button', { name: 'Next: Listing Details' })` — all wizard "Next" buttons
- `page.getByRole('link', { name: 'List Your Space' })` — nav link
- `page.getByRole('link', { name: 'Go to your dashboard' })` — confirmation page link
- `page.getByRole('button', { name: 'My Account' })` — post-login assertion
- `page.getByRole('combobox', { name: 'Booking Notice Time:' })` — `<select>` elements with labels
- `page.getByRole('link', { name: 'Next: Submit Listing' })` — review step (rendered as `<a>`, not `<button>`)

**`getByLabel` — used for labelled inputs:**
- `page.getByLabel(/address/i)` — upload photo input in `PictureAndLocationSection`
- `page.getByLabel(/location address/i)` — the address text input in `fillLocationAddress()`

**`getByText` — used for non-interactive text anchors:**
- `page.getByText('Parking Description & Instructions', { exact: true })` — section heading used
  as an XPath anchor to reach the adjacent value element (see label-parent traversal below)
- `page.getByText('Indoor Lot', { exact: true })` / `'Full sized sedan'` — option cards with no
  role or label; `exact: true` prevents partial-match collisions with similar option text

**Label-parent traversal — used when `for`/`id` pairing is broken:**

The login form's email and password fields have mismatched `for`/`id` attributes, so `getByLabel`
resolves to the wrong element. The workaround walks up to the label's parent, then finds the input
within that container:

```ts
// Email — label text → parent container → textbox role
page.getByText('Email', { exact: true }).locator('xpath=..').getByRole('textbox')

// Password — same parent walk, then input tag (no role on password inputs)
page.getByText('Password', { exact: true }).locator('xpath=..').locator('input')
```

**XPath following-sibling — used to reach an element with no unique identifier adjacent to a known text anchor:**

The confirmation page shows the description value in an element immediately after a "Parking
Description & Instructions" heading. There is no id, role, or label on the value element itself:

```ts
page.getByText('Parking Description & Instructions', { exact: true })
    .locator('xpath=following-sibling::*[1]')
```

**CSS `id` selector — used for inputs with a stable `id` but no accessible label:**

Three textarea/input fields in the Description and Availability sections have `id` attributes but
no `<label>` associations that `getByLabel` can resolve:

```ts
page.locator('#listing_title')
page.locator('#listing_description')
page.locator('#listing_instructions')
page.locator('#numberOfSpaces')
```

**CSS class selector — third-party widget (Google Places autocomplete):**

The address autocomplete dropdown is rendered by the Google Maps Places API and injects its own
DOM with no semantic roles or labels. The only stable hook is the `.pac-item` class on each
suggestion row:

```ts
page.locator('.pac-item').first()
```

This is the one locator in the suite that doesn't follow the accessibility-first rule. It's
acceptable here because the element is owned by a third-party library (not the app), and there is
no label, role, or text that uniquely identifies the first suggestion. If the app ever wraps the
autocomplete in a custom component with accessible markup, replace this with `getByRole`.

### Fallback decision tree (quick reference)

```
Does the element have a semantic role (button, link, textbox, combobox, etc.)?
  → YES: getByRole(role, { name: '...' })
  → NO ↓

Does the element have an associated <label> with matching for/id or aria-label?
  → YES: getByLabel('...')
  → NO ↓

Is the label text present in the DOM but the for/id pairing is broken?
  → YES: getByText(label).locator('xpath=..').getByRole / .locator('input')
  → NO ↓

Does the element have stable visible text of its own?
  → YES: getByText('...', { exact: true })
  → NO ↓

Does the element have a stable unique id attribute?
  → YES: locator('#id')
  → NO ↓

Is this a third-party widget with no semantic hooks?
  → YES: locator('.class') — document the reason, flag for future review
```

## Best practices applied

- **Saved auth state over per-test login.** The `setup` project runs once; every test in
  `chromium` reuses the saved storage state. This avoids repeated login UI interactions and the
  associated flake surface.
- **Relative count assertion.** The listings count is captured before creation and compared as
  `+1` after, so the assertion is resilient to pre-existing listing data in the staging account.
- **Polling for the count.** `expect(...).toPass()` retries the count check for up to 10 seconds
  — guards against staging UI lag after the redirect.
- **Accessibility-first locators.** Every locator uses `getByRole`, `getByLabel`, or `getByText`
  matching visible text. No CSS selectors or XPaths.
- **Section-scoped page objects.** The multi-step wizard is decomposed into one class per step
  section rather than one monolithic page object, keeping each file focused and short.
- **Data uniqueness per run.** `Date.now()` suffixes and randomized values prevent duplicate
  listing collisions across runs and retries.

## Assumptions and what I'd add with more time

**Assumptions:**
- The saved storage state (`playwright/.auth/user.json`) remains valid for the duration of a run.
  Tokens expire; if tests start failing with unexpected redirects to `/users/sign_in`, re-run the
  `setup` project or delete the auth file to force re-authentication.
- "Indoor Lot" + "Full sized sedan" are always-available options in staging; no dynamic selection
  logic guards against these choices disappearing.
- The listings dashboard count text always matches `/You have \d+ Listings?/i`.

**What I'd add with more time:**
- Teardown: delete the created listing after the test so staging doesn't accumulate test data.
- A `dashboard.page.ts` `DashboardPage` with an `expectListingVisible(name)` method to assert the
  new listing appears by title, not just that the count incremented.
- Negative flows: attempt creation with missing required fields and assert inline validation
  messages appear.
- `data-testid` attribution requests to the dev team — would make locators more stable against
  copy changes.
- CI wiring (GitHub Actions) with the Playwright HTML report published as a build artifact and
  trace files retained on failure.
- Screenshot/video retention on failure is already configured (`screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'`, `trace: 'retain-on-failure'`) — just needs a CI pipeline to
  upload them.
