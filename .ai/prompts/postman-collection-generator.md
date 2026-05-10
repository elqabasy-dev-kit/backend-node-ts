# Prompt: Generate `postman_collection.json` (Deterministic + Tested)

You are an AI agent responsible for producing a repo-root `postman_collection.json` that matches the backend API contract and standards.

## Inputs (must read)
- `.ai/project/api-plan.md`
- `.ai/standards/backend-node-ts.md`
- `.ai/standards/postman-tests.md`

## Output
- Write/replace `postman_collection.json` at repo root.
- Do not invent endpoints. Only generate what exists in `.ai/project/api-plan.md`.
- Keep naming and folder structure consistent and stable between runs.

## Rules
- Use `{{base_url}}` for all request URLs.
- Use `/api/v1/...` base path.
- Apply the standard response envelope tests to every request:
  - JSON Content-Type
  - `success` boolean + `data` on 2xx
  - `success=false` + `error.code` + `error.message.key/fallback` on non-2xx
- For list endpoints:
  - Use cursor pagination (`limit`, optional `cursor`)
  - Add cursor meta/links tests from the standards
- Add at least one negative test per domain (401/403/400/404/409 as applicable).
- Add an Auth bootstrap pre-request script at the collection or `Auth` folder level to populate `{{auth_token}}` once per run.
- Do not log credentials/tokens in scripts.

## Acceptance Checklist
- Collection runs in Newman without manual edits.
- Requests are grouped in the required folder structure.
- Tests fail with clear messages when envelope/pagination rules are broken.
- No offset/page pagination appears anywhere.

