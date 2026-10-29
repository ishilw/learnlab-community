# Implementation Plan

Status: Proposed. Pending architecture review. Each increment starts only after the previous one is reviewed and approved.

## Completed

Task 1: Project engineering foundation. Created CLAUDE.md, AGENTS.md, README.md, the docs and specs files, and placeholder directories for tests, evals, and .claude. Nothing is committed or pushed.

Task 1A: Claude Harness Engine integration. Installed the Harness core profile (plugin claude_harness_eng_v6, version 3.0.0) from an isolated scratch generation, then integrated selected components. Protection gates blocked some edits. Those edits are recorded for manual application by a human, not applied by the agent. Nothing is committed or pushed.

Task 1A architecture review: decision APPROVE WITH CORRECTIONS. Findings covered the Harness permission rules, the design constitution, the business specification, the architecture enforcement claims, and the Git configuration.

Task 1A architecture corrections (this record): the design constitution no longer lists unapproved invariants, the specification has traceable requirement IDs for pending areas, the architecture document separates intent from enforcement, the business documents use Learner consistently, and .gitignore no longer excludes lock files. Remaining blockers and manual actions are recorded in the correction report. Awaiting the next architecture review.

Backend sprint 1 (Task 2): backend foundation implemented under backend/ with 34 pytest tests. Covers the health endpoint, user roles, the course model and provisional lifecycle, InvalidCourseStateException, role-based authorization, and course endpoints. Lifecycle and permission rules are provisional, pending CL-01 and ACT-02 to ACT-04. Authentication is a development stub pending CC-01. Lint and type checks are not yet run.

Backend sprint 2 (Task 2): UNPUBLISHED lifecycle state, course updates, modules and lessons, and enrollment, with 91 passing pytest tests in total. Tests were written first and failed at collection before implementation. The Harness implementer agent was invoked for the implementation and was blocked by the project-directory write protection, so it produced no code. The implementation was written directly in the main session. It is not agent-generated. Lifecycle, permission, content-access, and enrollment rules are provisional, pending CL-01, ACT-02 to ACT-04, ML-01, ML-02, and EN-01 to EN-03. The courses.status check constraint changed, so any existing local database needs recreating.

Backend sprint 3 (Task 2): quizzes (MCQ and True/False), deterministic grading with integer percent scores, append-only quiz attempts with timestamps and a best-score read, idempotent lesson completion, integer course progress, and instructor aggregate progress summaries, with 169 passing pytest tests in total. Tests were written first and failed at collection before implementation. Attempts are immutable: the repository has no update or delete method, and database triggers reject both. The answer key is stored server-side and is read only by the grading path. The Harness implementer agent was not retried: a read-only check of the sensor ledger corroborated the earlier block (five blocked write-scope entries) and found no change in its cause, so the sprint was implemented directly in the main session. It is not agent-generated. All quiz, attempt, completion, and progress rules are provisional, pending QZ-01 to QZ-04, PR-01, PR-02, and RP-01. No pass threshold or certificate rule exists.

Frontend sprint 4 (Task 2): React, TypeScript, and Vite client under frontend/, written test-first against the 22 real backend routes. It covers the learner catalog, course details, enrollment, module and lesson navigation, lesson completion, quiz taking with results and best score, and course progress, plus the instructor course list and creation, editing, publish and unpublish, module and lesson creation, quiz authoring, and progress reporting. The backend URL comes from VITE_API_BASE_URL. The toolchain is not installed, so the Vitest suite, the TypeScript type check, and the build have not been run. The Harness layer rule, import resolution, and execution of the pure TypeScript modules were checked. The backend API lacks routes to list a lesson's quizzes, list an instructor's own courses, return the current user, and create users. The client works around the first three and flags all four. Backend regression: 169 passing tests.

## Branch and repository state

The active branch is feature/learnlab-foundation. It has no upstream configured. The capstone/learnlab branch tracks origin/main. Merge Request targets are an assumption to confirm, as listed below.

