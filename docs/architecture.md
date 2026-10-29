# Architecture

Status: Proposed. Pending architecture review and approval. No application code is implemented. The layer model below is the proposed design, not an approved one.

## Architecture principles

1. Specification-driven development. Specs in specs/ define behavior before code is written.
2. Separation of engineering-time and runtime. Claude Code assets under .claude/ support development and are not part of the LMS runtime.
3. Deterministic validation. Business rules live in deterministic code and are covered by deterministic tests.
4. Controlled AI-assisted development. Agents work within CLAUDE.md and AGENTS.md on feature branches with human review.
5. Explicit trust boundaries. The browser and any external input are untrusted. The API is intended to be the enforcement point.
6. Test-driven development with layered test suites (pytest, Vitest, Playwright).
7. Human-in-the-loop verification at each Merge Request and checkpoint.
8. Small implementation increments, each reviewed before the next begins.

## Layer model

The proposed architecture uses six layers, ordered from lowest to highest:

Types, Config, Repository, Service, API, UI

Each layer may import from the layers below it and never from a layer above it. The Harness architecture gate in hooks/lib/layers.js implements this order, configured by the architecture block in project-manifest.json.

The table gives the responsibility of each layer in the backend and in the frontend.

| Layer | Backend (backend/src) | Frontend (frontend/src) | May import from |
|---|---|---|---|
| Types | Domain models, enums, shared type definitions | Shared type definitions that mirror the API contract | Nothing in the project |
| Config | Environment settings, constants, application configuration | Build and runtime configuration, API base URL | Types |
| Repository | SQLite access, SQL, repository interfaces and implementations | Not used | Types, Config |
| Service | Business rules and use cases (enrollment, quiz scoring, progress) | Not used. Business logic stays in the backend | Types, Config, Repository |
| API | FastAPI routers, request and response schemas, error mapping, dependency wiring | Typed HTTP client that calls the backend. Corresponds to the frontend api/ folder | Types, Config, Repository, Service (backend). Types, Config (frontend) |
| UI | Not used | React components, pages, and client state | Types, Config, API (frontend) |

Directions the rule forbids include Service importing from API, Repository importing from Service, Config importing from Repository, and Types importing from any other layer.

Request and response schemas for the HTTP API live in the backend API layer. The frontend mirrors them in the Types layer as shared types. Where a shared contract module is needed to avoid drift between the two, its location is an open question below.

## Mapping to the runtime

The layer names apply separately to each root, because the Harness matches layers by path segment under each configured root.

Backend root: backend/src. Layers Types, Config, Repository, Service, and API live under backend/src/<layer>/. The Python package is named src, so cross-layer imports take the form `from src.<layer> import ...`. The gate matches this form only. The package name must be src for the check to apply.

Frontend root: frontend/src. Layers Types, Config, API, and UI live under frontend/src/<layer>/. The frontend has no Service layer.

The backend and frontend roots are separate, so a file under one root is never checked against the layers of the other.

## Engineering-time view

Claude Code and the Claude Harness Engine live under .claude/, plus the engineering documents at the repository root. They produce and verify code but are never imported by the application. Their configuration is versioned in Git so that agent behavior is reviewable. The layer gate does not inspect .claude/, because it lies outside the configured roots.

## Enforcement status

Each control below carries one of four labels: Intent, Verified, Planned, or Not verified. A control labeled Intent has no automated enforcement.

Intent. Only the Repository layer issues SQL. This is an architectural intent. No control in the repository enforces it.

Intent. The API validates all input and enforces authorization server-side. No endpoint exists, so no enforcement exists.

Intent. Architecture reviews and Merge Request reviews check the layering. These are human processes.

Verified. The layer order is implemented in hooks/lib/layers.js and configured in project-manifest.json. The layer function was checked in isolation on six sample import cases in the Task 1A integration. Results matched the rule.

Verified. The save-time hook verify-on-save.js calls the layer check on saved files (hooks/verify-on-save.js lines 17 and 65). Whether that hook blocks a violation or only reports it has not been verified.

Verified. The layer check recognizes only two import forms. Python: `from src.<layer>` or `import src.<layer>`. JavaScript and TypeScript: relative paths and paths beginning with `src/` or `@/`. It does not inspect bare package imports, dynamic imports, or string-built paths.

Not verified. The pre-commit gate re-checks staged files. This is not in effect. The Git hooks in .claude/git-hooks are inactive because `core.hooksPath` is not set, and no control has yet been activated. Activation requires a human decision and is not part of the current configuration.

Not enforced. A database-access boundary. Nothing prevents a Service or API module from importing sqlite3 or executing SQL. The Harness check does not inspect bare imports.

Not enforced. The layer configuration is not protected from agent edits. The architecture block in project-manifest.json can be changed, including setting `enabled` to false, which disables the layer gate. The Harness machinery list does not cover this file. Protection is a planned correction.

Planned (Increment 12 in docs/implementation-plan.md). Automated architecture validation that also rejects third-party imports in layers that must not use them (for example SQL libraries outside Repository). Activation of the pre-commit gate, which requires a human-approved `core.hooksPath` decision. Protection of project-manifest.json and the specification files through permission deny rules and Harness machinery.

## Harness hook execution status

The status below comes from observation during Task 1A verification. A script existing on disk does not establish that a hook runs.

Observed executing in the active session:

