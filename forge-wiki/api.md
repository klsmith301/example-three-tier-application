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

### Delete a Task

```
DELETE /tasks/:id
```

Permanently deletes a task by its ID. Returns 204 No Content on success.

**Response:** (204 No Content)
```
(empty body)
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
- DELETE: uses `DELETE ... RETURNING id` to verify the task existed

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
npm start
# API listening on port 3001
```

For development with auto-reload:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

Tests use Jest and supertest to verify:
- All CRUD operations on tasks
- Proper HTTP status codes (200, 201, 204, 404, 400)
- Input validation and trimming
- Database operation correctness

## Error Handling

- `200 OK` — Successful read or update
- `201 Created` — Task created successfully
- `204 No Content` — Task deleted successfully
- `400 Bad Request` — Invalid input (missing/empty title)
- `404 Not Found` — Task ID does not exist
- `500 Internal Server Error` — Unexpected server error
