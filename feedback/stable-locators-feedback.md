# Feedback — How to Achieve More Stable Locators on WhereiPark

> Based on the **Playwright-Friendly Frontend Design Implementation Guide** and observations made
> during the automation assessment against `staging.whereipark.com`.

---

## Guide Summary

The guide establishes a locator priority tree and implementation standards for building testable
frontend components:

| Priority | Method | Strategy |
|---|---|---|
| 1 | `getByRole()` | Semantic HTML — `<button>`, `<nav>`, `<dialog>` | 
| 2 | `getByLabel()` | Inputs explicitly bound to visible `<label>` via matching `id`/`htmlFor` |
| 3 | `getByPlaceholder()` | Inputs with a functional placeholder attribute |
| 4 | `getByTestId()` | Dedicated `data-testid` attributes as a stable fallback contract |
| Never | Raw CSS / XPath | Dynamic build hashes or layout indices — brittle, breaks on refactor |

The guide also defines three component-specific standards:
- **Custom dropdowns** — pair `<label htmlFor>` with `inputId` and `aria-label` so `getByLabel` works
- **High-density tables/grids** — add `data-testid` on the container, `aria-label` on cell action buttons
- **Async loaders** — expose `aria-busy` and a `data-testid` on the spinner so Playwright's
  auto-wait can synchronize without hardcoded delays

---

## What Was Found During Automation

During the assessment, several elements on the app required workarounds because the recommended
locator strategies couldn't be applied. Each issue is mapped to the guide's checklist item it
violates.

---

### 1. Login Form — Broken `for`/`id` Label Association

**Violates:** *Form Accessibility* checklist item — "Every text input is explicitly bound to a
visible `<label>` via matching `id`/`htmlFor`."

**What happened:** The email and password fields have mismatched `for`/`id` attributes, so
`getByLabel('Email')` resolved to the wrong element. The workaround was a brittle parent-traversal:

```ts
// Had to do this instead of getByLabel('Email')
page.getByText('Email', { exact: true }).locator('xpath=..').getByRole('textbox')
page.getByText('Password', { exact: true }).locator('xpath=..').locator('input')
```

**Recommended fix:**

```html
<!-- Ensure for and id values match exactly -->
<label htmlFor="user_email">Email</label>
<input id="user_email" type="email" />

<label htmlFor="user_password">Password</label>
<input id="user_password" type="password" />
```

**Playwright result:** Clean, readable locators with no DOM traversal:
```ts
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill(password);
```

---

### 2. Listing Description & Availability Fields — IDs Without Label Associations

**Violates:** *Form Accessibility* — inputs have `id` attributes but no `<label htmlFor>` binding.

**What happened:** `#listing_title`, `#listing_description`, `#listing_instructions`, and
`#numberOfSpaces` are reachable by `locator('#id')` but not by `getByLabel()`. CSS `id` selectors
are tier-5 in the priority chain — they work, but they're not human-readable and break if the `id`
is renamed during a refactor.

```ts
// Current — fragile to id renames
page.locator('#listing_title')
page.locator('#numberOfSpaces')
```

**Recommended fix:**

```html
<label htmlFor="listing_title">Listing Title</label>
<input id="listing_title" type="text" />

<label htmlFor="numberOfSpaces">Number of Spots</label>
<input id="numberOfSpaces" type="number" />
```

**Playwright result:**
```ts
await page.getByLabel('Listing Title').fill(title);
await page.getByLabel('Number of Spots').fill(numberOfSpots);
```

---

### 3. Google Places Autocomplete — No Stable Hook on the Dropdown Container

**Violates:** *Stable Hooks* checklist item — "Complex multi-nested interface layers contain an
explicit fallback `data-testid` contract point."

**What happened:** The autocomplete dropdown is injected by the Google Maps Places API with no
semantic roles or labels. The only hook available was the third-party `.pac-item` CSS class:

```ts
// Depends on Google's internal class name — could change without notice
page.locator('.pac-item').first()
```

**Recommended fix:** Wrap the autocomplete input and dropdown in a container with a `data-testid`,
and pass an `aria-label` to the input itself:

