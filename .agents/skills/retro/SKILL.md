---
name: retro
description: "Turns durable feedback from the current conversation, PR comments, or document comments into guardrails: lint rules, ast-grep rules, or docs/LESSONS.md updates. Use when the user asks for a retro or explicitly wants to convert recurring/durable feedback or review comments into rules, guardrails, or lessons."
license: MIT
---

# Retro

Gather feedback from the pointed source and convert recurring or durable themes into the most durable improvement: a lint rule, an ast-grep rule, or a `docs/LESSONS.md` lesson. Do not create guardrails for one-off fixes that are unlikely to recur.

## Quick start

- No source specified: use the current conversation as the feedback source.
- PR specified: gather PR description, review comments, issue comments, and review summaries using available repo tooling such as `gh pr view` and `gh api`.
- Document specified: gather the document text and its comments/annotations when accessible. If comments are not accessible, ask for the comment export or access method.

## Workflow

1. Identify the source
   - Prefer explicit targets: PR URL/number, document path/URL, or selected conversation segment.
   - If ambiguous, ask one clarifying question.
   - Record source links or stable references for every feedback item when possible.

2. Normalize feedback
   - Extract only actionable feedback: corrections, repeated review themes, rejected approaches, maintainability complaints, missed conventions, and user preferences.
   - Group duplicates and near-duplicates before deciding on artifacts.
   - Ignore praise, one-off taste comments, one-off fixes unlikely to recur, and feedback already fully covered by existing tooling/docs unless the existing guardrail needs improvement.

3. Apply the durability gate
   - For each theme, ask: is this likely to recur, expensive enough to prevent, or important enough that future agents/developers need the lesson?
   - If the answer is no, create no artifact; report it as intentionally ignored or route it back to ordinary implementation/review fixes.
   - If the theme is already covered by a precise existing guardrail, do not duplicate it; improve the existing guardrail only when it failed.

4. Choose the artifact per durable feedback theme
   - Prefer an automated guardrail when it can be precise and low-noise.
   - **New lint rule**: use when the issue is semantic, style/configuration based, or already supported by the project's linter ecosystem.
   - **ast-grep rule**: use when the issue is a local syntax/AST pattern that is not covered well by a normal linter.
   - **`docs/LESSONS.md` update**: use when the lesson is contextual, judgment-based, process-oriented, domain-specific, or too noisy to enforce automatically.
   - Do not create all three for the same issue. If multiple independent themes exist, create one best artifact for each durable theme.

5. Implement or draft the change
   - First inspect existing lint, formatter, ast-grep, test, and docs conventions.
   - Extend existing tooling/configuration instead of introducing a new tool without confirmation.
   - For lint or ast-grep rules, include positive/negative examples or tests when the repo has a place for them, then run the narrowest relevant validation command.
   - For lessons, update `docs/LESSONS.md` directly.

## `docs/LESSONS.md` rules

`docs/LESSONS.md` is the durable fallback for lessons that cannot be captured by lint or ast-grep.

- Create `docs/LESSONS.md` if it does not exist.
- Keep the whole file at **200 physical lines or fewer**.
- Store exactly one lesson per line; no headings or prose blocks. Preserve the existing line style; if creating the file, use markdown bullet lines.
- Each lesson must be concise and should include a source link/reference when available.
- Never add duplicate lessons. Merge overlapping lessons instead.
- Before adding a lesson at the limit:
  1. Merge duplicate or overlapping existing lessons.
  2. If still over 200 lines, remove the lowest-value lesson and add the new one.
- Lowest-value lessons are narrow one-offs, obsolete, speculative, already enforced elsewhere, superseded by another lesson, or least likely to matter in future work.

## Output

Report:

- Feedback sources inspected.
- Decision table: feedback theme → durability decision → chosen artifact or no artifact → why.
- Files changed and validation commands run.
- Any feedback that was intentionally ignored as duplicate, unactionable, or already enforced.
