# Database

The database is PostgreSQL 17 managed by Docker Compose locally and Cloud SQL in production.

## Technology Stack

- **Database:** PostgreSQL 17
- **Migration Tool:** node-pg-migrate 8.0.4
- **Node.js:** 22

## Schema (current)

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Defined in `1718500000000_initial-schema.js`. Currently not used by the application.

### Tasks Table

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Defined in `1718500001000_create-tasks.js`. Stores individual tasks.

- **id:** Auto-incrementing primary key. Only index currently present.
- **title:** Task description (up to 500 characters, NOT NULL).
- **completed:** Boolean flag (NOT NULL, defaults to false).
- **created_at:** Timestamp of creation (auto-set, NOT NULL).
- **No `archived` column exists yet** — needed for the archive/unarchive feature.
- **No text-search index exists yet** — needed for title search.
- **No additional composite index on `(created_at, id)` exists yet** — needed for stable pagination.

## Migrations

Migrations live in `src/db/migrations/` and use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

### Migration Files (current)

| Timestamp | File | Description |
|-----------|------|-------------|
| `1718500000000` | `initial-schema.js` | Creates the `users` table |
| `1718500001000` | `create-tasks.js` | Creates the `tasks` table |

Migrations are **append-only** (per `agents.md`). Never edit an existing migration; create a new file.

### Running Migrations

Locally with Docker Compose (automatic):
```bash
docker compose up
```

The `migrate` service runs all pending migrations on startup.

Manually:
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npm run migrate
```

Rollback the last migration:
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npm run migrate:down
```

### Migration Rollback Safety

Each migration **must** export both `up` and `down` functions so `npm run migrate:down` can safely revert.

## Connection Details

### Local (Docker Compose)

- **Host:** `postgres` (internal Docker network)
- **Port:** `5432`
- **User:** `app`
- **Password:** `app`
- **Database:** `app`
- **Connection String:** `postgres://app:app@postgres:5432/app`

### Production (Cloud SQL)

- **Host:** Private IP within VPC
- **Port:** `5432`
- **User/Password:** Auto-generated, stored in Secret Manager
- **Database:** `app`
- **Connection String:** Stored in Secret Manager, injected as environment variable

## Performance

### Indexing

Currently only the primary key (`id`) is indexed. The API orders tasks by `created_at ASC`; no index on `created_at` exists. For pagination and search, additional indexes will be needed.

### Connection Pooling

The API uses a default `pg.Pool`. Pool size is not explicitly configured.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (used during migrations and by API) |
