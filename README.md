# template

Template is a small full-stack TypeScript software factory for building Effect-first products. It demonstrates one complete vertical slice (`Task`) across:

- `packages/core` — domain models, services, persistence, and migrations.
- `apps/api` — Effect `HttpApi` server and OpenAPI/Scalar documentation.
- `apps/web` — TanStack Start + React UI using Effect Atom for client state.
- `packages/rules` — ast-grep rules that encode factory guardrails.

The repository is intentionally optimized for both humans and coding agents: domain context lives in `docs/CONTEXT.md`, architectural decisions live in `docs/adr/`, and agent-specific operating instructions live in `AGENTS.md`.

## Starting a new project

See [`docs/START_NEW_PROJECT.md`](docs/START_NEW_PROJECT.md) for the recommended process to copy this template, rename the workspace/package scope, establish project context, and replace the sample `Task` slice.

## Quick start

Use `mise` for all project tasks.

```bash
mise install
bun install
mise run dev
```

Services:

- Web: <http://localhost:3000>

## Common commands

```bash
mise run dev              # start API (:3001) and web (:3000)
mise run check            # run all repository checks
mise run check:lint       # oxlint
mise run check:ast        # ast-grep guardrails
mise run check:format     # oxfmt --check
mise run check:workspace  # sherif workspace checks
mise run check:deps       # rev-dep dependency boundaries
mise run check:type       # TypeScript build check
```

## Repository map

```text
apps/
  api/                    Effect HttpApi server for the Task slice
  web/                    TanStack Start React app and API proxy route
packages/
  core/                   Domain, services, SQLite repository, migrations
  rules/                  ast-grep rules for shared and Effect-specific patterns
docs/
  CONTEXT.md              Factory language, goals, boundaries, and slice flow
  adr/                    Architecture decision records
AGENTS.md                 Mandatory instructions for coding agents
mise.toml                 Canonical task runner entrypoint
sgconfig.yaml             ast-grep configuration
```
