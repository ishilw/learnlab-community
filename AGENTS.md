# AGENTS.md

Guidance for AI agents working in this repository. CLAUDE.md is authoritative for all engineering rules. This file summarizes how an agent should orient itself and what to do at the boundaries.

## Orientation

1. Read CLAUDE.md, then the Source of truth section it defines.
2. Read the relevant entry in specs/spec.md before changing behavior.
3. Read docs/implementation-plan.md to find the current step and its status.
4. Read docs/architecture.md before creating or moving any module.

## Working rules

1. Follow the development workflow in CLAUDE.md. Work on a feature branch, never on main or capstone/learnlab.
2. Write the test before the implementation.
3. Keep changes small and limited to the requested step.
4. Do not implement a feature that has no specification entry. Record the gap and ask.
5. Do not start a later task or checkpoint without approval.

## Boundaries

1. Do not add runtime LLM calls or model contracts unless specs/model-contracts.md has been approved for that change.
2. Do not push, open Merge Requests, or perform other outward-facing actions without explicit human approval.
3. Do not run destructive Git operations on shared branches.
4. Do not commit secrets, .env files, or generated dependency directories.
5. Do not modify unrelated training project files.

## Reporting

1. State what changed, which files were touched, and which tests were run.
2. Include the actual test output. If a test fails or was not run, say so.
3. List assumptions and open questions separately from completed work.
4. Stop at architecture-review checkpoints and wait for approval.