## Harness readiness

This section records what has been observed and what has not. It does not claim full Harness enforcement or certification. The Harness certification status file reports the Harness as partially proven.

Verified (observed executing): the SessionStart check (hooks/check-git-hooks.js), the PreToolUse Bash gate (hooks/pre-bash-gate.js), and the PreToolUse write gate (hooks/pre-write-gate.js). The write gate blocked edits to protected harness files and to the prompt-cache prefix file CLAUDE.md. Hook path resolution works for project-relative paths in this session.

Unverified (registered, not observed executing): PostToolUse hooks (verify-on-save.js, record-run.js, red-phase-record.js), Stop hooks (review-on-stop.js, auto-continue-on-stop.js), and SubagentStop hooks (concurrency-gate.js, record-run.js). Ledger evidence is also absent: state/record-run.jsonl does not exist.

Inactive: Git commit-time hooks. core.hooksPath is unset, and no harness hooks are active in the shared repository. The commit-time gates (coverage ratchet, sprint contract, security verdict, refactor purity) do not run.

Observed gap: Bash-side indirect writes. A tar extraction into .claude/ was not blocked by the Bash gate, because the write detection is pattern-based. Agents with Bash access can write harness machinery. This gap is not closed.

Unverified: Windows path handling across Git Bash and PowerShell forms; permission precedence (ask over allow); deny behavior (no deny rules exist); whether verify-on-save blocks or only reports violations; and the effect of CLAUDE_AUTO_CONTINUE during a Stop event. The extension host environment is not directly observable. CLAUDE_PROJECT_DIR is unset in the Bash tool environment, and its value for hook processes was not observed directly.

### Proposed worktree-safe commit check (not run)

Why not a persisted setting: `git config core.hooksPath` writes to the shared repository configuration. This worktree shares that configuration with the main checkout of ishani-welagedara, so a persisted setting would change the main checkout too. The SessionStart warning suggests exactly that command, and it should not be used here.

Verified read-only: a per-invocation override, `git -c core.hooksPath=.claude/git-hooks`, applies to that command only. The persisted setting stayed unset. `git -c core.hooksPath=.claude/git-hooks hook list --show-scope pre-commit` resolved the hook from the hook directory without executing it. Git 2.55.0 provides `git hook run`.

Not verified: that `git hook run pre-commit` executes the harness gate successfully in this worktree; that the commit-msg hook behaves the same way under the override; that the gate scripts write state files during a run, which would be a side effect; that the hook executable bit works under Git for Windows; and that a relative hooks path resolves from the worktree root in every invocation.

Proposed procedure, to run only after human approval:

1. Confirm the worktree, branch feature/learnlab-foundation, and the staged file set.
2. Run the gate without committing: `git -c core.hooksPath=.claude/git-hooks hook run pre-commit`. Review the gate's side effects before the first run.
3. Commit only with the override in place: `git -c core.hooksPath=.claude/git-hooks commit -m "<message>"`. A local commit still requires human approval under CLAUDE.md.
4. Never run `git config core.hooksPath` in this worktree.

This procedure is documentation only. It has not been executed, and this report does not claim that the gates pass.

### Security decisions requiring human approval

1. Approve the per-invocation commit check, and confirm no persisted core.hooksPath is set.
2. Approve permission changes in .claude/settings.json. Remove or narrow the prefix allow rules that execute project code (npm test, npm run, npx, pytest, uv run pytest) and the unrestricted curl prefix. Add deny rules for destructive commands and for reading .env files.
3. Approve extending harness protection to project-manifest.json, specs/spec.md, specs/model-contracts.md, specs/design/constitution.md, .gitleaks.toml, and init.sh. Until then, agents can edit the architecture gate configuration.
4. Decide whether to accept the Bash-side write gap, or to restrict Bash for agents that have write tools.
5. Confirm that CLAUDE_AUTO_CONTINUE remains unset in the user environment for all future sessions.
6. Confirm the Harness project type (B, Internal tool) for LearnLab, which is learner-facing.

