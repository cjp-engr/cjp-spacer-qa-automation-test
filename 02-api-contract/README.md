# Exercise 2 — API Contract Automation

## Objective

Write automated tests that verify a single HTTP API endpoint behaves according
to its contract — across the happy path and the important failure paths. This
exercise is independent of the UI.

**The endpoint under test:**

> `GET /api/v3/space_configurations?listing_id=<id>`
>
> Returns the parking/space configurations that belong to a single listing.
> Read-only, so it's safe to hit repeatedly against staging.

**Cases to cover (at minimum):**

1. **Happy path** — a valid, authenticated request returns the expected status
   code and a response body matching the documented shape.
2. **Unauthorized** — a request without (or with an invalid) auth token is
   rejected with the correct status code (e.g. `401`).
3. **Validation error** — a request missing a required parameter (or with an
   invalid value) returns the correct error status and error shape.

Add any further cases you think are valuable.

## Use any tools you like

Postman/Newman, REST Assured, Playwright's request context, pytest + requests,
Karate, k6 — your choice. Use whatever lets you assert cleanly on status codes
and response bodies.

## Resources

> **Note:** request client credentials before starting.

- **API base URL:** `https://staging.whereipark.com/api/v3`
- **Authentication:** OAuth 2.0 Bearer JWT in the `Authorization` header
  (`Authorization: Bearer <access_token>`). Obtain a token by POSTing your
  client credentials to the token endpoint (no auth required on that call):

  ```bash
  curl -X POST https://staging.whereipark.com/oauth/token \
    -H "Content-Type: application/json" \
    -d '{
      "grant_type": "client_credentials",
      "client_id": "<your_client_id>",
      "client_secret": "<your_client_secret>"
    }'
  # => 200 { "access_token": "eyJ...", "token_type": "Bearer",
  #          "expires_in": 3600, "created_at": 1700000000 }
  ```

  Tokens expire after 1 hour. A `client_credentials` token must belong to a
  client whose role can manage the target listing (admin, or the listing's
  company/listing manager) — otherwise reads return `403`.
  - Test token / credentials: *request `client_id` / `client_secret` and a
    valid `listing_id` from your contact.*
- **Endpoint contract:**
  - Method & path: `GET /api/v3/space_configurations`
  - Required parameters:
    - `listing_id` — Integer, **query string**. The listing whose
      configurations to return.
  - Optional parameters: none.
  - Success response: `200 OK`. A **bare JSON array** of space-configuration
    objects (not wrapped in `{ "data": ... }` — this API serializes collections
    directly). Empty listings return `[]`. Each element has this shape:

    ```json
    [
      {
        "id": 1,
        "listing_id": 10,
        "name": "Level 1 Compact",
        "unit_type": "compact_car",
        "building_type": "underground",
        "reservation_type": "reserved",
        "stacker_type": null,
        "ev": true,
        "height_restriction": "2.1",
        "level": 1,
        "level_type": "underground_level",
        "car_width": null,
        "car_length": null,
        "car_size": null,
        "entrance_height": null,
        "stairs_access": false,
        "tricky_access": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
    ```

  - Error responses (all failures use the shape `{ "error": ... }`, some also
    include `error_description`):
    - `400 Bad Request` — `listing_id` missing/non-integer:
      `{ "error": "listing_id is missing" }`
    - `401 Unauthorized` — no Bearer token:
      `{ "error": "token_missing", "error_description": "No Bearer token provided" }`
    - `401 Unauthorized` — malformed/invalid token:
      `{ "error": "invalid_token", "error_description": "Token is invalid" }`
    - `401 Unauthorized` — expired token:
      `{ "error": "token_expired", "error_description": "Token has expired" }`
    - `403 Forbidden` — token's client/user does not manage the listing:
      `{ "error": "Forbidden" }`
    - `404 Not Found` — no listing with that `listing_id`:
      `{ "error": "Listing not found" }`
    - `429 Too Many Requests` — client rate limit exceeded:
      `{ "error": "Rate limit exceeded. Maximum X requests per Y seconds." }`
- Please keep request volume modest and avoid destructive operations against the
  environment. (This endpoint is a read, so it's safe — but the same client can
  reach write endpoints, so don't POST/PUT/DELETE against staging data.)

## What to produce

1. **The automated test(s)** covering the cases above, committed to this
   directory (or a subfolder).
2. **A `NOTES.md`** covering:
   - How to install dependencies and run the tests (exact commands).
   - How you organized cases and validated response bodies (schema/shape checks,
     not just status codes).
   - Any assumptions and what you'd add with more time.
3. **Evidence it runs** — terminal output, a Newman/CI report, or similar is
   welcome but optional.

## What we're looking for

- Coverage of both happy and negative paths.
- Assertions on the **response shape/contract**, not just the status code.
- Clear handling of auth and test data.
- Tests that could plausibly slot into a CI pipeline.
