# Backend Node.js + TypeScript + Prisma Standards

## Scope
This document defines baseline standards for backend services built with:
- Node.js (LTS)
- TypeScript (strict)
- Prisma ORM (with migrations)

## Baseline Stack
- Runtime: Node.js LTS
- Language: TypeScript (ES2022+)
- Framework: (choose one) Express / Fastify / NestJS (project-specific)
- ORM: Prisma
- DB: PostgreSQL (preferred) / MySQL (allowed) / SQLite (dev-only)
- Validation: Zod (preferred) or class-validator (Nest)
- Logging: pino (preferred) or Winston
- Testing: Vitest or Jest + Supertest

## Project Layout (suggested)
```txt
src/
  app.ts
  server.ts
  config/
  modules/
    <domain>/
      <domain>.controller.ts
      <domain>.service.ts
      <domain>.repo.ts
      <domain>.schema.ts
      <domain>.routes.ts
      <domain>.types.ts
  prisma/
    schema.prisma
    migrations/
  lib/
  utils/
test/
```

## Environment & Configuration
- Keep config in environment variables; validate on boot.
- Never read env vars directly in business logic; use a typed config module.
- Support `.env` for local dev only; CI uses real env vars.
- Required: `NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`.

## Prisma Standards
- Schema:
  - Use `@id` + `@default(cuid())` (or uuid) for primary keys unless project requires numeric.
  - Prefer `DateTime` columns named `createdAt`, `updatedAt` with defaults/updates.
  - Add unique constraints for identifiers (email, externalId, etc.).
- Migrations:
  - Use `prisma migrate dev` locally; commit migration files.
  - Production applies migrations via `prisma migrate deploy`.
  - Never edit applied migrations; create a new migration.
- Client usage:
  - Create a single PrismaClient instance and reuse it.
  - Never pass PrismaClient deep into code; wrap per-module repos.
  - Prefer explicit transactions (`prisma.$transaction`) for multi-step writes.

## API Standards
- REST (default):
  - Resources use nouns: `/users`, `/orders/:id`.
  - Use HTTP semantics correctly (GET/POST/PATCH/DELETE).
  - Consistent pagination: `page`, `pageSize` or `cursor` (choose one).
  - Consistent error shape (see below).
- OpenAPI:
  - Maintain a spec if the project is external-facing or multi-client.

## URL Versioning
Use URL path versioning for all HTTP APIs:

```txt
/api/v1/<domain>
```

Rules:
- All routes are prefixed with `/api/v1`.
- Do not introduce unversioned endpoints.
- Version bumps (`/api/v2`) are reserved for breaking API changes.

## HTTP Status Code Policy
Use these status codes consistently:

| Case | Status Code |
| --- | --- |
| Success (GET) | 200 |
| Created | 201 |
| No Content | 204 |
| Validation Error | 400 |
| Unauthorized | 401 |
| Forbidden | 403 |
| Not Found | 404 |
| Conflict | 409 |
| Server Error | 500 |

Notes:
- `204` responses must not include a response body.
- `400` is for invalid input/validation failures; prefer `409` for state conflicts (e.g., unique constraint collisions) where applicable.

## Pagination Standard (Cursor Only)
Use cursor pagination (stateful continuation model) for list endpoints.

Rules:
- Never use offset/page pagination (`page`, `offset`, `skip`) in APIs.
- Cursor pagination uses query params:
  - `limit` (number)
  - `cursor` (opaque string; optional)
- The cursor is opaque to clients; do not expose internal DB ids or raw timestamps without encoding.

## List Query Format (Filters + Sort)
Use this official query string format for list endpoints:

```txt
/<domain>?filter[role]=admin&sort=-created_at
```

Rules:
- Filters use bracket notation: `filter[<field>]=<value>`.
  - Example: `filter[role]=admin`
- Sort uses a single `sort` param:
  - Ascending: `sort=created_at`
  - Descending: `sort=-created_at` (leading `-` means descending)
- Field names in query params are `snake_case` and must match the API contract (not necessarily DB column names).
- If an endpoint supports multiple filters, include multiple `filter[...]` params (one per field).

## Response Contract (Standard)
All endpoints return a consistent JSON envelope:
- `success`: boolean (always present)
- `data`: any (present on success; may be `{}`, `[]`, or a primitive by endpoint contract)
- `meta`: object (optional; used mainly for list endpoints)
- `message`: object (optional; localized mapping + developer-provided fallback)
- `error`: object (present on failure)

## Consistency Rule (Most Important)
Consistency over perfection.

Rules:
- Use the same naming conventions everywhere (snake_case in payloads/queries, consistent field names).
- Use the same response structure everywhere (standard envelope).
- Use the same error style everywhere (stable `error.code` + `message { key, fallback }`).
- Use the same pagination style everywhere (cursor pagination only; never offset/page).

### JSON Key Casing
All response payload keys use `snake_case` (including `has_next`, `next_cursor`, `request_id`).

### Success Response (non-paginated)
```json
{
  "success": true,
  "data": {},
  "message": {
    "key": "some.domain.success.some_event",
    "fallback": "Optional human-readable success message"
  }
}
```

