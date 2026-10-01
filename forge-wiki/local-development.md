# Local Development

This guide explains how to run the entire three-tier application locally using Docker Compose.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Engine and Compose)
- Or: Docker Engine with [Compose plugin](https://docs.docker.com/compose/install/linux/)
- Git to clone the repository

## Quick Start

1. **Start the stack:**
   ```bash
   docker compose up --build
   ```

2. **Open the application:**
   - Web frontend: [http://localhost:3000](http://localhost:3000)

3. **Stop the stack:**
   ```bash
   # Keeps postgres_data volume (database persists)
   docker compose down

   # Or delete all data
   docker compose down -v
   ```

## Startup Order

Docker Compose automatically starts services in dependency order:

1. **postgres** — PostgreSQL 17 database service
   - Port: 5432 (internal only)
   - Waits until `pg_isready` returns success
   - Data stored in `postgres_data` volume

2. **migrate** — Database migration runner
   - Runs `node-pg-migrate up` to apply all pending migrations
   - Exits after completion

3. **api** — Express REST API
   - Port: 3001 (internal only, accessible from web container)
   - Connected to postgres via `DATABASE_URL` environment variable
   - Logs show "API listening on port 3001"

4. **web** — Next.js frontend
   - Port: 3000 (exposed to host)
   - Connected to api via `API_URL` environment variable
   - Logs show "ready started server on address ..."

## Services

### postgres

```yaml
image: postgres:17
environment:
  POSTGRES_DB: app
  POSTGRES_USER: app
  POSTGRES_PASSWORD: app
```

- **Connection string:** `postgres://app:app@postgres:5432/app`
- **Volume:** `postgres_data:/var/lib/postgresql/data`

### migrate

Runs database migrations using the custom `src/db/Dockerfile`:

```bash
cd src/db && npm run migrate
```

- Exits after migrations complete (or fails if migrations error)

### api

Runs the Express API using the custom `src/api/Dockerfile`:

```bash
cd src/api && npm start
```

- **Environment variables:**
  - `DATABASE_URL=postgres://app:app@postgres:5432/app`
  - `PORT=3001`
- **Health check:** GET `http://api:3001/health`

### web

Runs the Next.js frontend using the custom `src/web/Dockerfile`:

```bash
cd src/web && npm start
```

- **Environment variables:**
  - `API_URL=http://api:3001` (internal docker network)
- **Port mapping:** 3000:3000 (host:container)

## Common Commands

### Rebuild after code changes

```bash
docker compose up --build
```

The `--build` flag rebuilds all images before starting.

### View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web

# Last 50 lines
docker compose logs --tail=50 api
```

### Execute commands in running containers

```bash
# Connect to database
docker compose exec postgres psql -U app -d app

# Run migrations manually
docker compose exec migrate npm run migrate

# Execute shell in api container
docker compose exec api sh
```

### Remove all data and start fresh

```bash
docker compose down -v
docker compose up --build
```

### Run individual services

```bash
# Start only database and api (not web)
docker compose up postgres api

# Start only database
docker compose up postgres
```

## Check API health inside Compose

Because port 3001 is declared with `expose` in `docker-compose.yml` rather than `ports`, it is reachable only from other containers on the Compose network — not from your host machine. Use `docker compose exec` to run the check inside the `api` container itself:

```bash
docker compose exec api wget -qO- http://localhost:3001/health
```

Expected output:

```json
{"status":"ok"}
```

A few things to note:

- **`localhost` here is the `api` container's own loopback**, not your developer machine. The command runs inside the container, so `localhost:3001` resolves correctly.
- **Port 3001 is internal only.** The `expose: ["3001"]` directive in `docker-compose.yml` makes the port available to sibling containers (e.g. `web`) but does not publish it to the host. Running `curl localhost:3001` directly on your machine will fail.
- **A successful `{"status":"ok"}` response confirms** that the Express server has started and the `/health` endpoint is reachable within the Compose network.

## Development Workflow

### Making Frontend Changes

1. Edit files in `src/web/`
2. Next.js will hot-reload automatically (no rebuild needed)
3. Browser will reflect changes within seconds

### Making API Changes

1. Edit files in `src/api/`
2. The API container watches for changes and restarts
3. Refresh browser to see changes

### Making Database Changes

1. Create a new migration file in `src/db/migrations/`
2. Restart the services:
   ```bash
   docker compose down
   docker compose up --build
   ```
3. The `migrate` service will apply the new migration

### Installing New Dependencies

**Frontend:**
```bash
docker compose run --rm web npm install <package>
docker compose up --build
```

**API:**
```bash
docker compose run --rm api npm install <package>
docker compose up --build
```

**Database (for migrations):**
```bash
docker compose run --rm migrate npm install <package>
docker compose up --build
```

## Debugging

### API not responding

1. Check api container logs:
   ```bash
   docker compose logs api
   ```

2. Verify database connection:
   ```bash
   docker compose exec api sh
   echo $DATABASE_URL
   # Should print: postgres://app:app@postgres:5432/app
   ```

3. Test database directly:
   ```bash
   docker compose exec postgres psql -U app -d app -c "SELECT 1"
   ```

### Web cannot reach API

1. Check web container logs:
   ```bash
   docker compose logs web
   ```

2. Verify API_URL is correct:
   ```bash
   docker compose exec web sh
   echo $API_URL
   # Should print: http://api:3001
   ```

3. Test API from web container:
   ```bash
   docker compose exec web wget -O - http://api:3001/health
   ```

### Database migration failed

1. Check migrate container logs:
   ```bash
   docker compose logs migrate
   ```

2. Check database state:
   ```bash
   docker compose exec postgres psql -U app -d app -c "\d"
   ```

3. Rollback and retry:
   ```bash
   docker compose down -v
   docker compose up --build
   ```

### Port already in use

If port 3000 is already in use:

Edit `docker-compose.yml` and change:
```yaml
ports:
  - "3001:3000"  # Use 3001 on host instead
```

Then open [http://localhost:3001](http://localhost:3001)

## Docker Compose File Reference

Location: `docker-compose.yml` (at repository root)

Key sections:
- **services:** postgres, migrate, api, web
- **volumes:** postgres_data (persistent database storage)
- **networks:** compose creates a default network for inter-service communication
- **build:** custom Dockerfiles in each service directory
- **depends_on:** service startup order
- **environment:** environment variables for each service
- **ports:** exposed ports (only web is exposed to host)
- **healthcheck:** ensures postgres is ready before other services start

## Cleanup

### Remove all containers and volumes

```bash
docker compose down -v
```

### Prune Docker system (advanced)

```bash
# Remove unused images, containers, volumes, networks
docker system prune -a --volumes
```

## Performance Tips

- Run on a local volume (not network storage) for better database performance
- Allocate sufficient Docker memory (at least 2GB recommended)
- Use `docker compose up` without `--build` if images haven't changed
- Consider using Docker Desktop's resource limits appropriately

## Next Steps

- Read the [API](api.md) documentation for endpoint details
- Read the [Frontend](frontend.md) documentation for UI features
- Read the [Infrastructure](infrastructure.md) documentation for production deployment
