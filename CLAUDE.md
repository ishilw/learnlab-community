# CLAUDE.md

Engineering instructions for Claude Code and human contributors on LearnLab (BC-AINE-011). AGENTS.md gives the agent-facing summary. If the two ever differ, this file is authoritative.

## Project status

LearnLab is a lightweight Learning Management System. Task 1 created the project foundation. Task 1A integrated the Claude Harness Engine core profile and applied the architecture review corrections. No application code exists yet. Do not implement application features until the architecture review is approved and the relevant specification is accepted.

## Source of truth

When sources conflict, resolve in this order:

1. Authoritative capstone requirements (external to this repository; not yet in the repo)
2. specs/spec.md and specs/model-contracts.md
3. docs/architecture.md
4. CLAUDE.md and AGENTS.md
5. docs/implementation-plan.md
6. docs/business-problem.md (preliminary context only)

Flag any conflict to the user. Do not resolve it silently.

## Repository structure

| Path | Purpose | Layer |
|---|---|---|
| CLAUDE.md | Engineering instructions (this file) | Engineering-time |
| AGENTS.md | Agent-facing guidance, compatible with this file | Engineering-time |
| README.md | Project entry point and documentation index | Shared |
| docs/business-problem.md | Business context and actors | Business |
| docs/architecture.md | Architecture principles, components, trust boundaries, decisions | Architecture |
| docs/implementation-plan.md | Incremental roadmap and status | Engineering-time |
| specs/spec.md | System functional and non-functional specification | Specification |
| specs/model-contracts.md | Runtime model contract decision (none required today) | Specification |
| tests/ | Deterministic automated tests (pytest, Vitest, Playwright) | Verification |
| evals/ | AI evaluations, kept separate from deterministic tests | Verification |
| .claude/ | Claude Harness Engine core profile (installed) and project-specific assets (not yet authored) | Engineering-time |

Application code (planned): backend/ for the FastAPI service and frontend/ for the React + TypeScript + Vite client. Neither directory exists yet. Do not create them before the implementation step that needs them is approved.

## Engineering principles

1. Specification-driven. Behavior comes from specs/spec.md. Each change references the spec items it implements. Where acceptance criteria are still TBD, record the gap instead of inventing criteria.
2. Engineering-time and runtime are separate. Claude Code, agents, skills, hooks, and commands support development. They are not part of the LMS runtime and must not be imported by application code.
3. Deterministic validation. Business rules are enforced by deterministic code and covered by deterministic tests. Model output is never the authority for a business decision.
4. Test-driven development. Write a failing test first, then the minimum code to pass it, then refactor.
5. Small increments. Keep each change small enough to review in one Merge Request.
6. Modular design. Domain logic does not depend on HTTP, the database, or the UI. Keep the backend layered and the frontend component boundaries explicit.
7. Human-in-the-loop. A human reviews and approves each Merge Request. Agent-generated code receives the same review as human-written code.
8. Architecture review before checkpoints. Stop at each checkpoint and wait for review.
9. No runtime LLM functionality unless specs/model-contracts.md is updated and approved.

## Development workflow

1. Read the relevant specification entry and the current step in docs/implementation-plan.md.
2. Create a feature branch from the integration branch recorded in docs/implementation-plan.md. Use the name feature/<short-slug>.
3. Write or update tests first. Confirm they fail for the expected reason.
4. Implement the smallest change that makes the tests pass. Refactor with tests green.
5. Run the full local test suite for the affected layers.
6. Commit in small logical commits. Use an imperative subject and reference the spec ID where one applies.
7. Push the feature branch and open a Merge Request into capstone/learnlab.
8. A human reviews and approves the Merge Request. Do not merge without that approval.
9. Update docs/implementation-plan.md to reflect the completed step.

Direct commits to main or capstone/learnlab are not permitted. All changes arrive through a feature branch and a Merge Request. The target branch for Merge Requests is an assumption to confirm (see docs/implementation-plan.md).

## Testing expectations

1. Every business rule has a deterministic automated test.
2. Backend tests use pytest. Frontend unit and component tests use Vitest. End-to-end browser tests use Playwright.
3. Tests must not call external services or require network access. Use a temporary SQLite database for backend tests.
4. Every bug fix includes a regression test.
5. Do not delete, skip, or weaken a test to make a build pass. If a test is wrong, explain the change in the Merge Request.
6. AI evaluations live in evals/. They do not gate deterministic unit tests. None are required while no runtime model exists.
7. A change is not complete until its tests pass and the results are reported with the actual output.

## Security boundaries

1. The browser is untrusted. The API validates all input and enforces all authorization. Client-side checks are for usability only.
2. The database is reachable only through the backend persistence layer.
3. No secrets in the repository. Use environment variables. Ignore .env files in Git.
4. Authentication and authorization are out of scope for Task 1. Each requires a specification and an architecture review before implementation.
5. Do not send student or course data to any external AI service. Do not add runtime LLM calls.
6. Do not install dependencies, configure CI/CD, or create application directories before the step that requires them is approved.
7. Do not modify unrelated training project files.
8. Agents do not run destructive Git operations (force push, hard reset, branch deletion on shared branches). Agents do not push, open Merge Requests, or perform other outward-facing actions without explicit human approval.

## Scope discipline

1. Work only on the task that was requested. Do not start the next task.
2. When the work is blocked or unclear, report the blocker and continue with the independent parts.
3. Report outcomes faithfully. Show failing test output as it is. Do not describe unverified work as verified.

## Future capstone capabilities

Claude Harness Engine integration (core profile installed; enforcement and sprint evidence not verified)

1. Claude Harness Engine integration
2. Custom Claude Code agents (.claude/agents/)
3. Custom skills (.claude/skills/)
4. Custom hooks (.claude/settings.json)
5. Custom commands (.claude/commands/)
6. Agent SDK usage
7. Playwright MCP integration
8. Automated tests across backend, frontend, and browser layers
9. Architecture validation (automated checks of layering and dependency rules)
10. GitLab CI pipeline
11. Merge Request-driven development with recorded reviews
12. Evidence of agent-generated implementation

## Claude Harness Engine Integration

This project uses Claude Harness Engine v6 (installed plugin version 3.0.0) as its AI-native engineering foundation.

1. Authoritative project instructions: The root `CLAUDE.md` is the primary source of project engineering guidance. Harness-generated instructions must not silently override it.

2. Specification ownership: `specs/spec.md` is the authoritative application specification. Its status is Draft until approved. `specs/model-contracts.md` governs model contracts where applicable. Harness `/brd` and `/spec` workflows may propose updates but must not replace approved specifications without review.

3. Architecture: `docs/architecture.md` and `project-manifest.json` must remain aligned. The proposed six-layer architecture in docs/architecture.md is pending approval. Its enforcement status is stated there.

4. Harness protection: Changes to `.claude/settings.json`, security gates, permissions and other protected engineering controls require explicit human approval.

5. Human checkpoints: Automatic continuation must remain disabled by default. Implementation, architecture review, verification and checkpoint are separate stages. Do not commit, push or merge without explicit approval.

6. Dependency installation: Do not run `init.sh`, install dependencies, execute deployments or perform destructive Git operations without explicit approval.

7. Capstone evidence: Harness-provided agents, skills, hooks and commands must be distinguished from LearnLab-specific customizations. Record actual execution and verification evidence rather than assuming that installed components have been exercised.