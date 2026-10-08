# Coding standards

## Languages and tooling

The project uses three main languages and runtimes:

- **JavaScript (Node.js 22)** — API service (`src/api/`) and database migrations (`src/db/`). Package manager: `npm`. No module system specified in `src/api/package.json`, but type is `"commonjs"`, so CommonJS is used.
- **TypeScript 5** — Frontend service (`src/web/`). Configured with strict mode in `src/web/tsconfig.json`. JSX is set to `"react-jsx"`.
- **PostgreSQL 17** — Database, managed by schema migrations.

## Formatting and linting

**Frontend (src/web/)**

- **ESLint 9** with configuration in `src/web/eslint.config.mjs`
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` presets
- Ignores `.next/`, `out/`, `build/`, and `next-env.d.ts`
- Run via `npm run lint` (defined in `src/web/package.json`)

**Tailwind CSS**

- Version 4 configured via `@tailwindcss/postcss` plugin in `src/web/postcss.config.mjs`
- Used throughout the frontend for styling (e.g., `src/web/app/page.tsx`)

**API (src/api/)**

- No linting or formatting tools configured
- Code in `src/api/index.js` and `src/api/db.js` follows no enforced style

**Database (src/db/)**

- Migration files (`src/db/migrations/`) follow node-pg-migrate conventions (exports `up` and `down` functions)

## Tests and their commands

**Frontend (src/web/)**

- `npm run dev` — Start Next.js development server with file watching
- `npm run build` — Build for production
- `npm run start` — Run production build
- `npm run lint` — Run ESLint on the frontend
- No test command defined; `package.json` has no `test` script

**API (src/api/)**

- `npm run test` — Defined but outputs "Error: no test specified" and exits with code 1
- `npm run start` — Run the API server
- `npm run dev` — Run with `node --watch` for development

**Database (src/db/)**

- `npm run migrate` — Run `node-pg-migrate up` to apply pending migrations
- `npm run migrate:down` — Run `node-pg-migrate down` to roll back the last migration
- `npm run test` — Defined but outputs "Error: no test specified" and exits with code 1

No test suites or testing frameworks (Jest, Mocha, Vitest, etc.) are installed in any layer.

## Naming

**Files and directories**

- Lowercase with hyphens: `src/api/`, `src/web/`, `src/db/`, `src/infrastructure/`, `docker-compose.yml`, `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`, `tsconfig.json`
- Next.js components and pages use the `.tsx` extension (e.g., `layout.tsx`, `page.tsx`, `actions.ts`)
- Migration files use timestamps as prefixes: `1718500000000_initial-schema.js`, `1718500001000_create-tasks.js`

**Variables and functions**

- JavaScript/TypeScript use camelCase: `getTasks`, `createTask`, `toggleTask`, `deleteTask`, `revalidatePath`, `pgm` (in migrations)
- Terraform uses snake_case: `project_id`, `app_name`, `subnet_cidr`, `db_tier`, `api_image`, `web_image`

**Database**

- Table names are lowercase plural: `users`, `tasks`
- Column names are lowercase with underscores: `id`, `email`, `created_at`, `title`, `completed`

## Project structure

```
src/
├── api/               # Express REST API (Node.js 22, CommonJS)
│   ├── Dockerfile     # Multi-stage Docker build
│   ├── package.json   # Dependencies: express 5, pg 8
│   ├── index.js       # Route handlers and server startup
│   └── db.js          # PostgreSQL connection pool
├── db/                # Database migrations (node-pg-migrate)
│   ├── Dockerfile     # Runs migration on startup
│   ├── package.json   # Dependencies: node-pg-migrate 8, pg 8
│   └── migrations/    # Migration files with timestamps
│       ├── 1718500000000_initial-schema.js
│       └── 1718500001000_create-tasks.js
├── web/               # Next.js frontend (React 19, TypeScript 5)
│   ├── Dockerfile     # Next.js standalone build
│   ├── package.json   # Dependencies: next 16, react 19, tailwindcss 4
│   ├── tsconfig.json  # TypeScript config (strict mode)
│   ├── eslint.config.mjs  # ESLint 9 config
│   ├── next.config.ts    # Next.js config (output: standalone)
│   ├── postcss.config.mjs # PostCSS / Tailwind config
│   └── app/           # Next.js App Router
│       ├── layout.tsx     # Root layout
│       ├── page.tsx       # Home page (tasks list)
│       ├── actions.ts     # Server actions (getTasks, createTask, toggleTask, deleteTask)
│       └── globals.css    # Global styles
└── infrastructure/    # Terraform for GCP
    ├── main.tf        # VPC, Cloud SQL, Cloud Run, Secret Manager, IAM
    ├── variables.tf   # Input variables (project_id, region, etc.)
    ├── outputs.tf     # Output values (service URLs, etc.)
    └── terraform.tfvars.example  # Example variable values

docker-compose.yml    # Local development orchestration
```
