# Backend — Duty CRUD API

REST API for the duties list, written in Node.js + TypeScript (strict mode) with Express 5. Data is stored in PostgreSQL using plain, parameterised SQL through `pg`, with no ORM or query builder.

Runtime dependencies are kept to four: `express` (HTTP), `pg` (PostgreSQL driver), `pino` (structured logs) and `zod` (validation).

> Back to the [main README](../README.md) for the full picture, screenshots and design decisions.

---

## Getting started

**Prerequisites:** Node.js 20.12+ (the `.env` file is read with Node's built-in `process.loadEnvFile`) and PostgreSQL 14+.

```bash
# 1. Create the schema and table
psql -U postgres -d postgres -f database/schema.sql

# 2. Configure the environment
cp .env.example .env              # Windows: copy .env.example .env

# 3. From the repository root: install and start
npm install
npm run dev --workspace backend   # http://localhost:3000
```

Check that it is running:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Environment variables

Validated with zod in `src/config/env.ts` when the process starts. If something is missing or invalid, the server does not start and prints which variable is wrong, for example `Invalid environment variables: PORT Expected number, received nan`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/postgres` |
| `PORT` | no | `3000` | Port the API listens on (positive integer) |
| `FRONTEND_URL` | no | `http://localhost:5173` | Only origin allowed by CORS |
| `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |

Variables already defined in the system take priority over the `.env` file, so `PORT=4000 npm run dev` works without editing it.

### Scripts

| Script | Command | What it does |
|---|---|---|
| `npm run dev` | `tsx watch src/index.ts` | Runs the TypeScript source and restarts on every change |
| `npm run build` | `tsc -p tsconfig.json` | Type checks and compiles to `dist/` |
| `npm start` | `node dist/index.js` | Runs the compiled API |
| `npm test` | `jest --runInBand` | Runs all tests (no database needed) |

---

## Folder structure

```
backend/
├── database/schema.sql              # schema "duties", table and CHECK constraint
├── jest.config.js / jest.setup.ts   # test config: fake DATABASE_URL, silent logs
└── src/
    ├── index.ts                     # starts the HTTP server (only file that listens on a port)
    ├── app.ts                       # creates the Express app and registers middlewares and routers
    ├── config/
    │   ├── env.ts                   # loads .env and validates it with zod
    │   └── database.ts              # PostgreSQL connection pool (only file importing pg)
    ├── duties/                      # everything about the duties feature
    │   ├── duties.routes.ts         # URL + method → controller function
    │   ├── duties.controller.ts     # reads the request, validates, calls the service, sends the response
    │   ├── duties.service.ts        # business rules: 404 when a duty does not exist, business logs
    │   ├── duties.repository.ts     # SQL queries (only file with SQL)
    │   ├── duties.validation.ts     # zod schemas for the body and the id
    │   └── models/duty.model.ts     # Duty type
    ├── middlewares/
    │   ├── cors.middleware.ts           # allows the frontend origin, answers preflight requests
    │   ├── request-logger.middleware.ts # one log line per request with status and duration
    │   ├── not-found.middleware.ts      # 404 for unknown routes
    │   └── error-handler.middleware.ts  # turns any error into the right status and JSON body
    ├── errors/app-error.ts          # expected error with an HTTP status code
    ├── logger/logger.ts             # pino instance
    ├── utils/validate.ts            # runs a zod schema: returns clean data or throws a 400 AppError
    └── __tests__/
        ├── unit/                    # validation and service
        └── integration/             # HTTP requests with supertest
```

---

## How a request travels

Example: `PUT /api/duties/:id` with `{ "name": "  Review pull requests  " }`.

1. **`express.json()`** parses the body into `req.body`. Invalid JSON throws a `SyntaxError` that ends as a `400`.
2. **`cors`** adds the CORS headers. `OPTIONS` preflight requests are answered here with `204`.
3. **`requestLogger`** stores the start time and logs the request when the response finishes.
4. **`duties.routes.ts`** sends `PUT /:id` to `dutiesController.updateDuty`.
5. **Controller** validates the id with `dutyIdSchema` and the body with `dutyBodySchema`. The name comes back already trimmed. Invalid data throws `AppError(400)` before touching the database.
6. **Service** calls the repository. If it gets `null`, it throws `AppError(404, 'Duty not found')`. Otherwise it logs `Duty updated` with the id.
7. **Repository** runs `UPDATE duties.duties SET name = $1 WHERE id = $2 RETURNING id, name`.
8. **Controller** answers `200` with the updated duty.
9. If anything threw along the way, **Express 5 forwards it automatically** (no `try/catch` needed in async handlers) to **`errorHandler`**, which picks the status and the JSON body.

### Layer rules

| Layer | Can use | Must not use |
|---|---|---|
| Routes | Controller | Service, repository, SQL |
| Controller | `req`/`res`, `validate`, schemas, service | Repository, `pg` |
| Service | Repository, `AppError`, logger | Express, SQL |
| Repository | `pool` from `config/database` | Express, `AppError` |

This is what makes the code easy to grow: a new business rule only touches the service, a change of database only touches the repository, and each layer can be tested on its own.

---

## API reference

Base URL: `http://localhost:3000/api`. All bodies are JSON.

### `GET /duties`

Returns every duty sorted by name.

```json
200 [
  { "id": "9b1c...", "name": "Fix the flaky login test" },
  { "id": "3f0c...", "name": "Review pull requests" }
]
```

### `POST /duties`

```json
Request  { "name": "  Review pull requests  " }
201      { "id": "3f0c6b1e-5a1d-4c3e-9d57-1f2e3a4b5c6d", "name": "Review pull requests" }
400      { "error": "Name is required" }
```

### `PUT /duties/:id`

```json
Request  { "name": "Review pull requests before the release" }
200      { "id": "3f0c6b1e-...", "name": "Review pull requests before the release" }
400      { "error": "Duty id must be a valid UUID" }
404      { "error": "Duty not found" }
```

### `DELETE /duties/:id`

```
204  (no body)
400  { "error": "Duty id must be a valid UUID" }
404  { "error": "Duty not found" }
```

### `GET /health`

Lightweight check for load balancers or containers. It does not query the database.

```json
200 { "status": "ok" }
```

---

## Validation

Schemas live in `src/duties/duties.validation.ts`:

```ts
export const dutyBodySchema = z.object(
  {
    name: z
      .string({ required_error: 'Name is required', invalid_type_error: 'Name must be a text' })
      .trim()
      .min(1, 'Name is required')
      .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer`)
  },
  { required_error: 'Name is required' }
);

