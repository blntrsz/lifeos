# api

Effect `HttpApi` server for tasks (backed by `@template/core` `TaskService` + SQLite).

## Run

```bash
# from repo root
export DEEPSEEK_API_KEY=...
mise run dev
```

Server: http://localhost:3001  
OpenAPI UI: http://localhost:3001/docs

## AI

Chat endpoints use DeepSeek's OpenAI-compatible API.

- `DEEPSEEK_API_KEY` is required for real Agent responses.
- `DEEPSEEK_MODEL` defaults to `deepseek-v4-pro`.
- `DEEPSEEK_BASE_URL` defaults to `https://api.deepseek.com`.

## Endpoints

| Method | Path         | Body                 | Response                            |
| ------ | ------------ | -------------------- | ----------------------------------- |
| GET    | `/tasks`     | —                    | `[{ "id", "name" }, …]`             |
| GET    | `/tasks/:id` | —                    | `{ "id", "name" }` (404 if missing) |
| POST   | `/tasks`     | `{ "name": string }` | `{ "id", "name" }`                  |
| PATCH  | `/tasks/:id` | `{ "name": string }` | `{ "id", "name" }` (404 if missing) |
| DELETE | `/tasks/:id` | —                    | 204 (404 if missing)                |

## Example

```bash
curl http://localhost:3001/tasks
curl -X POST http://localhost:3001/tasks -H 'Content-Type: application/json' -d '{"name":"Buy milk"}'
curl -X PATCH http://localhost:3001/tasks/tsk-… -H 'Content-Type: application/json' -d '{"name":"Buy oat milk"}'
curl -X DELETE http://localhost:3001/tasks/tsk-…
```
