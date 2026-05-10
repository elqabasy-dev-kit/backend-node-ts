# Definition of Done (Backend)

## Functionality
- [ ] Requirements implemented and acceptance criteria met
- [ ] Edge cases handled (validation, not found, auth)
- [ ] Backwards compatibility considered (API + migrations)

## Code Quality
- [ ] TypeScript strict passes
- [ ] Lint/format passes
- [ ] No debug logs or commented-out code
- [ ] Sensitive data not logged
- [ ] Consistency over perfection applied (naming/structure/errors/pagination consistent)

## Database / Prisma
- [ ] Prisma schema updated (if needed)
- [ ] Migrations created and committed (if needed)
- [ ] Transaction boundaries correct
- [ ] Queries efficient (no obvious N+1)

## Tests
- [ ] Unit tests for core logic (where applicable)
- [ ] Integration/API tests for critical paths
- [ ] Tests deterministic (no real network, controlled time)
- [ ] All tests pass locally/CI

## API Contract
- [ ] Request validation implemented
- [ ] Error responses use canonical shape (`error.code`, `error.message`)
- [ ] Status codes follow policy (200/201/204/400/401/403/404/409/500)
- [ ] OpenAPI/spec updated (if used)
- [ ] All endpoints return the standard envelope (`success`, `data`, optional `meta`, optional `message`, optional `error`)
- [ ] List endpoints use cursor pagination only (no offset/page), with `meta.limit/has_next/has_previous/next_cursor/previous_cursor` and `links`
- [ ] Any `message.key` used comes from the project's message key registry (no invented keys)
- [ ] Any `message.key` includes a developer-provided `message.fallback`

## Security
- [ ] AuthN/AuthZ enforced
- [ ] Input validated/sanitized
- [ ] Secrets handled via env/config only
- [ ] Rate limiting/CORS/headers configured (if public)
- [ ] No stack traces returned to clients
- [ ] No raw DB/ORM errors returned to clients
- [ ] No unnecessary internal IDs exposed
- [ ] Mass assignment prevented (allowlist DTOs; no direct body-to-ORM)
- [ ] Field exposure enforced via DTO/serializer (no `password`, no internal flags)
- [ ] Auth secrets never logged (OAuth tokens, refresh tokens, TOTP secrets/codes)
- [ ] WebAuthn/OAuth/2FA flows covered by tests (at least happy path + common failure)

## Ops & Delivery
- [ ] Logging includes request correlation id
- [ ] Rollout plan stated (migration order, feature flag if needed)
- [ ] Documentation updated (README/notes)
