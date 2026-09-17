# Duty CRUD — Technical Assessment

An end-to-end application to **read, create, update and delete** a to-do list of duties. The domain is small on purpose: the interesting part is how the code is organised, how errors travel from the database to the screen, and how easy it is to add the next feature.

The brief asks to *"design the structure, architecture, and layers to grow the codebase and become a large system with more functionality"*. Every decision below comes back to that sentence, while keeping the code simple enough to read in one sitting.

- **Frontend** — React 18 + TypeScript (strict), Vite, hooks with `useState` only. Plain HTML elements and one CSS file, no component library.
- **Backend** — Node.js + TypeScript (strict), Express 5, `pg`. Plain parameterised SQL, no ORM or query builder.
- **Database** — PostgreSQL 14+, one table created by `backend/database/schema.sql`.
- **Validation** — `zod` schemas in both projects, plus a `CHECK` constraint in the database.
- **Observability** — structured JSON logs with `pino`: one line per request plus business events.
- **Tests** — Jest on both sides: 32 backend tests (unit + HTTP integration) and 31 frontend tests (components, service, full page flows).
- **No authentication**, as required by the brief.

---

## Quick start

**Prerequisites:** Node.js 20.12 or newer and a running PostgreSQL 14+ server.

```bash
# 1. Install both applications (npm workspaces) from the repository root
npm install

# 2. Create the table (any PostgreSQL client works: psql, pgAdmin, DBeaver...)
psql -U postgres -d postgres -f backend/database/schema.sql

# 3. Configure the backend
cp backend/.env.example backend/.env      # Windows (cmd/PowerShell): copy backend\.env.example backend\.env
#    then edit DATABASE_URL in backend/.env

# 4. Start backend (http://localhost:3000) and frontend (http://localhost:5173)
npm run dev
```

Open <http://localhost:5173>.

To run each application in its own terminal:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

Tests and production build:

```bash
npm test                               # backend + frontend, no database needed
npm run build                          # compiles backend/dist and frontend/dist
npm start --workspace backend          # serves the compiled API
npm run preview --workspace frontend   # serves the compiled frontend
```

All scripts work the same in PowerShell, cmd, macOS and Linux: there is no Bash-only syntax, both servers are started with `concurrently`, and file paths are built with `path.join`.

---

## Screenshots

> Taken from the running application (real backend and PostgreSQL). Files live in [`docs/screenshots/`](docs/screenshots).

| Duties list | Editing a duty |
|---|---|
| ![Duties list](docs/screenshots/duties-list.png) | ![Edit mode](docs/screenshots/edit-mode.png) |

| Empty state | Client-side validation |
|---|---|
| ![Empty state](docs/screenshots/empty-state.png) | ![Validation error](docs/screenshots/validation-error.png) |

| Backend not reachable | Mobile (responsive layout) |
|---|---|
| ![Error state](docs/screenshots/error-state.png) | ![Mobile](docs/screenshots/mobile.png) |

Deleting a duty asks for confirmation with the browser's native `confirm` dialog, which is why it does not appear in the screenshots.

---

## Architecture

The brief mentions *structure*, *architecture* and *layers*. They are three different questions, answered separately.

**Structure — grouped by feature.** Everything about duties lives together: `backend/src/duties/` on the API and `frontend/src/components/duties/` plus its hook and service on the UI. Code that any feature can use (config, logger, errors, middlewares, HTTP client) lives outside those folders.

**Architecture — two independent applications.** The frontend never imports backend code. They only share an HTTP contract (JSON over `/api/duties`), so each one could be deployed, versioned or replaced on its own. The root `package.json` is only a convenience runner (npm workspaces); each project keeps its own `package.json`.

**Layers — one responsibility each, dependencies in one direction.**

```
Backend
  routes → controller → service → repository → config/database (pg)
                ↓           ↓
          utils/validate   errors/AppError, logger

Frontend
  components → hooks/useDuties → services/duty.service → services/api-client (fetch)
```

| Layer | Knows about | Does not know about |
|---|---|---|
| `duties.routes.ts` | URLs and HTTP methods | Business rules, SQL |
| `duties.controller.ts` | `req` / `res`, status codes, validation | SQL |
| `duties.service.ts` | Business rules (e.g. "not found" → 404), logging | HTTP, SQL |
| `duties.repository.ts` | SQL and the connection pool | HTTP |

These rules can be checked mechanically (Git Bash, macOS or Linux):

```bash
# Only config/database.ts imports the PostgreSQL driver
grep -rn "from 'pg'" backend/src --include=*.ts
# → backend/src/config/database.ts

# SQL only lives in the repository
grep -rlE "SELECT|INSERT INTO|DELETE FROM" backend/src --include=*.ts --exclude-dir=__tests__
# → backend/src/duties/duties.repository.ts

# Service, repository and schemas do not depend on Express
grep -n "from 'express'" backend/src/duties/duties.{service,repository,validation}.ts
# → no matches

# Only the API client calls fetch
grep -rln "fetch(" frontend/src --include=*.ts --include=*.tsx --exclude-dir=__tests__
# → frontend/src/services/api-client.ts
```