1. SessionStart (hooks/check-git-hooks.js). It ran at session resume and produced its warning that the harness Git hooks are not installed.
2. PreToolUse for Bash (hooks/pre-bash-gate.js). It blocked a Bash command that contained a sensitive action term. This confirms invocation for Bash calls, and it does not show the outcome for other commands.
3. PreToolUse for Write and Edit (hooks/pre-write-gate.js). It blocked edits to a protected harness file and to CLAUDE.md, which is a prompt-cache prefix file. Its block messages used project-relative paths, which indicates that hook path resolution works in this session.

Not observed executing. These hooks are registered in .claude/settings.json, but no execution has been observed:

1. PostToolUse: verify-on-save.js (layer check), record-run.js, and red-phase-record.js.
2. Stop: review-on-stop.js, auto-continue-on-stop.js, and record-run.js.
3. SubagentStop and UserPromptSubmit: concurrency-gate.js, record-run.js, and artifact-guard.js.
4. PreToolUse for Task and Agent: dispatch-gate.js and concurrency-gate.js. PreToolUse for Write and Edit: context-ceiling.js and agent-write-scope.js.

No ledger evidence is available for these hooks. The file state/record-run.jsonl is absent, and state/hook-errors.log is absent. Absence of an error log does not establish that a hook ran.

Git commit-time hooks are inactive. core.hooksPath is unset, the shared repository has no active hooks, and the SessionStart check reports the gates as absent. Enforcement of the Git commit-time gates is therefore not in effect.

Environment. CLAUDE_AUTO_CONTINUE is unset in the Bash tool environment. It was 1 in an earlier check, so the change occurred outside the agent. CLAUDE_PROJECT_DIR is unset in the Bash tool environment. The hook commands depend on it, and hook execution indicates the runtime supplies it to hook processes, but its value was not observed directly. The VS Code extension host environment is not directly observable.

Bash-side write protection has a demonstrated gap. A tar extraction that wrote into .claude/ was not blocked by the Bash gate. Bash write detection is pattern-based, so a Bash-capable agent can write harness machinery without the gate blocking it.

Not verified: Windows path handling across Git Bash and PowerShell forms, permission precedence of ask rules over allow rules, deny behavior (no deny rules exist), whether verify-on-save blocks or only reports, and the effect of auto-continue during a real Stop event.

## Trust boundaries

1. Browser to API. All input is untrusted. Intended behavior: the API validates every request against a schema and enforces authorization server-side. Status: Intent.
2. API to persistence. Intended behavior: only the Repository layer issues SQL, using parameter binding. Status: Intent. See Enforcement status.
3. Repository to engineering tools. Intended behavior: agents have no access to production data, and tests use temporary databases. Status: Intent.
4. Runtime to external services. None are defined. Any external call requires an approved specification. Status: Intent.

## Testing architecture

| Layer or concern | Tool | Scope | Status |
|---|---|---|---|
| Types, Config, Service | pytest | Business rules and use cases, no HTTP | Planned |
| API | pytest with the FastAPI test client | Contracts, validation, errors | Planned |
| Repository | pytest with temporary SQLite | Persistence behavior | Planned |
| Frontend API and UI | Vitest | Components and client logic | Planned |
| End-to-end | Playwright | Critical user journeys | Planned |
| Architecture | Harness layer gate (save time), then automated validation | Layer rules | Gate Verified in isolation. Automated validation Planned |
| AI evaluation | evals/ (not required) | Only if a runtime model is approved | Not applicable |

## Decisions

ADR-001: SQLite as the persistence store. Reason: simplicity and a single-file deployment suit the stated scope. Revisit if volume or concurrency requirements exceed SQLite's suitability.

ADR-002: No runtime LLM integration. Reason: the preliminary business context does not require one. See specs/model-contracts.md.

ADR-003: Six-layer architecture (Types, Config, Repository, Service, API, UI), matching the Harness layer order. Status: proposed, pending architecture review. Reason: it keeps domain logic free of HTTP and SQL and supports testability and modularity. The enforcement status of each rule is stated above.

ADR-004: Feature branches and Merge Requests for all changes. Reason: human-in-the-loop verification and reviewable agent output.

ADR-005: Separate deterministic tests from AI evaluations. Reason: keeps the gating test suite reproducible.

ADR-006: Harness core profile, integrated selectively. Reason: the core profile supplies the SDLC pipeline, verification, and TDD disciplines without the compliance, domain-vertical, and framework packs that LearnLab does not use. The generated CLAUDE.md, README.md, and GitHub workflows are not adopted.

ADR-007: The Harness auto-continue watchdog is intended to stay disabled by default. Reason: auto-continue would carry the agent past architecture checkpoints, which require human review. Status: Partially verified. The variable was 1 in an earlier check and is unset in the latest Bash tool environment. The Stop-event behavior when enabled has not been observed. The extension host environment is not directly observable.

## Open architecture questions

1. Authentication mechanism and session model (deferred; requires its own specification, CC-01 and AZ-01).
2. Whether frontend and backend are deployed together or separately.
3. Migration tooling for SQLite schema changes (for example Alembic). Not yet decided.
4. The configured `quality.mutation.config_file` points at a root pyproject.toml, which does not exist. It should point at backend/pyproject.toml when backend setup is approved.
5. Location of the shared contract types that the backend API schemas and the frontend Types layer both mirror. Not yet decided.
6. Whether the frontend should have a Service layer. It is not used in the proposed design. Confirm.