### Task 1A closure status

Recommended status: Completed with documented limitations. The integration is installed and documented, and the limitations are recorded above. The review's critical corrections are partly applied. The remaining manual edits to CLAUDE.md should be applied before closure: the Harness section still says the six-layer architecture is "approved", and the enforcement wording in its item 3 must match this document.

Task 2 is not unblocked. The review items that must be corrected before Task 2 remain open: the protection of project-manifest.json and the specification files, and the prefix allow rules that execute project code. Commit-time gate activation also remains undecided.

## Assumptions to confirm before Increment 1

1. The target branch for Merge Requests is capstone/learnlab. Confirm before any push.
2. The actor roles (Learner, Instructor, Administrator) are correct for the capstone. Permissions are pending confirmation (specs/spec.md, ACT-01 to ACT-04).
3. The technology stack matches the authoritative capstone requirements.
4. Authentication is deferred to a later increment (CC-01).
5. The project type recorded for the Harness is B (Internal tool). The Harness plugin labels type A as Consumer-facing, and LearnLab is learner-facing. Confirm the type.
6. Dependency lock files (uv.lock, package-lock.json) are committed once backend and frontend dependencies are approved.

## Proposed roadmap

Increment 0: Architecture review of the Task 1 and Task 1A artifacts. Gate for everything below.

Increment 1: Backend skeleton. FastAPI application with a health endpoint, pytest configured, one test that exercises the health endpoint, and the layered package structure in docs/architecture.md. No database yet. Requires explicit approval before any dependency is installed.

Increment 2: Frontend skeleton. React, TypeScript, and Vite project with Vitest configured and one passing component test. No feature screens.

Increment 3: Persistence foundation. SQLite connection management, a migration approach decided in review, and repository tests against a temporary database.

Increment 4: Course management (FR-01). Depends on the lifecycle and publication rules (CL-01 to CL-03, CP-01) and the instructor permissions (ACT-03).

Increment 5: Course catalog and discovery (FR-02). Listing and search, with tests. Depends on CP-01.

Increment 6: Enrollment (FR-03). Depends on EN-01 to EN-03.

Increment 7: Lessons and learning content (FR-04). Depends on ML-01 and ML-02.

Increment 8: Quizzes and assessments (FR-05). Depends on QZ-01 to QZ-04.

Increment 9: Learning progress tracking (FR-06). Depends on PR-01 and PR-02.

Increment 10: Basic administration and instructor reporting (FR-07, RP-01, AO-01). Depends on ACT-04, RP-01, and AO-01.

Increment 11: Authentication and authorization (CC-01, AZ-01). Requires its own specification and architecture review.

Increment 12: Architecture validation. Extends the Harness layer gate with third-party import rules (for example, SQL libraries outside Repository), a dependency report, and activation of the pre-commit check. The Harness layer gate already exists and is reused. This increment adds the controls that the gate does not cover, and it requires a human decision on `core.hooksPath` activation.

Increment 13: Playwright end-to-end tests for critical journeys.

Increment 14: GitLab CI pipeline running all test suites and architecture checks. The bundled Harness CI workflows target GitHub and are not adopted.

Increment 15: Harness and agent assets. Project-specific agents, skills, hooks, and commands under .claude/, each reviewed before use. Playwright MCP integration and Agent SDK usage are scoped here after verification against the rubric. Harness permission and protection gaps are corrected before this increment.

Increment 16: Evidence collection. Merge Request history, review records, and agent-generated implementation evidence, mapped to the capstone rubric.

## Per-increment definition of done

1. The specification entry is referenced and its acceptance criteria are accepted.
2. Tests were written first and the output of the passing run is recorded.
3. The change is on a feature branch and submitted as a Merge Request.
4. A human has reviewed and approved the Merge Request.
5. This document is updated with the status.
