# LearnLab frontend

React, TypeScript, and Vite client for the LearnLab FastAPI backend.

## Status

Written test-first, but its toolchain has not been installed here. The type check, the Vitest suite, and the production build have not been run. See "Verification" below.

## Setup

Installing packages needs explicit approval in this project.

```bash
cd frontend
npm install
cp .env.example .env     # optional; the defaults work with the dev proxy
```

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:5173
npm test             # Vitest, once
npm run typecheck    # tsc --noEmit
npm run build        # typecheck, then production build into dist/
```

## Configuration

The backend URL comes from the environment and is never hard-coded.

| Variable | Default | Purpose |
|---|---|---|
| VITE_API_BASE_URL | /api | Where the browser sends API calls. The default uses the Vite dev proxy, so no CORS setup is needed. |
| VITE_BACKEND_URL | http://localhost:8000 | Where the dev proxy forwards /api requests. |

A production build that points VITE_API_BASE_URL at another origin needs CORS enabled on the backend, which it does not have yet.

## Running the whole stack locally

Start the backend from the backend directory (uvicorn is installed but is not yet declared in backend/pyproject.toml):

```bash
cd backend
python -m uvicorn --factory src.api.app:create_app --port 8000
```

The API has no sign-up route, so create a few users once with the existing repository code, then start the frontend:

```bash
cd backend
python -c "from src.repository.database import connect, init_schema; from src.repository.user_repository import UserRepository; from src.types.enums import Role; c = connect('learnlab.db'); init_schema(c); u = UserRepository(c); [u.add(n, r) for n, r in [('Ada', Role.INSTRUCTOR), ('Lin', Role.LEARNER), ('Root', Role.ADMIN)]]"
```

Users get ids 1, 2, and 3 in that order. Sign in with an id and the matching "View as" role.

## Identity is a development stub

The backend trusts an X-User-Id header, and the sign-in screen only sets it. This is not authentication (requirement CC-01 is unspecified). The "View as" role changes which screens are shown. The backend decides what is allowed, and its 401, 403, 404, and 409 responses are shown to the user as they are.

## Screens

| Route | Screen | API calls |
|---|---|---|
| /login | Development sign-in | none |
| /catalog | Course catalog | GET /courses |
| /courses/:id | Course details and enrollment | GET /courses/{id}, POST /courses/{id}/enrollments |
| /my-courses | Enrolled courses with progress | GET /enrollments, GET /courses/{id}/progress |
| /courses/:id/learn | Modules, lessons, completion, progress | GET /courses/{id}/modules, POST /lessons/{id}/completion, GET /courses/{id}/progress |
| /quizzes/:id | Take a quiz, see score and best score | GET /quizzes/{id}, POST /quizzes/{id}/attempts, GET /quizzes/{id}/attempts, GET /quizzes/{id}/best-score |
| /instructor | Own courses and course creation | GET /courses, GET /courses/{id}, POST /courses |
| /instructor/courses/:id | Edit, publish, unpublish, archive, content, progress | PATCH /courses/{id}, POST /courses/{id}/transitions, POST /courses/{id}/modules, POST /modules/{id}/lessons, POST /lessons/{id}/quizzes, GET /courses/{id}/progress-summary |
| /instructor/quizzes/:id | Quiz authoring | GET /quizzes/{id}, POST /quizzes/{id}/questions/mcq, POST /quizzes/{id}/questions/true-false |

No other endpoint is called. Quiz answer keys are never requested or displayed, because the API does not return them.

## Gaps in the backend API that shape this client

1. No route lists the quizzes of a lesson, so a learner opens a quiz by the number the instructor gives them.
2. GET /courses returns published courses only, so an instructor's drafts and archived courses are found through ids remembered in this browser.
3. No route returns the current user or role, so the role is chosen on the sign-in screen.
4. No route creates users, so demo users are seeded as shown above.

## Layers

The Harness architecture gate applies to frontend/src: types, then config, then api (the HTTP client), then ui. A lower layer never imports a higher one. Tests sit beside the code in __tests__ folders.

## Verification

Run without installing anything: the Harness layer rule (no violations), a static check that all 237 relative imports resolve and every imported name is exported, and execution of the pure TypeScript modules through Node's native type stripping (10 behaviour checks passed).

Not run: the Vitest suite, the TypeScript type check, the production build, and any browser test. Those need `npm install`.
