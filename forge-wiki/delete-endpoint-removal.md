# DELETE Endpoint Removal - Analysis

## Current State

### API (`src/api/index.js`)
- Has `DELETE /tasks/:id` endpoint (lines 42-50) that permanently deletes a task
- Returns 204 No Content on success, 404 if task not found
- Implementation: parses ID, queries `DELETE FROM tasks WHERE id = $1`, checks rowCount

### Frontend Server Actions (`src/web/app/actions.ts`)
- Has `deleteTask(id: number)` function (lines 36-38)
- Calls `DELETE /tasks/:id` endpoint
- Calls `revalidatePath('/')` to refresh page

### Frontend UI (`src/web/app/page.tsx`)
- Imports `deleteTask` function (line 1)
- Renders delete button form in task list (lines 59-69)
- Delete button: trash icon SVG, styled with text-zinc-400 hover:text-red-500
- Each task has a form that calls `deleteTask(task.id)` on submit

## Files to Modify
1. `src/api/index.js` — Remove DELETE route handler
2. `src/web/app/actions.ts` — Remove deleteTask function
3. `src/web/app/page.tsx` — Remove deleteTask import, remove delete button form and UI

## Test Commands
- API: `npm test` (currently disabled, would return error)
- Web: `npm test` (currently no test command)
- Docker Compose: `docker compose up --build`
