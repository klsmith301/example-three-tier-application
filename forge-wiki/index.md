# Overview

A reference implementation of a three-tier web application: Next.js frontend, Express REST API, and PostgreSQL database. Runs locally with Docker Compose and deploys to GCP (Cloud Run + Cloud SQL) via Terraform.

## Structure

| Path | Purpose |
|------|---------|
| `src/web/` | Next.js 16 / React 19 / Tailwind CSS frontend |
| `src/api/` | Express 5 / Node.js 22 REST API |
| `src/db/` | node-pg-migrate migrations |
| `src/infrastructure/` | Terraform for GCP provisioning |
| `docker-compose.yml` | Local development stack (postgres, migrate, api, web) |
| `.github/workflows/deploy.yml` | CI/CD: build images → Terraform apply → run migrations |
| `README.md` | Root documentation (Markdown, starts with `# example-three-tier-application`) |

## Key facts

- No test suite is defined at the root level; no `package.json` at root.
- `README.md` first line is currently `# example-three-tier-application` (a Markdown H1).
- The only GitHub Actions workflow is `deploy.yml` (no lint/test workflow).

## Feature pages

- [API](api.md)
- [Backend structure](backend-structure.md)
- [Database](database.md)
- [Frontend](frontend.md)
- [Infrastructure](infrastructure.md)
- [Local development](local-development.md)

## Standing pages

- [Architecture decisions](architecture-decisions.md)
- [Coding standards](coding-standards.md)
- [Known issues](known-issues.md)
