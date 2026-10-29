# System Specification

Status: Draft. Preliminary. Acceptance criteria are TBD for every item until the authoritative LearnLab capstone brief is provided and reviewed. The authoritative brief is not in this repository. Do not implement against this draft without marking the open detail in the Merge Request.

## Scope

This specification describes the functional areas of LearnLab at a high level. It intentionally does not define acceptance criteria, data fields, or validation rules. Each item is a placeholder for a future, approved specification entry.

## Status legend

Confirmed: the capability area is stated in the preliminary business context (docs/business-problem.md, Capability areas, from the Task 1 brief). Confirmed means the area exists. It does not confirm the detail beneath it.

Pending confirmation: the detail is not confirmed against the authoritative capstone brief. A pending item must not be implemented. Record the gap instead of inventing a rule.

Acceptance criteria: TBD for every item in this document.

## Functional requirements

Each entry has an ID for traceability.

FR-01 Course management. Confirmed. Instructors can create, view, update, and archive courses. Acceptance criteria: TBD. Lifecycle states are covered by CL-01 to CL-03.

FR-02 Course catalog and discovery. Confirmed. Learners can browse and search published courses. Acceptance criteria: TBD. Publication is covered by CP-01.

FR-03 Enrollment. Confirmed. Learners can enroll in and withdraw from published courses. Acceptance criteria: TBD. Uniqueness, withdrawal, and capacity are covered by EN-01 to EN-03.

FR-04 Lessons and learning content. Confirmed. Instructors can add and order lessons within a course. Learners can view lessons in an enrolled course. Acceptance criteria: TBD. Module structure is covered by ML-01 and ML-02.

FR-05 Quizzes and assessments. Confirmed. Instructors can create quizzes with questions. Learners can attempt quizzes and receive results. Acceptance criteria: TBD. Grading, attempts, and score retention are covered by QZ-01 to QZ-04.

FR-06 Learning progress tracking. Confirmed. The system records which lessons and quizzes a learner has completed and reports progress per course. Acceptance criteria: TBD. Completion and progress are covered by PR-01 and PR-02.

FR-07 Basic administration. Confirmed. Administrators can manage user accounts and review system-level course information. Acceptance criteria: TBD. Oversight is covered by AO-01.

## Actors and permissions

ACT-01 Actor roles. Pending confirmation. The roles are Learner, Instructor, and Administrator. This list is an assumption from docs/business-problem.md. Questions: Are these the only roles? May one user hold more than one role?

ACT-02 Learner permissions. Pending confirmation. Permissions are not defined. Questions: Which catalog, enrollment, lesson, quiz, and progress actions may a learner perform? May a learner view only their own attempts and progress?

ACT-03 Instructor permissions. Pending confirmation. Permissions are not defined. Questions: May an instructor edit courses created by another instructor? Which learner data may an instructor view?

ACT-04 Administrator permissions. Pending confirmation. Permissions are not defined. Questions: Which courses and user accounts may an administrator change? Which administrator actions must be recorded?

## Course lifecycle and publication

CL-01 Course lifecycle states. Pending confirmation. FR-01 mentions archive, and FR-02 refers to published courses. No states or transitions are defined. Questions: Which states exist, which transitions are allowed, and who may trigger each one?

CL-02 Course creation. Confirmed capability, role pending. Instructors create courses. The owning role is pending ACT-03.

CL-03 Course archive. Pending confirmation. Questions: Does an archived course remain visible to enrolled learners? Does archiving affect existing enrollments or attempts?

CP-01 Course publication. Pending confirmation. FR-02 limits catalog visibility to published courses. Questions: What action publishes a course, who may publish, and may a published course be unpublished?

## Enrollment

EN-01 Enrollment uniqueness. Pending confirmation. The area is required, but the rule is not defined. Question: may a learner hold more than one enrollment in the same course at one time?

EN-02 Withdrawal and re-enrollment. Pending confirmation. Questions: May a withdrawn learner enroll again? Are the learner's earlier attempts and progress kept?

EN-03 Capacity. Pending confirmation. Carried from the earlier open questions for FR-03. Questions: Is there a maximum number of enrollments per course?

## Modules and lessons

ML-01 Course structure. Pending confirmation. The requirement names modules and lessons. Questions: Is a module layer required? If so, is the hierarchy fixed at course, module, and lesson, and are lessons ordered within a module?

ML-02 Lesson content and visibility. Pending confirmation. Questions: Which content types are supported? Are lessons visible only after enrollment? Is ordering set by instructors?

