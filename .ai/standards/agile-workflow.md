# Agile Workflow (Backend)

## Intake -> Delivery Flow
1. Intake
   - Capture the request in plain language.
   - Identify stakeholders and success criteria.
   - Clarify constraints (time, infra, auth, data).
2. Convert to User Stories
   - Write stories in "As a ... I want ... so that ..."
   - Add acceptance criteria and edge cases.
3. Plan
   - Break stories into tasks (API, DB, tests, docs).
   - Identify dependencies and risks.
   - Define rollout plan (feature flags, migrations).
4. Implement
   - Create smallest safe change set.
   - Keep changes incremental and testable.
5. Review
   - Self-review: tests, lint, types, security.
   - Peer review: correctness, naming, API consistency.
6. Validate
   - Run test suite + typecheck.
   - Verify migrations and backwards compatibility.
7. Release
   - Apply migrations (deploy step).
   - Monitor logs/metrics.
   - Document change and follow-ups.

## User Story Template
```md
As a <role>
I want <capability>
So that <benefit>

Acceptance Criteria:
- Given <context>, when <action>, then <outcome>
- ...

Notes:
- Edge cases:
- Telemetry:
- Security:
```

## Task Breakdown Template
```md
- API:
- DB/Prisma:
- Validation:
- AuthZ/AuthN:
- Tests:
- Docs:
- Rollout:
```

## Definition of Ready (DoR)
- Clear problem statement
- Defined acceptance criteria
- Known data model impacts
- Known auth requirements
- Test approach agreed
