# Known issues

## Subject Matter Expert discrepancy

The project owner's guidance indicates Jane Doe should be the current Subject Matter Expert, but the code (forge-wiki/index.md) identifies John Doe as the Subject Matter Expert. These statements contradict each other.

## No TODOs or FIXMEs found

A search of the codebase found no TODO or FIXME comments.

## Test coverage

Both `src/api/package.json` and `src/db/package.json` define a `test` script that outputs "Error: no test specified" and exits with code 1. This indicates that no tests are currently implemented in the API or database layers.

The frontend (`src/web/`) has no `test` script defined in its `package.json`.

No testing frameworks (Jest, Mocha, Vitest, etc.) are installed.

## Other notes

- The frontend uses Next.js standalone output mode (`next.config.ts` sets `output: "standalone"`), which is required for containerization on Cloud Run.
- The PostgreSQL schema includes a `users` table created by the initial migration, but it is not currently used by the application—only the `tasks` table is in use.
- The API has no input validation library; request validation is done inline in route handlers (e.g., checking that `title` is a non-empty string in `POST /tasks`).
- The web frontend sends all API requests from Server Components without error handling; failures to fetch or update tasks will propagate to the user.
