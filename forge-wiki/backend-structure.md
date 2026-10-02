# Backend Structure

Facts about the current state of the Express API (`src/api/`).

## File Inventory

| File | Purpose |
|------|---------|
| `src/api/index.js` | Express application: middleware setup, all route handlers, server startup |
| `src/api/db.js` | PostgreSQL connection pool (exported singleton) |
| `src/api/package.json` | Package manifest and npm scripts |
| `src/api/Dockerfile` | Multi-stage Docker build for the API container |

## Runtime and Dependencies

- **Runtime:** Node.js 22
- **Module system:** CommonJS (`"type": "commonjs"` in `package.json`)
- **Framework:** Express 5.2.1
- **Database driver:** pg 8.21.0

No other runtime dependencies. No dev dependencies, linting tools, or testing frameworks are installed.

## npm Scripts

| Script | Command |
|--------|---------|
| `start` | `node index.js` |
| `dev` | `node --watch index.js` |
| `test` | `echo "Error: no test specified" && exit 1` (placeholder only) |

## Database Module (`db.js`)

Exports a single `pg.Pool` instance:

```js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
module.exports = pool;
```

- Connection string is read from the `DATABASE_URL` environment variable at startup.
- No explicit connection error handling; pool errors are not caught at the module level.
- The pool is shared across all route handlers via `require('./db')`.

## Express Application (`index.js`)

### Middleware

- `express.json()` — parses request bodies as JSON.

### Existing Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{ "status": "ok" }` — a static liveness probe, no database interaction |
| `GET` | `/tasks` | `SELECT * FROM tasks ORDER BY created_at ASC` |
| `POST` | `/tasks` | `INSERT INTO tasks (title) VALUES ($1) RETURNING *` |
| `PATCH` | `/tasks/:id` | Fetches task by id, then `UPDATE tasks SET completed, title WHERE id` |

### Error Handling

- Route handlers for `/tasks` are `async` but have **no try/catch blocks** — unhandled promise rejections propagate directly to Express (Express 5 catches them automatically and returns 500).
- The `/health` handler is synchronous and has no error path.
- 400 is returned for missing/empty `title` on `POST /tasks`.
- 404 is returned when a task is not found on `PATCH /tasks/:id`.

### Server Startup

```js
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
```

## Environment Variables

| Variable | Required | Default | Usage |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string passed to `pg.Pool` |
| `PORT` | No | `3001` | TCP port the server listens on |

## Docker / Compose Integration

- The container is built from `src/api/Dockerfile`.
- In Docker Compose, port 3001 is declared with `expose` (container-internal only; not published to the host).
- The API service depends on the `migrate` service completing successfully before it starts.
- Docker Compose health-checks the API via `GET http://api:3001/health` inside the Compose network.
- `DATABASE_URL` is injected as `postgres://app:app@postgres:5432/app`.

## Testing

No test suite exists. The `npm test` script exits with code 1 and prints a placeholder message. No testing framework (Jest, Mocha, Vitest, etc.) is installed.