### Directory tree

```
Tech_Test/
├── package.json                    # npm workspaces + shortcuts (dev, test, build)
├── docs/screenshots/               # images used in the READMEs
├── backend/
│   ├── database/schema.sql         # schema + table + CHECK constraint
│   ├── .env.example
│   └── src/
│       ├── index.ts                # starts the server (the only file that listens on a port)
│       ├── app.ts                  # builds the Express app: middlewares, routers, error handler
│       ├── config/
│       │   ├── env.ts              # zod-validated environment, fails fast at startup
│       │   └── database.ts         # the only place that imports pg
│       ├── duties/
│       │   ├── duties.routes.ts
│       │   ├── duties.controller.ts
│       │   ├── duties.service.ts
│       │   ├── duties.repository.ts
│       │   ├── duties.validation.ts
│       │   └── models/duty.model.ts
│       ├── middlewares/            # cors, request logger, not found, error handler
│       ├── errors/app-error.ts     # expected errors with an HTTP status
│       ├── logger/logger.ts        # pino
│       ├── utils/validate.ts       # zod schema → data or 400 AppError
│       └── __tests__/{unit,integration}/
└── frontend/
    ├── .env.example
    └── src/
        ├── main.tsx, App.tsx
        ├── config/env.ts                 # API URL from VITE_API_URL
        ├── types/duty.ts
        ├── services/{api-client,duty.service}.ts
        ├── hooks/useDuties.ts            # list state + create/edit/delete
        ├── components/duties/{CreateDutyForm,DutiesList,DutyItem}.tsx
        ├── utils/validateDutyName.ts     # zod schema for the form
        ├── styles/global.css
        └── __tests__/
```

More detail in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

### How to add a new feature in 4 steps

Example: adding `projects`.

1. **Database** — add the table to `backend/database/schema.sql`.
2. **Backend** — copy `backend/src/duties/` to `backend/src/projects/`, rename, and replace the SQL and the zod schemas. Register it with one line in `app.ts`: `app.use('/api/projects', projectsRouter)`.
3. **Frontend** — add `types/project.ts`, `services/project.service.ts` (it reuses `apiRequest`), a `useProjects` hook and `components/projects/`.
4. **Done** — config, logger, error handling, validation helper and HTTP client are reused as they are. No duties file changes.

---

## API

| Method | Route | Body | Success | Errors |
|---|---|---|---|---|
| `GET` | `/api/duties` | — | `200` list sorted by name | `500` |
| `POST` | `/api/duties` | `{ "name": "..." }` | `201` created duty | `400`, `500` |
| `PUT` | `/api/duties/:id` | `{ "name": "..." }` | `200` updated duty | `400`, `404`, `500` |
| `DELETE` | `/api/duties/:id` | — | `204` no body | `400`, `404`, `500` |
| `GET` | `/health` | — | `200 { "status": "ok" }` | — |

```bash
curl -X POST http://localhost:3000/api/duties \
  -H "Content-Type: application/json" \
  -d '{"name":"  Review pull requests  "}'
# 201 {"id":"3f0c6b1e-...","name":"Review pull requests"}

curl -X PUT http://localhost:3000/api/duties/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"x"}'
# 400 {"error":"Duty id must be a valid UUID"}
```

Every error has the same shape, `{ "error": "message" }`, so the frontend reads all of them the same way.

---

## Validation strategy

Three layers, each with a different job. It is defense in depth, not duplication for its own sake.

> **Client** gives instant feedback. **API** enforces the rules. **Database** protects the data if someone skips the API.

| Layer | Where | Rules | What happens when it fails |
|---|---|---|---|
| Client | `frontend/src/utils/validateDutyName.ts` (zod) | trim, 1–200 characters; `maxLength` on inputs | Message under the input, no request is sent |
| API | `backend/src/duties/duties.validation.ts` (zod) | body required, `name` is a string, trim, 1–200 characters, `:id` is a UUID | `400 { "error": "..." }`, the database is not touched |
| Database | `backend/database/schema.sql` | `NOT NULL`, `VARCHAR(200)`, `CHECK (char_length(trim(name)) BETWEEN 1 AND 200)` | The insert or update is rejected |

The environment variables are validated with zod too: if `DATABASE_URL` is missing or `PORT=abc`, the backend refuses to start and says which variable is wrong.

**About the repeated rule between frontend and backend:** the brief requires both projects to be independent, so they cannot share a schema package. It is a single field with two simple rules, so the risk of them drifting apart is low. If the rules grow, a shared contracts package would be the next step (see below).

---

## Errors and observability

