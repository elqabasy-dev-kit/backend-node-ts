# Token Budget & Minimal Context Rules

## Goal
Keep prompts and context small while preserving correctness.

## What to Provide (in order)
1. The exact goal (1-3 sentences).
2. File paths involved.
3. The failing output (error text or failing test name).
4. The smallest relevant code snippets (not whole files).
5. Constraints (Node version, DB, framework, deadlines).

## Preferred Evidence
- Diffs over full files.
- Stack traces trimmed to the first relevant frames.
- Command + output:
  - `npm test` / `pnpm test` output
  - `tsc -p tsconfig.json` output

## Context Minimization Checklist
- Include only the modules touched by the change.
- Avoid pasting generated files (build output, lockfiles) unless necessary.
- Summarize long logs; include exact error lines verbatim.
- If an API response is wrong, include:
  - request (method, path, headers subset)
  - response status + body
  - expected result

## Safe Defaults for Agents
- Assume TypeScript `strict` and prefer type-safe solutions.
- Prefer incremental patches; avoid broad refactors unless required.
- Make changes test-first when behavior is ambiguous.

## "Diff-First" Prompt Template
```md
Goal:

Constraints:

Files:
- path/to/file.ts

Current behavior:

Expected behavior:

Repro steps:

Relevant diff/snippet:
```
