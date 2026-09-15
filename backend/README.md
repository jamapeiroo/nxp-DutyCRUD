# Backend

Express + TypeScript (strict mode) API that stores duties in PostgreSQL using plain, parameterized SQL (no ORM).

## Setup

1. Run `database/schema.sql` on your PostgreSQL database; it creates the `duties` schema and table.
2. Copy `.env.example` to `.env` and adjust `DATABASE_URL`. The server stops at startup with a clear message if `DATABASE_URL` is missing.
3. From the repository root run `npm install`, then `npm run dev --workspace backend`.

| Variable       | Required | Default                 |
| -------------- | -------- | ----------------------- |
| `DATABASE_URL` | yes      |                         |
| `PORT`         | no       | `3000`                  |
| `FRONTEND_URL` | no       | `http://localhost:5173` |
| `LOG_LEVEL`    | no       | `info`                  |

## Structure

```
src/
├── index.ts                      starts the server
├── app.ts                        creates the express app and registers middlewares and routers
├── config/
│   ├── env.ts                    reads and validates environment variables (zod)
│   └── database.ts               PostgreSQL connection pool
├── duties/
│   ├── duties.routes.ts          URL → controller function
│   ├── duties.controller.ts      reads the request, validates it and sends the response
│   ├── duties.service.ts         business rules (e.g. 404 when the duty doesn't exist)
│   ├── duties.repository.ts      SQL queries
│   ├── duties.validation.ts      zod schemas for the body and the id
│   └── models/duty.model.ts
├── middlewares/
│   ├── cors.middleware.ts
│   ├── request-logger.middleware.ts
│   ├── not-found.middleware.ts
│   └── error-handler.middleware.ts   turns errors into the right HTTP status
├── errors/app-error.ts           error with an HTTP status code
├── logger/logger.ts              structured JSON logs with pino
└── utils/validate.ts             runs a zod schema and throws a 400 error if the data is invalid
```

Each layer only talks to the next one, so a new entity (for example `users/`) follows the same pattern without touching the duties code.

Runtime dependencies are kept to the minimum: `express` (HTTP), `pg` (PostgreSQL driver), `pino` (structured logs) and `zod` (validation schemas).

## Error handling

- Validation errors → `400`
- Duty not found → `404`
- Anything unexpected (e.g. the database is down) → `500` with a generic message. The real error is only written to the logs.

## Tests

```bash
npm test --workspace backend
```

- `unit/duties.validation.test.ts` – empty, blank, too long names and invalid ids
- `unit/duties.service.test.ts` – business rules with the repository mocked
- `integration/duties.routes.test.ts` – real HTTP requests with supertest and status codes; only the database pool is mocked
