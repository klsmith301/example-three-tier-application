# API

The API is an Express 5 application running on Node.js 22 that provides REST endpoints for task management.

## Technology Stack

- **Framework:** Express 5.2.1
- **Runtime:** Node.js 22
- **Database Driver:** pg 8.21.0 (PostgreSQL)

## Project Structure

```
src/api/
├── index.js          # Express app and route handlers
├── db.js             # PostgreSQL connection pool
├── package.json
└── Dockerfile
```

## Endpoints

### Health Check

```
GET /health
```

Returns a simple health check response. Used for liveness probes in Kubernetes/Cloud Run.

**Response:**
```json
{ "status": "ok" }
```

### List All Tasks

```
GET /tasks
```

Fetches all tasks from the database ordered by creation date.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "completed": false,
    "created_at": "2024-06-16T12:00:00.000Z"
  }
]
```

### Create a Task

```
POST /tasks
```

Creates a new task. The request body must include a non-empty `title` string.

**Request:**
```json
{ "title": "Buy groceries" }
```

**Response:** (201 Created)
```json
{
  "id": 1,
  "title": "Buy groceries",
  "completed": false,
  "created_at": "2024-06-16T12:00:00.000Z"
}
```

**Error:** (400 Bad Request)
```json
{ "error": "title is required" }
```

### Update a Task

```
PATCH /tasks/:id
```

Updates an existing task. Pass `completed` (boolean) or `title` (string) or both to update.

**Request:**
```json
{ "completed": true }
```

**Response:**
```json
{
  "id": 1,
  "title": "Buy more groceries",
  "completed": true,
  "created_at": "2024-06-16T12:00:00.000Z"
}
```

**Error:** (404 Not Found)
```json
{ "error": "Not found" }
```

## Implementation Details

### Database Connection

The API uses a PostgreSQL connection pool (`src/api/db.js`) configured via `DATABASE_URL` environment variable. The pool object is exported directly and used throughout `index.js` with `db.query(...)`.

### Request Handling

- All endpoints expect and return JSON (`express.json()` middleware)
- Tasks are always ordered by `created_at` ascending
- Title values are trimmed of whitespace before storage
- Completed status defaults to `false` for new tasks
- PATCH: fetches the existing row first, then applies partial updates

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | *required* |
| `PORT` | Port to listen on | `3001` |

## Running Locally

```bash
cd src/api
npm install
export DATABASE_URL=postgres://app:app@localhost:5432/app
node index.js
# API available at http://localhost:3001
```
