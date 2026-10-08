# Delete Task Feature — Current State

This page documents the current implementation of the delete-task feature, as it stands before any removal.

## API (`src/api/index.js`)

A `DELETE /tasks/:id` route handler exists at the bottom of the file, after the PATCH handler:

```js
// DELETE /tasks/:id — delete a task
app.delete('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});
```

- Returns `204 No Content` on success.
- Returns `404 { error: 'Not found' }` if the id does not match any row.

## Frontend server action (`src/web/app/actions.ts`)

The `deleteTask` async function is exported from `actions.ts`:

```ts
export async function deleteTask(id: number) {
  await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
  revalidatePath('/');
}
```

- It is imported at the top of `src/web/app/page.tsx`.

## Frontend UI (`src/web/app/page.tsx`)

- `deleteTask` is imported alongside `getTasks`, `createTask`, and `toggleTask`.
- Each task row includes a `<form>` wrapping a trash-icon `<button>` that calls `deleteTask(task.id)` as a server action:

```tsx
<form
  action={async () => {
    'use server';
    await deleteTask(task.id);
  }}
>
  <button
    type="submit"
    className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
    aria-label="Delete task"
  >
    <svg ...>...</svg>
  </button>
</form>
```

## No automated tests

Neither `src/api/package.json` nor `src/web/package.json` define real test scripts; both echo an error and exit 1.
