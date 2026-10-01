# Architecture decisions

## Components and communication

The application is a three-tier web application:

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

**Frontend** (`src/web/`) — Next.js 16 with React 19 and Tailwind CSS. Uses Next.js Server Components to fetch data on the server via `getTasks()`, `createTask()`, and `toggleTask()` functions in `src/web/app/actions.ts`. The frontend is the only public entry point and communicates with the API via HTTP REST calls from server-side code.

**API** (`src/api/`) — Express 5 running on Node.js 22. Provides REST endpoints (`GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `GET /health`) that the frontend calls. Routes are defined in `src/api/index.js` and use a PostgreSQL connection pool.

**Database** (`src/db/`) — PostgreSQL 17 schema managed by node-pg-migrate. Migrations live in `src/db/migrations/` and are run automatically on startup before the API starts.

The frontend and API communicate via HTTP only when running on Docker Compose or in the cloud; locally during development, the web container calls the API container by its service name (`http://api:3001`).

## Data stores

**PostgreSQL 17** is the sole data store. The schema includes:
- `users` table (created by migration `1718500000000_initial-schema.js`) with id, email, and created_at
- `tasks` table (created by migration `1718500001000_create-tasks.js`) with id, title, completed flag, and created_at

The API driver is `pg` (version 8.21.0), which maintains a connection pool. The pool is configured from the `DATABASE_URL` environment variable and is used by all API route handlers in `src/api/index.js`.

## Hosting and deployment

**Local development** uses Docker Compose (`docker-compose.yml`). Four services start in order:
1. `postgres` — PostgreSQL 17 container with health checks
2. `migrate` — runs `node-pg-migrate up` once, then exits
3. `api` — Express server on port 3001 (internal only)
4. `web` — Next.js server on port 3000 (exposed to host)

**Cloud deployment** to Google Cloud Platform uses Terraform (`src/infrastructure/`). The Terraform configuration provisions:

- **VPC and networking**: A custom VPC with subnet, VPC Access Connector (to allow Cloud Run services to reach private resources), and private service access for Cloud SQL
- **Cloud SQL PostgreSQL 17**: Private IP only, managed in the VPC. Tier defaults to `db-f1-micro`. In production, availability is regional and automated backups are enabled; in dev/staging, availability is zonal and backups are disabled. Max connections set to 100.
- **Cloud Run services**: Both API and web frontend run as stateless Cloud Run services
  - API: Internal traffic only (INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER). Min/max instance counts vary by environment (prod: 1–N, dev: 0–N). Runs startup and liveness probes against `/health`.
  - Web: Public traffic (INGRESS_TRAFFIC_ALL). Depends on the API service.
- **Secret Manager**: The database URL is stored as a secret and injected into Cloud Run services
- **Service accounts and IAM**: A Cloud Run service account has roles for Cloud SQL client access and secret access
- **Networking**: Web egress is private-ranges-only; API egress is all-traffic

Environment variables like `environment` (dev/staging/prod), `region` (default: us-central1), `db_tier`, and scaling limits are configurable via Terraform variables.

## Notable libraries and frameworks

- **Next.js 16** and **React 19** — Frontend framework and UI library. TypeScript is configured (`tsconfig.json` with strict mode). The app uses Next.js App Router and Server Components.
- **Express 5** — Lightweight REST API framework on Node.js 22.
- **PostgreSQL 17** — Relational database.
- **node-pg-migrate** — Database migration tool. Runs automatically in the Docker Compose setup.
- **pg** — PostgreSQL driver for Node.js used by both the API and migration service.
- **Tailwind CSS 4** — Utility-first CSS framework. Integrated via PostCSS in `postcss.config.mjs`.
- **Terraform ~5.0** — Infrastructure as code for GCP. Backends to Google Cloud Storage.
- **Google Cloud provider** — Terraform provider for GCP resources (Cloud Run, Cloud SQL, VPC, Secret Manager, Service Accounts).
- **ESLint 9** and **eslint-config-next** — Linting for the frontend. Config in `src/web/eslint.config.mjs` includes core web vitals and TypeScript rules.

The repository does not explicitly state reasons for these choices, except that the app is intentionally a "reference implementation of a three-tier web application" (from README.md).
