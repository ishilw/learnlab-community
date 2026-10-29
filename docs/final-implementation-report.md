# LearnLab — Final Implementation and Verification Report

**Project:** LearnLab — Learning Management System  
**Organization:** Virtusa  
**Programme:** AI-Native Engineering Capstone  
**Report date:** 28 October 2026  
**Integration branch:** `capstone/learnlab`  
**Status:** Core application implemented and regression-tested; production hardening remains outstanding.

## 1. Executive Summary

LearnLab is a web-based Learning Management System (LMS) developed as part of the Virtusa AI-Native Engineering capstone.

The application enables instructors to create and manage learning content, publish courses, author assessments, and monitor learner progress. Learners can browse published courses, enroll, complete lessons, take quizzes, and track their learning progress.

The solution uses a Python FastAPI backend, SQLite persistence, and a React and TypeScript frontend.

Development was supported by Claude Code and Claude Harness Engine v6, incorporating engineering-time agents, skills, lifecycle hooks, Git quality controls, and runtime evidence recording. The Harness is separate from the application's runtime and is not presented as a learner-facing AI feature.

The project has completed six GitLab merge requests into `capstone/learnlab`. Final regression testing confirmed:

- **184 backend tests passed.**
- **192 frontend tests passed across 40 test files.**
- **TypeScript validation passed.**
- **Vite production build succeeded.**
- **The core instructor-to-learner workflow was manually verified.**

The application is suitable for demonstrating the implemented capstone scope. It is not production-ready because development-only authentication, dependency security findings, missing automated browser end-to-end tests, and the absence of a GitLab CI/CD pipeline remain outstanding.


## 2. System Architecture

### 2.1 Technology Stack

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | User interface and API communication |
| Backend | Python, FastAPI, Pydantic | REST API, validation, and business logic |
| Database | SQLite | Persistent storage for application data |
| Backend testing | pytest | API, service, and repository verification |
| Frontend testing | Vitest | Component and client-side verification |
| Engineering-time AI | Claude Code, Claude Harness Engine v6 | AI-assisted development and engineering controls |
| Version control | Git and GitLab | Feature branches, merge requests, and integration |

### 2.2 Layered Architecture

LearnLab follows a six-layer architectural model:

**Types → Config → Repository → Service → API → UI**

The layers have the following responsibilities:

1. **Types:** Domain models, enumerations, and shared type definitions.
2. **Config:** Application configuration and environment settings.
3. **Repository:** SQLite persistence and database operations.
4. **Service:** Business rules, authorization decisions, enrollment, grading, and progress calculation.
5. **API:** FastAPI endpoints and the frontend's typed HTTP client.
6. **UI:** React pages, components, and client-side state.

The backend implements the Types, Config, Repository, Service, and API layers. The frontend implements Types, Config, API, and UI.

The intended dependency direction is from higher layers toward lower layers. The Harness includes an architecture-checking mechanism, but complete enforcement of all architectural boundaries has not been demonstrated.

### 2.3 Application Runtime

The browser communicates with the FastAPI backend through HTTP requests. The backend applies validation and business rules and uses repository components to access SQLite.

Course management, enrollment, lesson completion, quiz grading, and progress calculations are implemented in deterministic application code.

The application does not require a runtime large language model. Claude Code and the Harness are used during software engineering rather than during learner interactions.

### 2.4 Authentication and Trust Boundaries

The current application uses a development-only `X-User-Id` header to identify users.

The backend performs role-based authorization checks for supported operations, but the identity mechanism does not provide production-grade authentication. The frontend's role selection is a development convenience and must not be treated as an authentication control.

Before public deployment, this mechanism must be replaced with a secure authentication and session-management solution.

## 3. Implemented Application Features

### 3.1 Instructor Functionality

The LearnLab application supports the following instructor operations:

- Create courses with titles and descriptions.
- Edit course information.
- Publish and unpublish courses.
- Create modules within courses.
- Create lessons containing learning material.
- Create lesson-based quizzes.
- Author multiple-choice and True/False questions.
- Configure correct answers for quiz grading.
- View learner enrollment and course completion progress.
- Review aggregate learner progress information.

These features were implemented through the FastAPI backend and React frontend.

