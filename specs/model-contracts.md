# Model Contracts

Status: Decision recorded. No runtime model contract is defined.

## Decision

LearnLab does not require runtime LLM functionality. The preliminary business requirements describe a deterministic learning management system: course management, catalog, enrollment, lessons, quizzes, progress tracking, and administration. None of these requires a language model at runtime. No runtime model contract is therefore defined.

This decision follows the architecture principle of deterministic validation and ADR-002 in docs/architecture.md.

## Engineering-time AI use

Claude Code and the Claude Harness Engine are used during development. They are governed by CLAUDE.md and AGENTS.md, not by this document. Engineering-time AI use does not create a runtime dependency.

## Reopening this decision

A runtime model contract may be added only if the authoritative capstone requirements call for one. The change must follow the development workflow, update this document, and receive architecture review approval before implementation.

When that happens, the contract must specify at least the following. Fields are placeholders until a real use case is approved.

1. Purpose: the business function the model performs and the decision boundary (what the model may and may not decide)
2. Input contract: the fields sent to the model, their types, and the data classification
3. Output contract: the schema the model must return, validated deterministically before use
4. Failure modes: timeouts, refusals, malformed output, and empty output
5. Deterministic fallback: the behavior when the model is unavailable or its output fails validation
6. Data handling: what leaves the system, retention at the provider, and the approval for any student data
7. Evaluation: the eval cases in evals/ that gate the contract, with pass thresholds set by the reviewers
8. Ownership: the human who approves changes to the contract

## Current contract inventory

None.
