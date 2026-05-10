# Postman Collection Standards

## Purpose
Maintain a repo-root `postman_collection.json` that is always in sync with the backend API contract, and can be run in CI (Newman) with meaningful assertions.

Source of truth:
- `.ai/project/api-plan.md` (endpoint list + notes)
- `.ai/standards/backend-node-ts.md` (response envelope, error style, pagination, versioning)

## Required Files (Repo Root)
- `postman_collection.json` (generated, committed)
- Optional: `postman_environment.json` (not committed if it contains secrets)

## Base Variables
Use environment variables (do not hardcode URLs or tokens):
- `{{base_url}}` (required)
- `{{auth_token}}` (optional; bearer token)

Auth header convention:
- `Authorization: Bearer {{auth_token}}`

## Folder Structure (Collection)
Organize folders by domain and common flows:
- Auth
- Users
- Me
- Admin
- Health
- (project-specific domains)

Each folder:
- Contains happy-path requests first, then common failures (401/403/400/404/409).

## Request Naming
Use stable, explicit names:
```txt
Users - List (cursor)
Users - Get By Id
Users - Create
Users - Update
Users - Delete
```

## Standard Response Assertions
All tests must respect the project response envelope and `snake_case` payload keys.

### Success Response Tests (2xx)
```js
pm.test("Status is 2xx", () => {
  pm.response.to.be.success;
});

pm.test("Content-Type is JSON", () => {
  pm.response.to.have.header("Content-Type");
  pm.expect(pm.response.headers.get("Content-Type")).to.match(/json/i);
});

pm.test("Envelope: success=true and data exists", () => {
  const body = pm.response.json();
  pm.expect(body).to.have.property("success", true);
  pm.expect(body).to.have.property("data");
});
```

### Error Response Tests (4xx/5xx)
```js
pm.test("Envelope: success=false and error shape is valid", () => {
  const body = pm.response.json();
  pm.expect(body).to.have.property("success", false);
  pm.expect(body).to.have.property("error");
  pm.expect(body.error).to.have.property("code");
  pm.expect(body.error).to.have.property("message");
  pm.expect(body.error.message).to.have.property("key");
  pm.expect(body.error.message).to.have.property("fallback");
});
```

### Cursor Pagination Tests (List Endpoints Only)
For cursor list endpoints, validate `meta` and `links`:
```js
pm.test("Cursor pagination meta exists", () => {
  const body = pm.response.json();
  pm.expect(body).to.have.property("meta");
  pm.expect(body.meta).to.have.property("limit");
  pm.expect(body.meta).to.have.property("has_next");
  pm.expect(body.meta).to.have.property("has_previous");
  pm.expect(body.meta).to.have.property("next_cursor");
  pm.expect(body.meta).to.have.property("previous_cursor");
});

pm.test("Links exist and match cursor shape", () => {
  const body = pm.response.json();
  pm.expect(body).to.have.property("links");
  pm.expect(body.links).to.have.property("self");
  pm.expect(body.links).to.have.property("next");
  pm.expect(body.links).to.have.property("previous");
});
```

## Pre-request Script (Auth bootstrap)
Auth bootstrap must not be duplicated across requests. Put it at the collection or folder level (Auth).

Rules:
- Only fetch a token if `auth_token` is missing/expired (project decision).
- Never log credentials or tokens.

Example (email/password login; adjust to project):
```js
if (!pm.environment.get("auth_token")) {
  pm.sendRequest(
    {
      url: pm.environment.get("base_url") + "/api/v1/auth/login",
      method: "POST",
      header: { "Content-Type": "application/json" },
      body: {
        mode: "raw",
        raw: JSON.stringify({
          email: "test@demo.com",
          password: "Pass123!"
        })
      }
    },
    (err, res) => {
      pm.test("Auth token bootstrap succeeded", () => {
        pm.expect(err).to.equal(null);
        pm.expect(res).to.have.property("code", 200);
      });
      const json = res.json();
      pm.environment.set("auth_token", json.data.access_token || json.data.accessToken);
    }
  );
}
```

## Generation Rules (AI Dev-Kit)
The AI must be able to generate/refresh `postman_collection.json` deterministically from `.ai/project/api-plan.md` plus the standards:
- Base URL uses `{{base_url}}`.
- All requests include standard tests (status, JSON, envelope).
- Add at least one negative test request per domain (401/403/404/400).
- For list endpoints, include a cursor pagination request with `limit` and optional `cursor`.
- Naming, folders, and scripts must be consistent with this document.

## CI Policy (Newman)
CI must run collection tests on every PR:
- Install Newman.
- Run: `newman run postman_collection.json -e postman_environment.json` (or inject env vars in CI).
- Fail the build if any request/test fails.

## Change Policy
- Any new/changed endpoint requires updating `.ai/project/api-plan.md` and regenerating `postman_collection.json` in the same PR.
- Keep the collection minimal and deterministic; avoid manual edits unless explicitly documented.