### 3.2 Learner Functionality

Learners can:

- Browse the catalog of published courses.
- View course details.
- Enroll in available courses.
- Navigate course modules and lessons.
- Mark lessons as completed.
- Track course completion percentages.
- Take quizzes and submit answers.
- View quiz scores and previous attempt information.

### 3.3 Quiz and Assessment Processing

Quiz grading is performed by deterministic backend logic.

The implementation supports multiple-choice and True/False questions, calculates percentage scores, and stores quiz attempts.

The backend maintains the answer key separately from the learner-facing quiz response.

Quiz attempt records are designed to be append-only, with database-level protections against modification or deletion.

### 3.4 Progress Tracking and Reporting

LearnLab records lesson completion and calculates learner progress based on completed lessons.

Instructors can review enrollment counts, individual learner progress, and aggregate course progress.

### 3.5 Persistence Verification

SQLite stores application data, including courses, learning content, enrollments, quiz attempts, and lesson completions.

During manual testing, previously created course content, quiz links, and learner progress remained available after refreshing the application and signing back in.

### 3.6 Manual End-to-End Verification

The following instructor-to-learner workflow was successfully demonstrated:

1. An instructor created an AWS Cloud Computing course.
2. The instructor added a module, lesson, and quiz.
3. The instructor published the course.
4. A learner discovered and enrolled in the published course.
5. The learner completed the lesson.
6. The learner answered two quiz questions and received a score of 100%.
7. The instructor viewed the learner's completed progress.
8. Data persistence was confirmed after refreshing the application.

This was a manually verified workflow, not an automated browser end-to-end test.

## 4. Claude Harness Engineering and Verification

### 4.1 Engineering-Time AI Integration

LearnLab integrates Claude Code with Claude Harness Engine v6 (plugin version 3.0.0) as an engineering-time development environment.

The Harness provides structured assets for AI-assisted development, including agents, skills, lifecycle hooks, security checks, and execution records.

These components operate during software engineering and are separate from the LearnLab application runtime.

### 4.2 Agents and Skills

The repository contains eight configured agent definitions:

- Advisor
- Planner
- Implementer
- Generator
- Evaluator
- Code Reviewer
- Design Critic
- Security Reviewer

The Harness session reported 44 available skills.

The presence of these assets was verified through repository inspection. However, the final recorded session did not identify a specific invoked skill or demonstrate successful task execution by each configured agent.

Earlier implementation records also document an implementer-agent attempt that was blocked by write-scope protection. The affected implementation was completed directly in the main development session rather than by that agent.

### 4.3 Lifecycle Hooks

The Harness configuration registers hooks for events including:

- SessionStart
- PreToolUse
- PostToolUse
- UserPromptSubmit
- Stop
- SubagentStop

These hooks support development controls such as command screening, write-scope restrictions, verification after file changes, and execution recording.

### 4.4 Verified Execution Evidence

A Claude Code session produced an execution log at:

`.claude/runs/2026-10-28.jsonl`

The log contains four recorded event types:

1. `prompt` — a user prompt was recorded.
2. `tool` — a Bash tool execution completed successfully.
3. `turn` — a Claude turn completed successfully.
4. `subagent_stop` — a subagent-stop lifecycle event was recorded.

The log reported 44 available skills but did not record a named skill invocation.

A subagent-stop event alone does not establish that a specialized agent successfully completed an implementation task.

### 4.5 Verified Security and Quality Sensors

The Harness sensor ledger recorded execution of nine sensors across session and commit-time operations:

| Sensor | Execution surface | Recorded outcome |
|---|---|---|
| Pre-Bash gate | Session | Executed; not blocked |
| Red-phase recorder | Session | Executed; not blocked |
| Secret scan | Commit | Executed; not blocked |
| Amendment provenance | Commit | Executed; not blocked |
| Test deletion guard | Commit | Executed; not blocked |
| Stub-smell gate | Commit | Executed; not blocked |
| Live externals | Commit | Executed; not blocked |
| Registry-name gate | Commit | Executed; not blocked |
| Test integrity | Commit | Executed; not blocked |

The Git hooks were activated locally through the repository's `core.hooksPath` configuration.