export const dutyIdSchema = z.string().uuid('Duty id must be a valid UUID');
```

The controller uses them through `validate(schema, data)` (`src/utils/validate.ts`), which returns the parsed data or throws `AppError(400)` with the first message:

```ts
const id = validate(dutyIdSchema, req.params.id);
const { name } = validate(dutyBodySchema, req.body);
```

| Input | Result |
|---|---|
| No body, `name` missing, empty or only spaces | `400 Name is required` |
| `name` is a number, `null`, an object... | `400 Name must be a text` |
| More than 200 characters after trimming | `400 Name must be 200 characters or fewer` |
| Id that is not a real UUID (length is not enough) | `400 Duty id must be a valid UUID` |
| Extra fields such as `{ "name": "x", "admin": true }` | Ignored: only `name` reaches the SQL |

Validating the id before the query matters: PostgreSQL would reject `"123"` as a UUID with an error that would otherwise become a `500`.

---

## Error handling

| Situation | Status | Body |
|---|---|---|
| Invalid body or id | `400` | `{ "error": "<validation message>" }` |
| Malformed JSON | `400` | `{ "error": "Invalid JSON body" }` |
| Duty not found on update or delete | `404` | `{ "error": "Duty not found" }` |
| Unknown route | `404` | `{ "error": "Route not found" }` |
| Anything unexpected (database down, bug) | `500` | `{ "error": "Something went wrong" }` |

Only `AppError` messages are sent to the client, because they are written on purpose. Any other error may contain internal details (hosts, table names, stack traces), so it is logged in full and the client only gets the generic message.

---

## Logging

`pino` writes one JSON object per line. Every request produces a `Request completed` line, and the service adds business events with the duty id (never the name the user typed):

```json
{"level":30,"time":1789460000000,"pid":12256,"hostname":"PC","dutyId":"3f0c6b1e-...","msg":"Duty created"}
{"level":30,"time":1789460000003,"pid":12256,"hostname":"PC","method":"POST","url":"/api/duties","status":201,"durationMs":12,"msg":"Request completed"}
{"level":50,"time":1789460000100,"pid":12256,"hostname":"PC","err":{"type":"Error","message":"connect ECONNREFUSED 127.0.0.1:5432","stack":"..."},"msg":"Unexpected error"}
```

`level` 30 is `info`, 40 `warn` and 50 `error`. In development the output can be made readable with `npx pino-pretty`; in production the raw JSON is what log platforms (Grafana Loki, Datadog, ELK) expect.

---

## Database

```sql
CREATE SCHEMA IF NOT EXISTS duties;

