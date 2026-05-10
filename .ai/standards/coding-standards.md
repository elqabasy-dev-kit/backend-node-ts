# Coding Standards (TypeScript Backend)

## TypeScript Strictness
- `strict: true` is mandatory.
- Prefer `unknown` over `any`.
- Use type narrowing and exhaustive checks.
- No implicit `any`, no `// @ts-ignore` without a tracked TODO link.

## Naming Conventions
- Files: `kebab-case.ts` or `dot.case.ts` for roles (e.g., `user.service.ts`).
- Types/Interfaces: `PascalCase` (e.g., `UserDto`).
- Variables/functions: `camelCase`.
- Constants/enums: `SCREAMING_SNAKE_CASE` only for true constants.
- Prisma models: `PascalCase` (Prisma standard).

## Functions & Modules
- Single responsibility per function.
- Avoid long parameter lists; prefer objects:
  - `createUser({ email, name })` not `createUser(email, name)`.
- Keep modules small; split by domain.
- Prefer pure functions for transformations.

## Validation & Parsing
- Validate at the boundary (HTTP handler/controller).
- Parse incoming data into typed DTOs using Zod (or project standard).
- Never trust `req.body`/`req.query` without validation.

## Error Handling
- Throw domain-specific errors from service layer (e.g., `NotFoundError`).
- Convert errors to HTTP responses in a central error middleware/filter.
- Never swallow errors silently.
- Always include a stable `error.code` in API responses.

## HTTP Status Codes
Endpoints must follow the project's status code policy (see `.ai/standards/backend-node-ts.md`):
- `200` successful GET
- `201` resource created
- `204` success with no body
- `400` validation error
- `401` unauthenticated
- `403` unauthorized (forbidden)
- `404` not found
- `409` conflict
- `500` server error

## Pagination
- Use cursor pagination only for list endpoints (stateful continuation model).
- Do not implement offset/page pagination (`offset`, `page`, `skip`) in API contracts.
- Treat cursors as opaque strings; do not parse or rely on cursor internals in clients.

## Authentication & Secrets
- Never log auth credentials or secrets (passwords, OAuth tokens, refresh tokens, TOTP secrets, OTP codes).
- Keep auth flows in a dedicated `auth` module with clear boundaries:
  - controllers/handlers: validate input, call services, shape responses
  - services: implement auth logic (OAuth, WebAuthn, 2FA)
  - repos: persistence of users/credentials/tokens
- Use allowlists for auth DTOs as well (no mass assignment).

## Response Messages & Mapping Keys
When returning `message: { key, fallback }` (success or error):

### Message key registry (must exist in code)
- The repo must contain a developer-owned registry of allowed `message.key` strings (for example: `src/i18n/message-keys.ts` or `src/constants/message-keys.ts`).
- Developers/agents must use existing keys from that registry; do not invent keys inline in handlers/services.
- Adding a new key requires updating the registry in the same PR.

### Fallback messages are developer-controlled
- `message.fallback` is written at the callsite by the developer (no centralized translation service/store is required).
- Clients may use `message.key` for localization while `fallback` provides a safe, readable default.

### Type-safety suggestions
- Prefer `as const` key collections or a string-literal union type for `message.key`.
- Prefer an enum or union type for `error.code`.

## Async & Promises
- Always `await` async calls unless explicitly returning a Promise.
- Avoid `Array.prototype.forEach(async ...)` (use `for...of` or `Promise.all`).
- Use timeouts for outbound calls where possible.

## Database Access
- Repositories own database interaction.
- Service layer should not contain raw Prisma queries.
- Use transactions for multi-step writes.
- Be explicit with Prisma `select` to avoid over-fetching.

## Data Exposure & Mass Assignment
- Never return stack traces in API responses.
- Never return raw DB/ORM errors to clients; map to stable `error.code` + safe `message`.
- Avoid exposing internal IDs unless required by the API contract.
- Prevent mass assignment:
  - Never spread/forward `req.body` into create/update.
  - Use DTOs / schema allowlists for writable fields.

## Field Exposure (DTO Layer)
- Use DTOs/serializers for all outbound responses; do not return ORM entities directly.
- Default-deny: expose only explicitly listed fields.
- Never expose secrets (e.g., `password`, `password_hash`) or internal flags unless explicitly required by the API contract and reviewed.

## Testing Standards
- Test pyramid:
  - Unit tests for pure logic
  - Integration tests for DB/repo logic
  - API tests for critical endpoints
- Tests must be deterministic:
  - No network calls; mock external services.
  - Control time with fakes when needed.
- Prefer table-driven tests for validation edge cases.

## Linting & Formatting
- Use the repository's configured formatter (Prettier/biome).
- Do not hand-format inconsistent code; run the formatter when available.

## Documentation
- Public functions/modules: short docstring only when non-obvious.
- Keep README and API docs in sync with changes.

## Pull Request Hygiene
- Keep diffs small and focused.
- Avoid drive-by refactors.
- Add tests with behavior changes.
- Update Prisma migrations/schema as needed.

## Consistency Over Perfection
When choosing between a "better" approach and consistency with existing standards, prefer consistency:
- Same naming
- Same structure
- Same error style
- Same pagination style