No `.claude/state/hook-errors.log` file was found during final verification. This indicates that no hook crash was recorded in that file, but does not prove comprehensive enforcement.

### 4.6 Demonstrated Security Rejection

The Pre-Bash security gate was tested using a simulated tool invocation containing an attempt to write to `.env`.

The gate rejected the simulated action with exit code `2`.

This demonstrates a specific security enforcement behavior. It does not establish that every possible unsafe command or indirect write is detected.

### 4.7 Known Harness Limitations

The following limitations remain:

- The registry-name gate recognizes staged `package.json` and `requirements*.txt` manifests but does not currently recognize dependencies declared in `backend/pyproject.toml`.
- The registry-name gate's historical dependency baseline checks root-level manifests rather than the nested frontend dependency files.
- Some architecture and write-boundary protections remain incompletely verified.
- Not all registered lifecycle hooks have independent execution evidence.
- The recorded session did not demonstrate successful use of every configured agent or skill.
- Automated Harness certification or complete enforcement coverage has not been established.

These limitations are documented to distinguish implemented engineering controls from fully verified security guarantees.

## 5. Final Testing and Quality Verification

### 5.1 Automated Regression Testing

Final regression testing was performed on 28 October 2026 after the six GitLab merge requests were integrated.

| Verification | Result | Status |
|---|---|---|
| Backend automated tests | 184 passed | Passed |
| Frontend automated tests | 192 passed across 40 files | Passed |
| TypeScript validation | `tsc --noEmit` completed without errors | Passed |
| Frontend production build | Vite build completed successfully | Passed |
| Total automated tests | 376 passed | Passed |

### 5.2 Backend Verification

The backend test suite was executed using:

`PYTHONPATH=backend python -m pytest tests/ -q`

Result:

`184 passed in 43.28s`

The test suite covers backend API behavior, service-level business rules, and repository persistence operations.

The final run used the available local Python environment. Compatibility testing specifically under Python 3.12 has not been confirmed.

### 5.3 Frontend Verification

The frontend test suite was executed using:

`npm test -- --run`

Result:

- 40 test files passed.
- 192 tests passed.
- Execution duration: 28.21 seconds.

TypeScript validation was performed using:

`npm run typecheck`

The command completed without reporting errors.

### 5.4 Production Build Verification

The frontend production build was generated using:

`npm run build`

The build completed successfully using Vite 5.4.21.

The build transformed 69 modules and generated optimized output in `frontend/dist/`.

Successful compilation and bundling do not establish that the application is secure or ready for public deployment.

### 5.5 Manual End-to-End Testing

The complete instructor-to-learner workflow was manually verified in a browser.

The verification included course creation, publishing

## 6. GitLab Integration and Development History

### 6.1 Version Control Strategy

LearnLab uses Git for source control and GitLab for repository hosting and merge request management.

Development was organized into incremental feature branches, with changes integrated into the `capstone/learnlab` branch through merge requests.

This approach supports traceability, incremental delivery, and human review of changes before integration.

### 6.2 Completed Integration Milestones

Six merge requests were successfully merged into `capstone/learnlab`.

| Milestone | Implemented scope |
|---|---|
| 1. Project foundation | Project structure, specifications, architecture documentation, and engineering governance |
| 2. Harness integration | Claude Harness configuration, agents, skills, hooks, and supporting engineering controls |
| 3. Backend implementation | FastAPI endpoints, business logic, SQLite persistence, and backend tests |
| 4. Frontend implementation | React and TypeScript interface, API integration, and frontend tests |
| 5. Quiz persistence improvement | Lesson-based quiz listing and persistent quiz authoring links |
| 6. Harness runtime housekeeping | Git ignore rules for temporary Harness session files |

### 6.3 Final Integration Verification

The latest verified integration commit was:

`746b04a`

The integration branch was fetched from GitLab, and the local feature branch was compared against it.

The command:

`git diff --stat HEAD origin/capstone/learnlab`

produced no differences, confirming identical tracked file contents at that point.

Following integration, the backend and frontend regression suites, TypeScript validation, and frontend production build completed successfully.

### 6.4 Review and Traceability

GitLab merge requests provide a record of implementation increments and integration decisions.

