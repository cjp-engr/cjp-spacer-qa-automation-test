# Exercise 1 — Web End-to-End Automation

## Objective

Automate a single, realistic user journey through our web application from start
to finish, and assert that it succeeded. We want to see a clean, reliable E2E
test — not a broad suite.

**The journey to automate:**

> Sign in → create a new listing → confirm the newly created listing appears in
> the account/dashboard view.

If any step in that flow is unclear against the live app, make a reasonable
choice and note your assumption.

## Use any tools you like

Playwright, Cypress, Selenium, WebdriverIO — your choice. Use whatever lets you
produce your best, most maintainable work.

## Resources

> **Note:** request access credentials before starting.

- **Application URL (staging/QA):** https://staging.whereipark.com 
- **Test account credentials:**
  - Username / email: *request from contact*
  - Password: *request from contact*
- **Notes on the app:**
  - The UI updates portions of the page asynchronously (partial page updates
    without a full reload). Design your waits and assertions accordingly.
  - Stable test hooks: the application does **not** currently expose dedicated
    `data-testid` attributes. Please rely on accessible roles, labels, and
    visible text for your locators.
  - Please **do not** run destructive or high-volume actions against the
    environment. A handful of created listings is fine.

## What to produce

1. **The automated test(s)** for the journey above, committed to this directory
   (or a subfolder).
2. **A `NOTES.md`** covering:
   - How to install dependencies and run the test (exact commands).
   - Your locator and waiting strategy, and how you kept the test from being
     flaky.
   - Any assumptions you made and anything you'd add with more time.
3. **Evidence it runs** — a short terminal output snippet, screenshot, video, or
   trace is welcome but optional.

## What we're looking for

- Robust locators (roles/labels/test hooks over brittle CSS/XPath).
- Proper handling of asynchronous UI — auto-waiting / web-first assertions
  rather than fixed `sleep`s.
- Meaningful assertions that prove the journey actually succeeded.
- Readable structure (fixtures / page objects / helpers as you see fit).
