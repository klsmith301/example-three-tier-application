# Example Three-Tier Application

A reference implementation of a three-tier web application: a Next.js frontend, an Express REST API, and a PostgreSQL database. It runs locally with Docker Compose and deploys to Google Cloud Platform (Cloud Run + Cloud SQL) via Terraform.

## Subject Matter Expert

**Jane Doe** is the Subject Matter Expert (SME) for this application. If you have questions about the architecture, deployment, or any aspect of this three-tier application, please reach out to Jane.

## Architecture

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Next.js 16, React 19, Tailwind CSS | `src/web/` |
| API | Express 5, Node.js 22 | `src/api/` |
| Database | PostgreSQL 17 | managed by Docker / Cloud SQL |
| Migrations | node-pg-migrate | `src/db/` |
| Infrastructure | Terraform (GCP) | `src/infrastructure/` |

The app is a simple task manager (to-do list) that demonstrates how the three tiers communicate.

## Documentation

- [Architecture Decisions](architecture-decisions.md) — Components, data stores, hosting, and libraries
- [Coding Standards](coding-standards.md) — Languages, tooling, formatting, testing, naming, and project structure
- [Known Issues](known-issues.md) — TODOs, FIXMEs, failing tests, and documented limits
- [Frontend](frontend.md) — Next.js web application with React and Tailwind CSS
- [API](api.md) — Express REST API with Node.js
- [Database](database.md) — PostgreSQL schema and migrations
- [Infrastructure](infrastructure.md) — Terraform deployment to Google Cloud Platform
- [Local Development](local-development.md) — Running with Docker Compose

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Local

```bash
docker compose up --build
# Open http://localhost:3000
```

Once running, you can:
- View all tasks at http://localhost:3000
- Add new tasks using the input form
- Toggle task completion with checkboxes

### Deploy to GCP

```bash
cd src/infrastructure
terraform init -backend-config="bucket=YOUR_BUCKET" -backend-config="prefix=terraform"
terraform apply \
  -var="project_id=my-project" \
  -var="api_image=gcr.io/my-project/api:latest" \
  -var="web_image=gcr.io/my-project/web:latest"
```

For detailed deployment instructions, see [Infrastructure](infrastructure.md).

## Cleanup

```bash
# Stop containers (keeps the postgres_data volume)
docker compose down

# Stop and delete all data
docker compose down -v
```
