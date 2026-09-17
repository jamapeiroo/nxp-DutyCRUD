# Duty CRUD — Technical Assessment

An end-to-end web application to **read, create, update and delete** a to-do list of duties.

The domain is intentionally small, so the effort goes into what the brief asks for: a structure that can grow into a larger system, correct error handling, edge cases, observability and tests on both sides.

| Part | Technology |
|---|---|
| Frontend | React 18 + TypeScript (strict), Vite, hooks with `useState`, plain HTML and CSS |
| Backend | Node.js + TypeScript (strict), Express 5, `pg` with plain parameterised SQL (no ORM) |
| Database | PostgreSQL |
| Validation | `zod` on both sides + a `CHECK` constraint in the table |
| Logs | Structured JSON logs with `pino` |
| Tests | Jest + Supertest (backend) and React Testing Library (frontend) |
| Docker | `docker-compose.yml` with database, backend and frontend |

---

## Contents

- [Getting started](#getting-started)
  - [Option A — Docker (easiest)](#option-a--docker-easiest)
  - [Option B — Run it locally](#option-b--run-it-locally)
  - [Troubleshooting](#troubleshooting)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [API](#api)
- [Validation, errors and logs](#validation-errors-and-logs)
- [Tests](#tests)
- [What I'd add next](#what-id-add-next)
- [Key decisions](#key-decisions)

---

## Getting started

There are two ways to run the project. **With Docker** you only need Docker installed and one command. **Without Docker** you need Node.js and a PostgreSQL server on your machine.

### Option A — Docker (easiest)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

**1. Clone the repository**

```bash
git clone https://github.com/jamapeiroo/nxp-DutyCRUD.git
cd nxp-DutyCRUD
```

**2. Build and start everything**

```bash
docker compose up --build
```

The first time it takes a couple of minutes because it downloads the base images and installs the dependencies. When you see `Backend running on http://localhost:3000` in the logs, it is ready.

**3. Open the app** at **<http://localhost:8080>**

That's all: the database is created and the table is set up automatically the first time.

| Container | URL on your machine | What it does |
|---|---|---|
| `frontend` | <http://localhost:8080> | The React app, built and served by nginx |
| `backend` | <http://localhost:3000/api/duties> | The Express API |
| `db` | `localhost:5433` (user `postgres`, password `postgres`, database `duty_crud`) | PostgreSQL 16, runs `schema.sql` on first start |

To stop it:

```bash
docker compose down        # stops the containers, keeps the data
docker compose down -v     # stops them and deletes the database volume (starts from scratch next time)
```

The same commands are available as npm scripts if you prefer: `npm run docker:up`, `npm run docker:down` and `npm run docker:reset`.

<details>
<summary>How the Docker setup works</summary>

- `backend/Dockerfile` has two stages: the first installs all dependencies and compiles TypeScript, the second copies only the compiled `dist/` and the production dependencies, and runs as the non-root `node` user.
- `frontend/Dockerfile` builds the app with Vite and serves the static files with nginx. The API URL is passed as a build argument (`VITE_API_URL`) because Vite writes it into the bundle at build time.
- Both images use the repository root as build context because the project uses npm workspaces, and the lockfile (`package-lock.json`) lives in the root.
- The browser runs on your machine, so the frontend calls the API at `localhost:3000`, and the backend allows that origin through `FRONTEND_URL=http://localhost:8080`.
- PostgreSQL is published on port **5433** so it does not clash with a PostgreSQL you may already have on 5432.

</details>

### Option B — Run it locally

**Requirements:**

- [Node.js](https://nodejs.org/) **20.12 or newer** (check with `node -v`)
- **PostgreSQL 14 or newer** running on your machine

> Don't want to install PostgreSQL? Start only the database with Docker: `docker compose up -d db`. It is already set up with the table, and you can use `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/duty_crud` in step 4.

**1. Clone the repository and install the dependencies**

```bash
git clone https://github.com/jamapeiroo/nxp-DutyCRUD.git
cd nxp-DutyCRUD
npm install
```

The repository is an npm workspace, so a single `npm install` in the root installs the dependencies of both the backend and the frontend.

**2. Create the table in PostgreSQL**

Run the script [`backend/database/schema.sql`](backend/database/schema.sql). It creates a `duties` schema and the `duties.duties` table, and it can be run more than once safely.

```bash
psql -U postgres -d postgres -f backend/database/schema.sql
```

If `psql` is not available, open the file in pgAdmin or DBeaver (*Query Tool*), paste its content and run it.

**3. Configure the backend**

Create `backend/.env` from the example file:

```bash
cp backend/.env.example backend/.env          # macOS / Linux / Git Bash
copy backend\.env.example backend\.env        # Windows (cmd or PowerShell)
```

Open `backend/.env` and adjust `DATABASE_URL` to your PostgreSQL user, password and database:

```env
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

The frontend needs no configuration: it calls `http://localhost:3000/api` by default.

**4. Start the backend and the frontend**

```bash
npm run dev
```

This starts both applications in the same terminal. You should see something like:

```
[0] {"level":30,...,"msg":"Backend running on http://localhost:3000"}
[1]   ➜  Local:   http://localhost:5173/
```

If you prefer one terminal per application:

```bash
npm run dev --workspace backend    # terminal 1 → http://localhost:3000
npm run dev --workspace frontend   # terminal 2 → http://localhost:5173
```

**5. Open the app** at **<http://localhost:5173>**

You can also check that the API is up:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Useful commands

Run them from the repository root. They work the same on Windows, macOS and Linux.

| Command | What it does |
|---|---|
| `npm run dev` | Starts backend and frontend in development mode (auto-reload) |
| `npm test` | Runs all backend and frontend tests (no database needed) |
| `npm run build` | Type checks and compiles both projects into `backend/dist` and `frontend/dist` |
| `npm start --workspace backend` | Runs the compiled backend |
| `npm run preview --workspace frontend` | Serves the compiled frontend |
| `npm run docker:up` / `docker:down` / `docker:reset` | Starts, stops or resets the Docker setup |

### Environment variables

| Project | Variable | Required | Default | Description |
|---|---|---|---|---|
| backend | `DATABASE_URL` | yes | — | PostgreSQL connection string |
| backend | `PORT` | no | `3000` | Port of the API |
| backend | `FRONTEND_URL` | no | `http://localhost:5173` | Origin allowed by CORS |
| backend | `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| frontend | `VITE_API_URL` | no | `http://localhost:3000/api` | API base URL (`frontend/.env`) |

The backend validates these variables with zod when it starts. If one is missing or wrong, it stops with a clear message such as `Invalid environment variables: DATABASE_URL is required...`.

### Troubleshooting

| Problem | Cause and fix |
|---|---|
| `Invalid environment variables: DATABASE_URL ...` | `backend/.env` does not exist or has no `DATABASE_URL`. Repeat step 3. |
| The page shows **"Could not connect to the server"** | The backend is not running, or `VITE_API_URL` points to the wrong place. |
| Every request returns `500 Something went wrong` | Check the backend logs: `ECONNREFUSED` means PostgreSQL is not running; `relation "duties.duties" does not exist` means `schema.sql` was not run (step 2). |
| `EADDRINUSE` / port already in use | Another process uses 3000, 5173 or 8080. Stop it or change `PORT` (and `FRONTEND_URL` / `VITE_API_URL` accordingly). |
| CORS error in the browser console | `FRONTEND_URL` in the backend must match the URL you open: `http://localhost:5173` locally, `http://localhost:8080` with Docker. |
| Docker: changes in `schema.sql` are not applied | The init script only runs with an empty database. Run `docker compose down -v` and start again. |

---

## Screenshots

Taken from the running application.

| Duties list | Editing a duty |
|---|---|
| ![Duties list](docs/screenshots/duties-list.png) | ![Edit mode](docs/screenshots/edit-mode.png) |
| Duties are sorted by name. Each row can be edited or deleted. | Edit mode replaces the row with an input. Enter or **Save** confirms, **Cancel** discards. |

| Empty state | Client-side validation |
|---|---|
| ![Empty state](docs/screenshots/empty-state.png) | ![Validation error](docs/screenshots/validation-error.png) |
| Shown when there are no duties yet. | Empty or blank names are blocked before calling the API. |

| Backend not reachable | Mobile |
|---|---|
| ![Error state](docs/screenshots/error-state.png) | ![Mobile](docs/screenshots/mobile.png) |
| Network and API errors are always shown to the user. | Under 560 px the form and the row buttons stack. |

Deleting asks for confirmation with the browser's native dialog, so it does not appear in the screenshots.

---

## Architecture

The repository contains **two independent projects**, `backend/` and `frontend/`. The frontend never imports backend code; they only share the HTTP API, so each one could be deployed or replaced on its own. The root `package.json` just runs scripts for both (npm workspaces).

Both projects are organised in **layers**, each with a single responsibility and dependencies in one direction:

```
Backend    routes → controller → service → repository → PostgreSQL
Frontend   components → useDuties (hook) → duty.service → api-client (fetch) → Backend API
```

| Layer | Responsibility |
|---|---|
| `duties.routes.ts` | Maps each URL and HTTP method to a controller function |
| `duties.controller.ts` | Reads the request, validates it with zod and chooses the status code |
| `duties.service.ts` | Business rules (e.g. a missing duty is a 404) and business logs |
| `duties.repository.ts` | The only place with SQL |
| `hooks/useDuties.ts` | Keeps the list in state and updates it after create, edit and delete |
| `services/api-client.ts` | The only place that calls `fetch`; checks `response.ok` and turns errors into readable messages |

```
.
├── docker-compose.yml
├── docs/screenshots/
├── backend/
│   ├── Dockerfile
│   ├── database/schema.sql
│   └── src/
│       ├── index.ts                # starts the server
│       ├── app.ts                  # Express app: middlewares, routers, error handler
│       ├── config/                 # environment (zod) and PostgreSQL pool
│       ├── duties/                 # routes, controller, service, repository, validation, model
│       ├── middlewares/            # CORS, request logger, not found, error handler
│       ├── errors/app-error.ts     # expected errors with an HTTP status
│       ├── logger/logger.ts        # pino
│       ├── utils/validate.ts       # runs a zod schema or throws a 400 error
│       └── __tests__/              # unit and integration tests
└── frontend/
    ├── Dockerfile
    └── src/
        ├── App.tsx, main.tsx
        ├── config/env.ts           # API URL
        ├── types/duty.ts
        ├── services/               # api-client and duty.service
        ├── hooks/useDuties.ts
        ├── components/duties/      # CreateDutyForm, DutiesList, DutyItem
        ├── utils/validateDutyName.ts
        ├── styles/global.css
        └── __tests__/
```

### Adding a new entity

For example, `projects`:

1. Add the table to `backend/database/schema.sql`.
2. Copy `backend/src/duties/` to `backend/src/projects/`, change the SQL and the zod schemas, and register the router in `app.ts` with `app.use('/api/projects', projectsRouter)`.
3. In the frontend, add `services/project.service.ts` (reusing `apiRequest`), a `useProjects` hook and `components/projects/`.
4. Config, logger, error handling, middlewares and the HTTP client are reused without changes.

---

## API

Base URL: `http://localhost:3000/api`

| Method | Route | Body | Success | Errors |
|---|---|---|---|---|
| `GET` | `/duties` | — | `200` list sorted by name | `500` |
| `POST` | `/duties` | `{ "name": "..." }` | `201` created duty | `400`, `500` |
| `PUT` | `/duties/:id` | `{ "name": "..." }` | `200` updated duty | `400`, `404`, `500` |
| `DELETE` | `/duties/:id` | — | `204` no content | `400`, `404`, `500` |
| `GET` | `/health` (no `/api` prefix) | — | `200 { "status": "ok" }` | — |

```bash
curl -X POST http://localhost:3000/api/duties -H "Content-Type: application/json" -d '{"name":"  Review pull requests  "}'
# 201 {"id":"3f0c6b1e-5a1d-4c3e-9d57-1f2e3a4b5c6d","name":"Review pull requests"}

curl -X PUT http://localhost:3000/api/duties/123 -H "Content-Type: application/json" -d '{"name":"x"}'
# 400 {"error":"Duty id must be a valid UUID"}
```

All errors have the same shape, `{ "error": "message" }`, so the frontend handles them all the same way.

---

## Validation, errors and logs

**Validation happens in three places**, each with a different purpose:

| Where | Rules | If it fails |
|---|---|---|
| Frontend (zod) | Name required after trimming, max 200 characters | Message under the input, nothing is sent |
| Backend (zod) | Body required, name is a string, trimmed, 1–200 characters, id is a valid UUID | `400` with the reason |
| Database | `NOT NULL`, `VARCHAR(200)`, `CHECK` on the trimmed length | The query is rejected |

The frontend check gives instant feedback, the backend check protects the API from any client, and the database constraint is the last line of defense.

**Errors:**

- Expected errors are thrown as `AppError(status, message)` from any layer and returned as they are: `400` for invalid data, `404` when the duty does not exist.
- Unexpected errors (database down, a bug) are logged with the full stack and returned as a generic `500 Something went wrong`, so internal details never reach the client.
- In the UI, buttons are disabled while a request is running (no double submissions), deleting asks for confirmation, and every error is shown next to the action that caused it.

**Logs** are one JSON object per line, ready for tools like Grafana Loki or Datadog. Every request is logged with its status and duration, and create, update and delete add a business log with the duty id:

```json
{"level":30,"time":1789651951539,"dutyId":"a7f41d04-...","msg":"Duty updated"}
{"level":30,"time":1789651951541,"method":"PUT","url":"/api/duties/a7f41d04-...","status":200,"durationMs":11,"msg":"Request completed"}
```

---

## Tests

```bash
npm test                         # all tests
npm test --workspace backend     # 32 tests
npm test --workspace frontend    # 31 tests
```

**Backend**

- Unit tests for the zod schemas (empty, blank, `null`, non-text and too long names, invalid UUIDs) and for the service with the repository mocked (including 404 on update and delete).
- Integration tests with Supertest that send real HTTP requests to the Express app and check the status code and body of every endpoint: success, `400`, `404`, invalid JSON, unknown routes and a `500` that does not leak the database error. Only the database pool is mocked, so no PostgreSQL is needed.

**Frontend**

- Page tests (`App.test.tsx`): a loading error is shown, and creating, editing and deleting update the list without reloading the page.
- Component tests: form validation, trimmed names, a single request while saving, API errors shown to the user, cancel editing, delete confirmed and cancelled.
- Service tests: URLs and methods, empty `204` responses, backend error messages and network failures.

---

## What I'd add next

Things deliberately left out of the assessment, and a few known limits:

- **Tests against a real PostgreSQL** (for example with Testcontainers), so the SQL and the `CHECK` constraint are exercised too.
- **Versioned migrations** (e.g. `node-pg-migrate`) instead of a single `schema.sql`.
- **CI with GitHub Actions** running type checks, tests, build and the Docker images on every push.
- **Pagination** for `GET /duties` and detection of concurrent edits (`409 Conflict`) with an `updated_at` column.
- **Better mapping of known errors**: a body over 100 KB (`413`) or a `CHECK` violation currently end up as a generic `500`.
- **Production hardening**: graceful shutdown (`SIGTERM` + `pool.end()`), a request id in every log, `helmet`, rate limiting and authentication.
- **UI details**: hide "No duties yet" when the list fails to load, a retry button, and a custom delete dialog instead of `window.confirm`.
- **End-to-end tests** with Playwright for the main flows.

---

## Key decisions

| Decision | Why |
|---|---|
| Plain SQL with `pg` | Required by the brief. Queries stay visible, and parameters (`$1`, `$2`) prevent SQL injection. |
| Layers as plain functions, without classes or dependency injection | Keeps the separation needed to grow, with less boilerplate. Tests replace modules with `jest.mock`. |
| `zod` for validation | Rules are declared once and read clearly, unexpected types are handled, and the result is clean typed data. It also validates the environment variables. |
| Express 5 | Errors thrown in async handlers reach the error handler automatically, with no `try/catch` in every endpoint. |
| No component library | A single screen with a form and a list; native elements keep the code easy to read and the bundle about 3× smaller than with Ant Design. |
| `useState` inside a custom hook | The brief forbids Redux and `useReducer`, and the app has no global state that needs more. |
| The list is updated with the server response | Always consistent with the database and simpler than optimistic updates. |
| Docker Compose with multi-stage images | One command to run the whole stack, with small runtime images that only contain what is needed to run. |
