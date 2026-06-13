---
name: review
description: Reviews current worktree, branch diffs, or PR changes for correctness, spec fit, documented standards, and strict maintainability/code-quality risks. Use when user asks to review current changes, a PR, a branch, "review since X", "code quality audit", or wants harsh/thermonuclear feedback.
license: MIT
---

# Review

Run a high-signal review of current changes or a PR. Separate findings by axis; don't let "works" hide spec misses or structural regressions.

Default to review-only: do not modify project files unless the user explicitly asks for fixes/autofix or assigns you a writer/fix role.

## Quick start

- If user says "review current changes": inspect unstaged/staged diff against `HEAD`, including untracked files.
- If user says "review since X": compare `X...HEAD`.
- If user gives a PR: fetch/checkout/inspect the PR diff and compare to the PR base.
- If user asks for a whole-codebase "code quality audit" without a diff/branch/PR target: scope the audit explicitly across key entrypoints, architecture seams, tests, docs, and known hotspots; report that no diff baseline is available.
- If the base is ambiguous, ask one question: "Review against current uncommitted changes, a branch/commit, a PR, or a whole-codebase audit?"

## Workflow

1. Pin comparison
   - Worktree: `git status --short`, `git diff HEAD --`, `git diff --cached --` when staged changes need separate attention, and `git ls-files --others --exclude-standard` to enumerate untracked files. Inspect untracked file contents when they are in scope because normal diffs omit them.
   - Branch/fixed point: `git diff <base>...HEAD` and `git log <base>..HEAD --oneline`.
   - PR URL/number: use available repo tooling, such as `gh pr diff`, `gh pr view`, or fetching the PR branch, and record base/head.
   - Whole-codebase audit: record the requested scope, directories inspected, skipped areas, and the absence of a comparison baseline.
   - Prefer three-dot diffs for branches/PRs. Don't mutate the user's worktree unless needed; ask before checkout if it would disrupt them.

2. Collect context
   - Standards: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/adr/`, `docs/**/CONTEXT.md`, `STYLE*`, `STANDARDS*`, formatter/linter/type configs. Note machine-enforced rules but don't re-report what tooling already catches.
   - Spec: issue/PR description, linked issue refs in commits/branch/PR, user-provided path, `docs/`, `specs/`, `.scratch/`, matching initiative files, or BDD feature files under `features/**/*.feature`. When BDD exists, treat scenarios as the behavioral contract. If no spec exists, mark Spec as "not available"; don't invent requirements.
   - Architecture: nearby code, canonical helpers, ownership boundaries, and patterns the diff extends.

3. Review in parallel when available
   - **Standards**: violations of documented repo conventions, with standard citations.
   - **Spec**: missing, partial, wrong, or scope-creep behavior, with spec citations.
   - **Correctness**: functional bugs, regressions, edge-case failures, data loss, race/error handling issues, or behavior that is wrong even when no explicit spec covers it.
   - **Maintainability**: strict structural review focused on simplicity, abstraction quality, boundary cleanliness, and codebase health.

   If subagents are unavailable, run the same axes sequentially while keeping notes separate.

4. Validate important claims
   - Run targeted tests, typechecks, or linters when cheap and relevant.
   - For large diffs, inspect changed files and surrounding canonical implementations, not just hunks.
   - Check file sizes when a changed file approaches or crosses 1000 lines.
   - Keep validation read-only unless fix mode was explicitly requested.

## Maintainability bar

Be ambitious. Search for code-judo moves: behavior-preserving reframings that delete concepts, branches, wrappers, modes, or layers.

Flag aggressively:

- A file crosses from under 1000 lines to over 1000 lines without a strong structural reason.
- Ad-hoc conditionals or feature checks are scattered through shared or busy flows.
- A simpler model or ownership boundary could make branches disappear.
- Logic lives in the wrong layer/package or duplicates a canonical helper.
- Thin wrappers, magical generic mechanisms, cast-heavy/`any`/`unknown` contracts, or unnecessary optionality obscure invariants.
- Copy-paste, partial-update orchestration, or avoidably sequential async flow makes code harder to reason about.

Prefer remedies that delete complexity: move logic to the canonical owner, extract focused helpers/modules, make typed boundaries explicit, collapse duplicate branches, replace special cases with a default flow, or decompose large files.

## Output

Use this shape:

```md
## Summary
[1-3 sentences: overall risk, approval/blocking recommendation]

## Findings
- [BLOCKER|MAJOR|MINOR] [Axis: Standards|Spec|Maintainability|Correctness] path:line
  What is wrong, why it matters, and the concrete change requested.
  Cite standard/spec/source when applicable.

## Axis notes
### Standards
[pass/no standards found/findings count/key notes]
### Spec
[pass/no spec available/findings count/key notes]
### Correctness
[pass/findings count/key functional risks]
### Maintainability
[structural judgement and biggest code-judo opportunity]

## Checks run
[commands/results, or "not run"]
```

Keep feedback high-conviction. Don't bury structural problems in nits. Do not approve merely because behavior appears correct; approve only when there is no clear structural regression, spec miss, or documented-standard violation. In normal review mode, return requested changes instead of applying them.
