# web

TanStack Start app with an **Effect Atom** vertical slice for tasks (full CRUD).

## Layout (mirrors `@template/core`)

```
src/
  task/
    task.atoms.ts
    task-board.tsx
    task-row.tsx
    task.errors.ts
    service/task.service.ts
    layer/http-task.service.ts
```

## Run

```bash
# from repo root — API :3001 + web :3000
mise run dev
```

Web proxies `/api` → the API. Create, edit, and delete tasks in the UI.

## API mapping

| UI action   | HTTP                    |
| ----------- | ----------------------- |
| Load list   | `GET /api/tasks`        |
| Add         | `POST /api/tasks`       |
| Edit → Save | `PATCH /api/tasks/:id`  |
| Delete      | `DELETE /api/tasks/:id` |