## Quizzes and grading

QZ-01 Question types. Pending confirmation. Multiple choice (MCQ) and True/False are named as the question types to support. Question: Are these the only types in the first release?

QZ-02 Deterministic grading. Pending confirmation of the scoring rules. The principle that grading is deterministic and that no model decides a grade is stated in CLAUDE.md, principle 3. Questions: How is each question scored? Are partial credit or penalties applied? Is the passing threshold defined?

QZ-03 Multiple attempts. Pending confirmation. Questions: Is there a maximum number of attempts per quiz? May a learner retry after passing?

QZ-04 Best-score retention. Pending confirmation. Question: Is the reported score the highest attempt score? How are ties resolved, and are all attempts retained for reporting (see HX-01)?

## Progress and completion

PR-01 Lesson completion. Pending confirmation. Questions: Is a lesson complete when it is viewed, when a learner marks it complete, or both? Does completing a quiz count as completing its lesson?

PR-02 Integer progress. Pending confirmation. The requirement names integer progress without defining it. Interpretation to confirm: whole-number percentage of required lessons completed, with a stated rounding rule. Questions: Which lessons count in the denominator? Is quiz completion included?

## Reporting and oversight

RP-01 Instructor reporting. Pending confirmation. No report content, format, or scope is defined. Questions: Which metrics do instructors see (for example enrollments, completion, quiz results)? Are reports limited to the instructor's own courses?

AO-01 Administrator oversight. Pending confirmation. FR-07 is vague. Questions: Which system-level views and actions are available to administrators? Are administrator actions logged?

## History

HX-01 Append-only history. Pending confirmation. The requirement is named but not defined. Questions: Which records are append-only (for example quiz attempts, enrollment changes, completion events)? How are corrections recorded: as compensating entries or as edits? What is the retention period?

## Authorization

AZ-01 Authorization boundaries. Pending confirmation. The intended boundary is server-side enforcement of role and ownership checks in the API layer (docs/architecture.md, Trust boundaries). No mechanism is defined. Questions: Which checks apply to each endpoint, and which roles and ownership rules apply?

CC-01 Authentication and authorization. Role-based access is expected but not yet specified. Requires its own specification. Authentication mechanism and session model are pending (see AZ-01).

CC-02 Input validation. All API input is validated on the server against a schema. Specific rules are TBD per feature.

CC-03 Error handling. Errors return a consistent structure. Format is TBD.

## Non-functional requirements

NFR-01 Testability. Business rules are testable without HTTP or a database. Each feature has automated tests.

NFR-02 Modularity. Backend layers and frontend components have explicit boundaries, as described in docs/architecture.md.

NFR-03 Simplicity. The system uses SQLite and a single backend service. Additional infrastructure requires an approved decision.

NFR-04 Performance, availability, and capacity targets: TBD.

NFR-05 Accessibility and browser support: TBD.

NFR-06 Data retention and privacy: TBD. Relates to HX-01 retention.

## Traceability from business capability areas

Capability 1, Course creation and management: FR-01, CL-01, CL-02, CL-03, CP-01, ACT-03.
Capability 2, Course catalog and discovery: FR-02, CP-01.
Capability 3, Learner enrollment: FR-03, EN-01, EN-02, EN-03.
Capability 4, Lessons and learning content: FR-04, ML-01, ML-02.
Capability 5, Quizzes and assessments: FR-05, QZ-01, QZ-02, QZ-03, QZ-04.
Capability 6, Learning progress tracking: FR-06, PR-01, PR-02.
Capability 7, Basic administration: FR-07, AO-01, ACT-04.
Instructor reporting: RP-01, ACT-03.
Append-only history: HX-01.
Authorization: AZ-01, CC-01, ACT-02, ACT-03, ACT-04.

## Out of scope for this draft

1. Runtime AI features
2. Payments and certificates
3. External system integrations
4. Production deployment

## Unresolved details

Every item marked Pending confirmation above is an unresolved detail. The consolidated list of questions is kept with each item. Resolve them against the authoritative capstone brief, then record the result here and in the item's status.

1. Which functional requirements are mandatory for the capstone?
2. What are the acceptance criteria for each FR, CC, and other item?
3. What roles exist and what does each role permit (ACT-01 to ACT-04)?
4. How is learner progress defined and calculated (PR-01, PR-02)?
5. What are the quiz grading and attempt rules (QZ-01 to QZ-04)?
6. What are the performance and data-retention expectations (NFR-04, NFR-06, HX-01)?