### Success Response (paginated list)
```json
{
  "success": true,
  "data": [],
  "meta": {
    "limit": 10,
    "has_next": true,
    "has_previous": false,
    "next_cursor": "MjAyNi0wNS0xMFQwOTo1OTowMFo=|104",
    "previous_cursor": null
  },
  "links": {
    "self": "/<endpoint>?limit=10",
    "next": "/<endpoint>?limit=10&cursor=MjAyNi0wNS0xMFQwOTo1OTowMFo=|104",
    "previous": null
  },
  "message": {
    "key": "some.domain.success.list_loaded",
    "fallback": "Loaded successfully"
  }
}
```
Rules:
- `meta` is present for list endpoints and may be omitted otherwise.
- If filters/sort are supported, they must be consistent and documented per endpoint.
- `links.next`/`links.previous` are optional; when present they must match the meta cursors.

### Error Response (canonical)
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": {
      "key": "users.error.user_not_found",
      "fallback": "User Not Found"
    }
  }
}
```
Optional error fields (explicitly allowed):
- `error.details` (object) for validation/field errors
- `error.request_id` (string) for correlation (prefer header `x-request-id` too)

Error rules:
- `error.code` must be a stable, documented constant (no ad-hoc strings).
- Never leak stack traces in production responses.
- Log internal errors; return safe error `code` and `message` to clients.

## Logging & Observability
- Structured logs (JSON), include:
  - `requestId`, `userId` (if known), `route`, `method`, `statusCode`, `durationMs`
- Use a request correlation id:
  - Accept `x-request-id` if present; otherwise generate.
- Avoid logging PII or secrets:
  - Never log passwords, tokens, raw Authorization headers.

## Security Baseline
- Validate and sanitize all input.
- Enforce authn/authz at route boundaries; re-check in service layer for critical actions.
- Rate limit public endpoints (project-specific).
- Use Helmet (Express/Fastify equivalents) + CORS configured explicitly.

## Authentication Standards (OAuth/OIDC, WebAuthn, 2FA)
Support multiple authentication methods while keeping a single, consistent session model.

### OAuth / OIDC
- Use OIDC Authorization Code flow (with PKCE for public clients).
- Prefer OIDC (OpenID Connect) over "OAuth-only" whenever identity (profile/email) is needed.
- Validate:
  - issuer (`iss`)
  - audience (`aud`)
  - token signature and expiry
  - nonce/state where applicable
- Do not trust email verification claims without checking provider guarantees.
- Store provider links in a dedicated table (provider + provider_user_id) and map to internal user id.

### WebAuthn (Passkeys / Fingerprint)
- Use WebAuthn for passwordless authentication with platform authenticators (biometrics) or security keys.
- Treat WebAuthn credentials as authenticators owned by a user:
  - store credential id, public key, sign count, transports, and device metadata
- Always use server-generated challenges; challenges are single-use and short-lived.
- Verify RP ID, origin, and user verification requirements.

### 2FA (TOTP)
- Support optional TOTP-based 2FA:
  - enrollment (generate secret + QR)
  - verification during enrollment
  - enforcement on login when enabled
- Support recovery/backup codes (single-use) for account recovery.
- Never log OTP/TOTP codes or shared secrets.

### Session Model (choose one and keep consistent)
- Prefer stateless access tokens (JWT) + refresh tokens (rotating) OR server-side sessions (project decision).
- Regardless of method, the user identity presented to downstream routes must be the same shape (e.g., `user_id`, roles/permissions).

### Endpoint Conventions (suggested)
```txt
/api/v1/auth/oauth/<provider>/start
/api/v1/auth/oauth/<provider>/callback
/api/v1/auth/webauthn/register/options
/api/v1/auth/webauthn/register/verify
/api/v1/auth/webauthn/login/options
/api/v1/auth/webauthn/login/verify
/api/v1/auth/2fa/setup
/api/v1/auth/2fa/verify
/api/v1/auth/2fa/disable
```

## Security & Data Exposure Rules
Apply these rules to all endpoints and logs:

- Do not expose stack traces to clients (any environment).
- Do not expose raw database errors to clients (constraint names, SQL details, Prisma error dumps).
- Do not expose internal identifiers unless required by the API contract (avoid leaking DB primary keys, internal foreign keys, sequential ids).
- Do not accept mass assignment:
  - Never pass request bodies directly into ORM create/update calls.
  - Use allowlists (`pick`/DTO schemas) for writable fields per endpoint.
  - Ignore or reject unknown fields (project policy), but never persist them silently.

## Field Exposure Policy (DTO / Serialization)
Use a DTO/serialization layer to control what fields are returned to clients.

Rules:
- Default-deny: only explicitly exposed fields are returned.
- Never return secrets or sensitive fields (even to admins unless explicitly required and reviewed).
- Hide internal-only fields by default.

Examples (must not be returned):
- `password` / `password_hash`
- internal flags (e.g., `is_internal`, `is_deleted`, `is_system`, `internal_notes`)
- internal IDs/keys not needed by the API contract

Implementation guidance:
- Map DB models -> DTOs (do not return ORM entities directly).
- Prefer explicit `select` in Prisma queries + DTO mapping to avoid accidental exposure.

## Performance
- Prefer DB-side filtering/pagination over in-memory.
- Avoid N+1 queries; use Prisma `include/select` thoughtfully.
- Use indexes for common lookup keys (unique/foreign keys, cursor columns).

## CI Expectations
- Typecheck must pass.
- Lint must pass.
- Tests must pass.
- Prisma schema validation must pass.

## Minimal "New Module" Checklist
- Route(s) + request validation
- Service with domain logic
- Repo with Prisma queries
- Tests (unit + integration if endpoint)
- Update OpenAPI/spec (if used)
