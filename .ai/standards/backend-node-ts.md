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

## Response Contract (Standard)
All endpoints return a consistent JSON envelope:
- `success`: boolean (always present)
- `data`: any (present on success; may be `{}`, `[]`, or a primitive by endpoint contract)
- `meta`: object (optional; used mainly for list endpoints)
- `message`: object (optional; localized mapping + developer-provided fallback)
- `error`: object (present on failure)

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