```html
<div data-testid="address-autocomplete">
  <label htmlFor="location-address">Location Address</label>
  <input
    id="location-address"
    aria-label="Location Address"
    type="text"
    ref={autocompleteRef}
  />
</div>
```

**Playwright result:** Even if `.pac-item` changes, the suggestion can still be scoped:
```ts
await page.getByTestId('address-autocomplete').getByLabel('Location Address').fill(address);
// Then wait for suggestions within the known container
await page.getByTestId('address-autocomplete').locator('.pac-item').first().click();
```
The label locator becomes stable; only the last-resort `.pac-item` remains third-party-dependent.

---

### 4. "Next: Submit Listing" Button — Rendered as `<a>` Instead of `<button>`

**Violates:** *Semantic Fallbacks* checklist item — "Interactive components rely on native tags
(`<button>`) or declare an explicit ARIA role override."

**What happened:** Every "Next" button in the Create Listing wizard uses `<button>`, which
`getByRole('button', { name: '...' })` finds correctly. The final step renders as an `<a>` link,
so the same locator strategy silently returns nothing — the test fails with a timeout rather than
a clear "element not found" error.

```ts
// Works for all other steps
page.getByRole('button', { name: 'Next: Listing Details' })

// Fails silently — this is an <a>, not a <button>
page.getByRole('button', { name: 'Next: Submit Listing' }) // ❌ finds nothing
page.getByRole('link', { name: 'Next: Submit Listing' })   // ✅ workaround used
```

**Recommended fix:** Render all wizard navigation controls as `<button>` elements consistently.
If it must be an `<a>` for routing reasons, add `role="button"`:

```html
<!-- Option 1: use a button -->
<button type="submit">Next: Submit Listing</button>

<!-- Option 2: if anchor is required, declare the role explicitly -->
<a href="/listing_submitted" role="button">Next: Submit Listing</a>
```

**Playwright result:** Consistent locator pattern across all wizard steps:
```ts
page.getByRole('button', { name: 'Next: Submit Listing' })
```

---

### 5. No `data-testid` Attributes Across the App

**Violates:** *Stable Hooks* — no fallback `data-testid` contract points on any component.

**What happened:** When `getByRole` and `getByLabel` weren't available, the suite had to fall back
to parent-traversal XPath, `following-sibling` XPath, and CSS `id` selectors. These are harder to
read, harder to maintain, and more likely to break when the DOM structure changes.

**Recommended fix:** A targeted `data-testid` pass on the handful of elements that lack both a
semantic role and an accessible label. This doesn't need to be every element — just the ones where
the first three locator tiers can't reach cleanly:

| Element | Suggested `data-testid` |
|---|---|
| Listing title textarea | `data-testid="listing-title-input"` |
| Listing description textarea | `data-testid="listing-description-input"` |
| Listing instructions textarea | `data-testid="listing-instructions-input"` |
| Number of spots input | `data-testid="number-of-spots-input"` |
| Confirmation page description value | `data-testid="confirmed-listing-description"` |
| Address autocomplete container | `data-testid="address-autocomplete"` |

**Playwright result for the confirmation page:**
```ts
// Current — XPath following-sibling
page.getByText('Parking Description & Instructions', { exact: true })
    .locator('xpath=following-sibling::*[1]')

// With data-testid — clear and refactor-safe
page.getByTestId('confirmed-listing-description')
```

---

## Summary — Checklist Against the Guide

| Guide Checklist Item | Status on WhereiPark | Priority |
|---|---|---|
| Form Accessibility — inputs bound to labels | ❌ Login form broken; description/availability fields have IDs only | High |
| Semantic Fallbacks — `<button>` or explicit ARIA role | ⚠️ Wizard inconsistent — one step uses `<a>` instead of `<button>` | Medium |
| Table Contextuality — `aria-label` on grid cell actions | ℹ️ Not tested in this assessment | — |
| Decoupled Selectors — no CSS hashes in tests | ✅ Avoided throughout; only `.pac-item` used as last resort | — |
| Stable Hooks — `data-testid` on complex nested layers | ❌ No `data-testid` attributes anywhere on the app | High |
