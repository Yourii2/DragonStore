# Auto-Skill Orchestration & Engineering Standards

## 1. Automatic Skill Activation
Whenever executing tasks, fixing bugs, refactoring, building endpoints, or auditing changes, automatically invoke and adhere to the relevant domain skills installed in `.agents/skills/` without waiting for explicit prompt instructions:

- **When debugging or fixing errors:**
  - Automatically apply `diagnosing-bugs` and `bug-hunter` (trace from root cause, inspect network/DB states, reproduce and eliminate regression).
  - Apply `what-could-break` before modifying shared files (`api.php`, shared components, database schema) to identify side-effects.

- **When writing or refactoring APIs & Database code:**
  - Automatically apply `api-endpoint-builder` (strict parameter validation, sanitize inputs, consistent JSON envelope, transaction safety).
  - Apply `api-contract-testing` to verify frontend/backend data contract consistency.

- **When reviewing code or before pushing / releasing:**
  - Automatically apply `five-axis-code-review` (correctness, security, readability, performance, test coverage).
  - Automatically apply `codebase-audit-pre-push` (remove temp debug scripts, sanitize logs, verify production bundle build, prevent leaks).

- **When optimizing system performance:**
  - Automatically apply `performance-optimizer` (database query indexing, reducing redundant API calls, React re-render prevention).

- **When designing robust logic & settings:**
  - Automatically apply `poka-yoke` (mistake-proofing code and process so invalid actions fail gracefully or become impossible).

## 2. Execution Discipline
- Always preserve clean code without leaving scratch/temporary scripts.
- Ensure production assets (`vite build`) are in sync when modifying React frontend code.
