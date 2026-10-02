# Frontend

The frontend is a Next.js 16 application with React 19 and Tailwind CSS that provides a task manager (to-do list) interface.

## Technology Stack

- **Framework:** Next.js 16.2.9
- **Library:** React 19.2.4
- **Styling:** Tailwind CSS 4 (with PostCSS)
- **Language:** TypeScript 5
- **Linting:** ESLint 9

## Project Structure

```
src/web/
├── app/
│   ├── page.tsx          # Home page (task list UI)
│   ├── actions.ts        # Server actions for API calls
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   └── favicon.ico
├── public/               # Static assets
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── postcss.config.mjs
```

## Features

### Task Display

The home page displays a list of all tasks fetched from the API. Each task shows:
- A checkbox to mark the task as complete/incomplete
- Task title text
- Strikethrough styling for completed tasks
- A delete button (trash icon) to permanently remove the task
- Completion counter at the bottom (e.g., "2 / 5 completed")

### Add Task

Users can add new tasks using a text input and submit button form. The input is required and tasks are trimmed of whitespace before submission.

### Toggle Task Status

Clicking the checkbox on a task toggles its `completed` status via a server action without leaving the page.

### Delete Task

Clicking the trash icon on a task permanently removes it from the database. The delete button is styled with a neutral gray color that turns red on hover for visual feedback. The page updates automatically after deletion.

## Server Actions

The app uses Next.js Server Actions (defined in `app/actions.ts`) to communicate with the API:

- **`getTasks()`** — Fetches all tasks from `/tasks` endpoint
- **`createTask(formData)`** — Creates a new task via `/tasks` POST endpoint
- **`toggleTask(id, completed)`** — Updates task completion status via `/tasks/:id` PATCH endpoint
- **`deleteTask(id)`** — Deletes a task via `/tasks/:id` DELETE endpoint

The `API_URL` environment variable controls the API endpoint (default: `http://localhost:3001`).

## Styling

- **Color scheme:** Zinc gray palette with dark mode support
- **Responsive:** Mobile-friendly with max-width constraints
- **Transitions:** Smooth color transitions on hover and focus
- **Dark mode:** Uses Tailwind's `dark:` prefix for light/dark variants
- **Delete button:** Gray (zinc-400) by default, red (red-500) on hover

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Base URL of the API | `http://localhost:3001` |

## Running Locally

```bash
cd src/web
npm install
npm run dev
# Open http://localhost:3000
```

For development with hot reload:
```bash
npm run dev
```

To build for production:
```bash
npm run build
npm start
```
