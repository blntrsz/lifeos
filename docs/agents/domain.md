# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This repo uses a multi-context domain documentation layout.

- Read root `CONTEXT-MAP.md` first when it exists. It points to the relevant per-context `CONTEXT.md` files.
- Read each context's `CONTEXT.md` that is relevant to the task.
- Read root `docs/adr/` for system-wide architectural decisions.
- Read `src/<context>/docs/adr/` for context-scoped decisions when working inside a specific context.

If any of these files don't exist, proceed silently. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File Structure

Multi-context repo:

```
/
|-- CONTEXT-MAP.md
|-- docs/adr/                          # system-wide decisions
`-- src/
    |-- ordering/
    |   |-- CONTEXT.md
    |   `-- docs/adr/                  # context-specific decisions
    `-- billing/
        |-- CONTEXT.md
        `-- docs/adr/
```

## Use The Glossary's Vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR Conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because..._