Local Git hooks were configured and executed during the final maintenance commit. Their sensor outcomes were inspected separately.

No GitLab CI pipelines were configured for the verified merge requests. Therefore, automated pipeline approval must not be claimed.

### 6.5 Development Approach

The project followed an incremental, specification-oriented development approach, with architecture documentation, feature implementation, automated testing, manual verification, and GitLab integration.

Claude Code and the Harness supported the engineering workflow. However, implementation provenance must be described accurately: not every feature was generated by a specialized agent, and some implementation work was completed directly after agent execution was blocked by existing safeguards.


## 7. Known Limitations and Remaining Work

### 7.1 Authentication and Security

The current application uses a development-only `X-User-Id` header to identify users.

Although backend role-based authorization checks are implemented, this mechanism is not suitable for public deployment.

Production deployment requires secure authentication, session management, and additional security testing.

### 7.2 Dependency Security

An earlier frontend dependency audit reported six vulnerabilities:

- Three moderate.
- One high.
- Two critical.

The findings affected development tooling, including Vite, Vitest, and related packages.

At the time of that audit, `npm audit --omit=dev` reported zero production dependency vulnerabilities. This audit was not repeated during final regression verification.

Dependency upgrades and a fresh security audit are required before production deployment.

### 7.3 Automated Testing and CI/CD

Backend and frontend automated tests passed successfully.

However, the following remain outstanding:

- Automated browser end-to-end testing with Playwright.
- GitLab CI/CD pipeline configuration.
- Automated test execution on merge requests.
- Production deployment verification.

### 7.4 Harness Verification

Claude Harness agents, skills, hooks, and engineering controls are configured.

Recorded evidence confirms selected lifecycle events, sensor execution, and a simulated security rejection.

However, complete enforcement coverage, successful execution of every configured agent, and actual invocation of individual skills have  not been established.

### 7.5 User Experience Improvements

The core learning workflow is functional, but additional usability improvements would be beneficial.

Potential improvements include clearer quiz navigation for learners, more direct course-content access, and further refinement of instructor workflows.

These are improvement opportunities rather than confirmed defects unless reproduced and documented.

## 8. Local Demonstration Instructions

### 8.1 Start the Backend

From the LearnLab project root, execute:

PYTHONPATH=backend python -m uvicorn src.api.app:create_app --factory --host 127.0.0.1 --port 8000

The backend API documentation is available at:

http://127.0.0.1:8000/docs

### 8.2 Start the Frontend

Open a separate terminal and execute:

cd frontend && npm run dev

The development frontend is available at:

http://localhost:5173/

### 8.3 Demonstration Scope

The local demonstration can cover:

Instructor course creation and publishing.

Module and lesson authoring.

Quiz creation and question authoring.

Learner course discovery and enrollment.

Lesson completion and progress tracking.

Quiz submission and score calculation.

Instructor progress reporting.

Data persistence after refreshing the application.

The demonstration uses development identities and must not be presented as a production authentication implementation.

## 9. Final Capstone Readiness Assessment

### 9.1 Completed Deliverables

The following capstone deliverables have been completed and verified:

Layered LearnLab application architecture.

FastAPI backend with SQLite persistence.

React and TypeScript frontend.

Instructor course and assessment management.

Learner enrollment, lesson completion, and quiz participation.

Progress tracking and instructor reporting.

Claude Harness engineering-time integration.

Six GitLab integration milestones.

Backend and frontend automated regression testing.

Successful TypeScript validation and frontend production build.

Manual instructor-to-learner workflow verification.

### 9.2 Overall Assessment

LearnLab is ready for a local capstone demonstration of its implemented features and verified engineering workflow.

The application has passed 376 automated tests, completed frontend type validation, and produced a successful production build.

Claude Harness engineering controls have been configured, and selected execution and security evidence has been recorded.

This assessment does not imply production readiness, comprehensive security certification, or full verification of every Harness capability.

### 9.3 Recommended Next Steps

Before a production release, prioritize secure authentication, dependency vulnerability remediation, automated browser testing, CI/CD integration, and additional Harness enforcement verification.

For the capstone submission, retain the final implementation report, regression test results, GitLab merge request history, and available Harness evidence as supporting documentation.