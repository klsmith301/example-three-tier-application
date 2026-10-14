# Frontend

The frontend is a Next.js 16 application with React 19 and Tailwind CSS that provides a task manager (to-do list) interface.

## Technology Stack

- **Framework:** Next.js 16.2.9
- **Library:** React 19.2.4
- **Styling:** Tailwind CSS 4 (with PostCSS)
- **Language:** TypeScript 5 (strict mode)
- **Linting:** ESLint 9

## Project Structure

```
src/web/
├── app/
│   ├── page.tsx          # Home page — async Server Component; fetches and renders task list
│   ├── actions.ts        # Server actions for API calls (getTasks, createTask, toggleTask)
│   ├── layout.tsx        # Root layout (Geist fonts, HTML shell)
│   ├── globals.css       # Global styles (Tailwind import + CSS variables)
│   └── favicon.ico
├── public/               # Static SVG assets
├── package.json
├── next.config.ts        # output: "standalone" (required for Cloud Run)
├── tsconfig.json         # strict: true, module: esnext, moduleResolution: bundler
├── eslint.config.mjs     # eslint-config-next core-web-vitals + typescript
└── postcss.config.mjs
```

## Current Features

### Task Display (`page.tsx`)

- `page.tsx` is an **async Server Component**: calls `getTasks()` at render time, no client-side state.
- Renders an unordered list (`<ul>`) of all tasks from the API (no pagination, no filtering, no search).
- Each task row: [checkbox form] [title span] — no delete button in current codebase.
- Completed tasks get `line-through text-zinc-400` styling.
- Completion counter at bottom: "N / M completed".
- Empty state: "No tasks yet. Add one above!" when list is empty.

### Add Task

- A `<form action={createTask}>` with an `<input name="title" required>` field.
- Submits via Next.js Server Action `createTask(formData)`.

### Toggle Task Status

- Each task row has a nested `<form>` with an inline `'use server'` action calling `toggleTask(task.id, !task.completed)`.
- Checkbox button: filled when completed, empty border when not.

## Server Actions (`actions.ts`)

All actions are marked `'use server'` and call the Express API over HTTP.

| Export | HTTP call | Side effect |
|--------|-----------|-------------|
| `getTasks()` | `GET /tasks` | Returns `Task[]`; throws if `!res.ok` |
| `createTask(formData)` | `POST /tasks` | `revalidatePath('/')` |
| `toggleTask(id, completed)` | `PATCH /tasks/:id` | `revalidatePath('/')` |

### `Task` type

```ts
export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};
```

No `archived` field currently. Will need updating when archive feature lands.

### API base URL

```ts
const API_URL = process.env.API_URL || 'http://localhost:3001';
```

### Error handling

- `getTasks()` throws on non-ok response (propagates as unhandled error to page).
- `createTask` and `toggleTask` do not check the fetch response status.

## Styling

- **Color scheme:** Zinc gray palette with dark mode support (`dark:` prefixes).
- **Layout:** `max-w-lg mx-auto`, centered, `py-16 px-4`.
- **Responsive:** Single-column, mobile-friendly.
- **Dark mode:** Uses Tailwind's `dark:` prefix; uses CSS variables for `--background` / `--foreground`.
- **Fonts:** Geist Sans and Geist Mono (loaded via `next/font/google` in `layout.tsx`).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Base URL of the API | `http://localhost:3001` |
| `PORT` | Port for the web server | `3000` |

## Build Notes

- `next.config.ts` sets `output: "standalone"` — required for Docker standalone build (used in `Dockerfile`).
- `Dockerfile` is three-stage: deps → builder → runner. Copies `.next/standalone`, `.next/static`, and `public/` into the runner.
- `npm run lint` runs ESLint; no `npm test` script defined.

## Important: Next.js Version Notes

Per `src/web/AGENTS.md`: "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

URL-based state (search params, pagination) should use Next.js 16 App Router conventions. Server Components are the primary rendering model; client components require `'use client'` directive.