-- gen_random_uuid() is built into PostgreSQL 13+
CREATE TABLE IF NOT EXISTS duties.duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 200)
);
```

- **Own schema (`duties`)** keeps the project tables apart from `public`; queries use `duties.duties`.
- **UUID generated by the database**: clients cannot guess other ids or count rows.
- **`CHECK` constraint**: the last line of defense if data is inserted without going through the API.
- **`IF NOT EXISTS`**: the script can be run more than once.
- **Parameterised queries** (`$1`, `$2`): values travel separately from the SQL text, so a name like `'); DROP TABLE duties; --` is stored as plain text.
- **`RETURNING id, name`**: inserts and updates return the final row in the same query.

---

## Tests

```bash
npm test --workspace backend
```

| File | Type | Tests | What it covers |
|---|---|---|---|
| `unit/duties.validation.test.ts` | Unit | 14 | `null`, `undefined`, empty, blank and non-string names, missing body, 200 vs 201 characters, trimming; malformed ids, 36-character strings that are not UUIDs; `validate` throws `AppError` with status 400 |
| `unit/duties.service.test.ts` | Unit | 6 | Service rules with the repository mocked, including 404 on update and delete |
| `integration/duties.routes.test.ts` | Integration | 12 | Real HTTP requests with `supertest` for every endpoint: status codes, bodies, trimmed name sent to SQL, 400 for invalid JSON and ids, 404, 500 without leaking the database error, unknown routes |

- `app.ts` does not call `listen`, so `supertest` can send requests to the app without opening a port.
- In the integration tests everything is real except `pool.query`, which is replaced with `jest.mock`. The tests run without PostgreSQL, but the real SQL is not executed (see next steps).
- `jest.setup.ts` sets a fake `DATABASE_URL` (so `config/env.ts` does not stop the process) and `LOG_LEVEL=silent`.

---

## Adding a new endpoint or entity

**New endpoint** (e.g. `GET /api/duties/:id`):

1. Route: `dutiesRouter.get('/:id', dutiesController.getDuty)`.
2. Controller: validate the id with `dutyIdSchema` and call the service.
3. Service: `getDutyById` throws `AppError(404)` when the repository returns `null`.
4. Repository: `findById` with `SELECT id, name FROM duties.duties WHERE id = $1`.

**New entity** (e.g. `projects`): copy `src/duties/` to `src/projects/`, change the SQL and schemas, add the table to `database/schema.sql` and register the router in `app.ts`. Config, logger, middlewares, `AppError` and `validate` are reused without changes.

---

## Next steps for the backend

- Run the integration tests against a real PostgreSQL (Docker or Testcontainers) with a transaction rolled back per test.
- Versioned migrations instead of a single `schema.sql`.
- Respect the status of known errors in `errorHandler`: a body over 100 KB (`413`) and PostgreSQL `CHECK` violations (`23514`) currently end up as `500`.
- Check `res.headersSent` in the error handler before writing a response.
- Graceful shutdown: handle `SIGTERM` and call `pool.end()`.
- Request id in every log line, `helmet` headers and rate limiting.
- `updated_at`/version column to detect concurrent edits (`409 Conflict`).
- Pagination for `GET /duties` and an index on `name`.
- OpenAPI documentation generated from the zod schemas.
