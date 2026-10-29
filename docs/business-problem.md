# Business Problem

Status: Preliminary context. Not authoritative. Acceptance criteria are defined only in the authoritative capstone brief (not in this repository) and in specs/spec.md once approved.

## Problem statement

Learning providers need a simple, dependable way to publish courses, enroll learners, deliver lessons and assessments, and track progress. LearnLab provides a lightweight Learning Management System for these needs. It should be simple to operate, modular enough to extend, and testable from the start.

## Capability areas

1. Course creation and management
2. Course catalog and discovery
3. Learner enrollment
4. Lessons and learning content
5. Quizzes and assessments
6. Learning progress tracking
7. Basic administration

These capability areas are confirmed as preliminary context. The detailed rules beneath each area are pending confirmation and are tracked as requirement IDs in specs/spec.md.

## Actors (assumed, pending confirmation)

1. Learner: browses the catalog, enrolls in courses, consumes lessons, takes quizzes, and views their own progress.
2. Instructor: creates and maintains courses, lessons, and quizzes, and reviews learner reports.
3. Administrator: manages users and basic system configuration, and oversees system-level course information.

The actor list is an assumption. The authoritative capstone brief may define different roles, permissions, or role combinations. The permission rules are pending confirmation in specs/spec.md (ACT-01 to ACT-04).

## Business areas pending confirmation

The following areas are required for a complete business case but are not defined in the preliminary context. Each is tracked in specs/spec.md:

1. Course lifecycle and publication (CL-01 to CL-03, CP-01)
2. Enrollment uniqueness, withdrawal, and capacity (EN-01 to EN-03)
3. Modules and lessons (ML-01, ML-02)
4. Deterministic multiple-choice and True/False grading, multiple attempts, and best-score retention (QZ-01 to QZ-04)
5. Lesson completion and integer progress (PR-01, PR-02)
6. Instructor reporting (RP-01)
7. Administrator oversight (AO-01)
8. Append-only history (HX-01)
9. Authorization boundaries (AZ-01)

## Out of scope for now

1. Runtime AI features (none are required by the current preliminary context)
2. Payments, certificates, and external integrations (not mentioned in preliminary context; confirm)
3. Production hosting and scaling requirements (not yet defined)

## Open questions

1. Which actor roles and permissions does the capstone require (ACT-01 to ACT-04)?
2. Is authentication required in the first release, and with which mechanism (CC-01, AZ-01)?
3. What is the expected data volume for a single SQLite deployment?
4. Which quiz grading rules, attempt limits, and progress definitions does the capstone specify (QZ-01 to QZ-04, PR-01, PR-02)?
5. Which of the capability areas are mandatory for the capstone submission?
