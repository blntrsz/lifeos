# Starting a new project from this template

Use this repository as a working seed, not as a package dependency. The template already includes one complete vertical slice (`Task`) so a new product can begin by renaming the workspace, establishing project language, and then replacing or extending the slice.

## 1. Copy the template

```bash
# from the parent directory where the new project should live
cp -R template my-product
cd my-product
rm -rf .git

git init
```

If you are using GitHub's template-repository flow instead, create the repository from the template and clone the generated repository instead of copying the directory.

## 2. Rename the workspace and package scope

Pick a package scope for the new project, then replace the template names.

Files to update first:

- `package.json`
  - change `"name": "template"`.
- `apps/api/package.json`
  - change `"name": "@template/api"`.
  - change internal dependencies from `@template/*` to the new scope.
- `apps/web/package.json`
  - change `"name": "@template/web"`.
  - change internal dependencies from `@template/*` to the new scope.
- `packages/core/package.json`
  - change `"name": "@template/core"`.
- all TypeScript imports that currently reference `@template/*`.
- `README.md` and app-level README files.

A typical replacement looks like this:

```bash
# example: @template/* -> @acme/* and root package name -> acme-product
rg '@template|"name": "template"'
```

Then edit the matches deliberately. Avoid a blind global replace for `template` because prose may need different wording from package names.

## 3. Reinstall and refresh generated metadata

Use `mise` as the task entrypoint and Bun as the package manager.

```bash
mise install
bun install
```

This refreshes `bun.lock` with the new workspace package names.

## 4. Establish project context for humans and agents

Before adding product code, write down the project language and early decisions:

- Create or update `docs/CONTEXT.md` with:
  - the product goal,
  - core domain terms,
  - system boundaries,
  - the first vertical slice to build,
  - non-goals.
- Create `docs/adr/` and add ADRs for important early choices.
- Update `AGENTS.md` with repository-specific instructions beyond the shared requirement to use `mise`.

This repository is designed to be easy for coding agents to navigate when domain context and decisions are explicit.

## 5. Decide what to do with the sample `Task` slice

The current `Task` slice demonstrates the intended architecture across the stack:

- `packages/core/src/domain/task.model.ts`
- `packages/core/src/task/`
- `packages/core/migrations/0001-task.ts`
- `apps/api/src/task/`
- `apps/web/src/task/`

For a new product, choose one of these paths:

1. **Keep it temporarily** as a reference while building the first real slice.
2. **Rename it** to the first real aggregate if the shape is close enough.
3. **Delete it** after creating an equivalent real vertical slice.

When replacing it, keep the same layering pattern:

```text
packages/core       domain model, service interface, persistence, migrations
apps/api            HttpApi schema and handlers
apps/web            client service, Effect Atom state, React UI
```

## 6. Check the project

Run the full validation suite after the rename and after each structural change:

```bash
mise run check
```

For local development:

```bash
mise run dev
```

Expected local services:

- Web: <http://localhost:3000>
- API: <http://localhost:3001>
- API docs: <http://localhost:3001/docs>

## 7. First commit checklist

Before the first commit in the new repository:

- [ ] Root package and workspace package names are renamed.
- [ ] All `@template/*` imports are replaced.
- [ ] `bun.lock` is refreshed.
- [ ] `README.md` describes the new project, not the template.
- [ ] `docs/CONTEXT.md` exists and reflects the new domain.
- [ ] Early ADRs are captured in `docs/adr/` if decisions have been made.
- [ ] The sample `Task` slice is either intentionally kept, renamed, or removed.
- [ ] `mise run check` passes.