- **Expected errors** are thrown as `AppError(status, message)` from any layer and answered as they are: `400` for validation, `404` when the duty does not exist.
- **Invalid JSON** in the body is answered with `400 { "error": "Invalid JSON body" }`.
- **Anything else** (database down, a bug) is logged with its full stack and answered with a generic `500 { "error": "Something went wrong" }`. Internal messages never reach the client.
- On the frontend, a network failure shows *"Could not connect to the server"*, and API errors are shown next to the form or the duty that caused them.

Logs are JSON lines, ready to be filtered in a log platform:

```json
{"level":30,"time":1789460000000,"dutyId":"3f0c6b1e-...","msg":"Duty updated"}
{"level":30,"time":1789460000004,"method":"PUT","url":"/api/duties/3f0c6b1e-...","status":200,"durationMs":14,"msg":"Request completed"}
```

The level is controlled with `LOG_LEVEL` (`info` by default, `silent` in tests).

---

## Testing

```bash
npm test                         # everything
npm test --workspace backend     # 32 tests
npm test --workspace frontend    # 31 tests
```

- **Backend**
  - **Unit tests** — zod schemas and the `validate` helper (empty, blank, `null`, non-string and 201-character names; malformed ids), and the service with the repository mocked (including the 404 cases).
  - **HTTP integration tests** — `supertest` against the real Express app: middlewares, router, controller, service and repository all run. Only `pool.query` is mocked, so the tests check real status codes and bodies (400, 404, 500 without leaking the database error, invalid JSON, unknown route) without needing PostgreSQL.
- **Frontend**
  - **Page flows** (`App.test.tsx`) — loading error, creating, editing and deleting update the list without reloading or fetching the list again.
  - **Components** — form validation (empty and blank names), trimming, only one request while saving, API errors shown to the user, cancel edit, delete confirmation accepted and cancelled.
  - **Service** — URLs and methods, empty `204` response, backend error messages and network failures.

**Why the database is mocked:** the tests run anywhere in a few seconds with no setup. The trade-off is that they do not execute the real SQL; that is the first item in the list below.

---

## What I'd add next

Things deliberately left out of the assessment, and a few limits I know about. The layers already in place make most of them small, local changes.

- **Tests against a real PostgreSQL** — a test database (Docker or Testcontainers) with a transaction rolled back after each test, so the SQL and the `CHECK` constraint are exercised too.
- **Docker Compose** — PostgreSQL, backend and frontend with one command.
- **Migrations** — versioned migrations (e.g. `node-pg-migrate`) instead of a single `schema.sql`.
- **CI** — GitHub Actions running type check, tests and build on every push, on Windows, macOS and Linux.
- **Better error mapping** — today a body over 100 KB (`413`) or a `CHECK` violation from PostgreSQL ends up as a generic `500`; the error handler should respect those statuses.
- **Concurrent edits** — two people editing the same duty means *last write wins*. An `updated_at` or version column checked in the `UPDATE` would return `409 Conflict`.
- **Pagination** — `GET /api/duties` returns every row; add `LIMIT`/`OFFSET` or cursor pagination and an index on `name`.
- **Graceful shutdown** — listen to `SIGTERM`, stop accepting requests and close the pool with `pool.end()`.
- **Request id** — generate an id per request and include it in every log line to follow a request end to end.
- **UI polish** — when the list fails to load, the page shows the error banner *and* "No duties yet"; the empty message should be hidden in that case. Also a custom confirmation dialog instead of `window.confirm`.
- **Shared contracts / OpenAPI** — generate the API contract from the zod schemas and share types with the frontend.
- **Security for a public deployment** — authentication, `helmet` headers and rate limiting.
- **End-to-end tests** — a few Playwright tests for the main flows.

---

## Decisions worth defending

Choosing what *not* to add matters as much as the patterns used.

| Decision | Why |
|---|---|
| Plain SQL with `pg`, no ORM or query builder | Required by the brief, and it keeps every query visible and easy to review. Parameters (`$1`, `$2`) prevent SQL injection. |
| Layers as plain exported functions, no classes or dependency injection container | Keeps the separation that lets the project grow, without the boilerplate. Tests replace modules with `jest.mock`. |
| `zod` instead of hand-written `if` checks | Rules are declared once, read like a sentence, cover unexpected types (`null`, numbers, missing body) and return clean, typed data. The same helper validates the environment. |
| Express 5 | Errors thrown in `async` handlers reach the error middleware automatically, so there is no `try/catch` in every endpoint. |
| No component library (Ant Design was optional) | One screen with a form and a list: native elements and one CSS file are easier to read and the bundle is about three times smaller. A library would pay off with tables, date pickers or many screens. |
| `useState` in a custom hook, no Redux or `useReducer` | Required by the brief, and not needed: only `App` uses the list and passes it down two levels. |
| The list is updated with the server response, not optimistically | Always consistent with the database and simpler. The cost is waiting for the request before seeing the change. |
| UUIDs generated by PostgreSQL | Clients cannot guess other ids or count the rows, and the id never has to be generated in application code. |
| Mocked pool in integration tests | Fast and zero-setup, at the cost of not running the real SQL (listed above as the next step). |
