# Duty Desk

A small end-to-end duties manager. The repository contains a React frontend and an Express API backed by PostgreSQL.

## Before you start

- Node.js 20.12 or newer (the backend reads `.env` with Node's built-in `process.loadEnvFile`)
- PostgreSQL 14 or newer

## Start the project

Install everything once from the repository root:

```bash
npm install
```

The root `package.json` is only a workspace runner. It installs the dependencies of both applications and provides shortcuts; the frontend and backend still have their own independent `package.json` files.

Connect to your PostgreSQL server and run `backend/database/schema.sql` against the database you use (the example below uses the default `postgres` database). Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`, for example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

Start both applications with:

```bash
npm run dev
```

Then open <http://localhost:5173>.

To start them separately, use these commands from the root. They work in PowerShell, macOS/Linux terminals and do not depend on Bash syntax:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

## Useful commands

```bash
npm test       # backend and frontend tests (no database needed)
npm run build  # production build of both applications
```

After building, serve the production version with:

```bash
npm start --workspace backend          # runs backend/dist on port 3000
npm run preview --workspace frontend   # serves frontend/dist
```

## API

| Method | Route             | Success | Errors                                     |
| ------ | ----------------- | ------- | ------------------------------------------ |
| GET    | `/api/duties`     | 200     | 500                                        |
| POST   | `/api/duties`     | 201     | 400 invalid name, 500                      |
| PUT    | `/api/duties/:id` | 200     | 400 invalid name or id, 404 not found, 500 |
| DELETE | `/api/duties/:id` | 204     | 400 invalid id, 404 not found, 500         |

Successful responses return the duty (or the list of duties) directly. Errors always look like `{ "error": "message" }` and never include internal database details.

## Architecture

- **Backend:** each feature lives in its own folder with layers `routes → controller → service → repository`. Shared pieces (config, logger, errors, middlewares) are outside the feature, so adding a new entity means adding a new folder and registering its router in `app.ts`. See [backend/README.md](backend/README.md).
- **Frontend:** `components → hooks → services → api-client`. Components only render and handle forms, the hook keeps the state, and the services are the only place that talks to the API. See [frontend/README.md](frontend/README.md).
