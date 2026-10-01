# Database

The database is PostgreSQL 17 managed by Docker Compose locally and Cloud SQL in production.

## Technology Stack

- **Database:** PostgreSQL 17
- **Migration Tool:** node-pg-migrate 8.0.4
- **Node.js:** 22

## Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

The users table is defined but currently not used by the application. It serves as a placeholder for future user authentication features.

### Tasks Table

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Stores individual tasks with:
- **id:** Auto-incrementing primary key
- **title:** Task description (up to 500 characters)
- **completed:** Boolean flag (defaults to false)
- **created_at:** Timestamp of creation (auto-set to current time)

## Migrations

Migrations live in `src/db/migrations/` and use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

### Migration Files

| Timestamp | File | Description |
|-----------|------|-------------|
| `1718500000000` | `initial-schema.js` | Creates the `users` table |
| `1718500001000` | `create-tasks.js` | Creates the `tasks` table |

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
- **User:** Auto-generated (stored in Secret Manager)
- **Password:** Auto-generated (stored in Secret Manager)
- **Database:** `app`
- **Connection String:** Stored in Secret Manager, injected as environment variable

## Backup & Recovery

### Local

Data persists in the `postgres_data` Docker volume. To reset:
```bash
docker compose down -v  # Delete volume
```

### Production (Cloud SQL)

Backups are automatically enabled in `prod` environment:
- **Backup frequency:** Once per 24 hours
- **Backup time:** 03:00 UTC
- **Retention:** Default Cloud SQL retention policy

To restore from a backup, use the GCP Console or `gcloud sql backups`.

## Performance

### Indexing

Currently, only the primary key is indexed. Add indexes as needed:

```sql
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

### Connection Pooling

The API uses a PostgreSQL connection pool from the `pg` library with default settings. For production deployments, tune pool size via environment variables or modify `src/api/db.js`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (used during migrations and by API) |
| `PGPASSWORD` | PostgreSQL password (sometimes needed for `psql` commands) |
