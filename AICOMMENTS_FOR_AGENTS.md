# AI Comments — Agent Guide

This file is **for AI coding agents**.

It defines how to recognize, interpret, and act on **AI Comments**.
You can copy this file into another repository and point your agent at it (system prompt / agent config / repo instructions).

## 1) Recognition (canonical form)

An AI Comment is a normal comment with a distinctive wrapper:

```c
/*[ <payload> ]*/
```

Conceptually, it’s “a normal comment containing a bracketed payload”: the host language’s comment delimiter plus a `[` … `]` wrapper around the payload.

**Portable wrappers (treat as equivalent):**

```text
//[ <payload> ]   (C/C++/JS/TS/Java/etc line comments)
# [ <payload> ]   (Python / YAML / TOML)
-- [ <payload> ]  (Lua / SQL)
; [ <payload> ]   (INI-style configs)
```

If a repository defines a different wrapper, prefer the repo’s convention, but keep the same prefix semantics.

Recommended detection patterns (for tooling/agents):

```text
Block:  /\/\*\[\s*([\s\S]*?)\s*\]\*\//
Line:   /^\s*(?://|#|--|;)\s*\[\s*(.*?)\s*\]\s*$/
```

Inside the brackets, the payload may start with an optional **prefix operator**:

- No prefix: intent/context
- `?` (rationale)
- `~` (rule/invariant)
- `>` (instruction)
- `:` (completed instruction)

**Formatting rule:** if a prefix operator is present, it must be followed by a space:

- ✅ `/*[ > Do this ]*/`
- ✅ `/*[ ? Constraint… ]*/`
- ❌ `/*[ >Do this ]*/`

Robustness: if you encounter the missing-space form in the wild, treat it as equivalent, but prefer to normalize it to `"<op><space>"` when editing the comment.

## 2) Checklist (required)

When working in a codebase that uses AI Comments, follow this checklist:

- Detect AI Comments by the wrapper `/*[ ... ]*/` (or project-defined equivalents).
- If an operator is present, ensure it is followed by a space (normalize `>Do` → `> Do`).
- Treat `~` as requirements: fix violations or flag them clearly.
- Treat `?` as rationale/constraints: preserve and respect during edits.
- Treat `>` as tasks: implement, then flip to `:` and ask whether to delete.
- Treat `:` as completed: do not revert; optionally recommend cleanup.
- If your changes make an AI Comment untrue, update or remove it.

## 3) Semantics and required behavior

### No prefix (intent/context)

Treat these as high-signal documentation. Use them to understand what the code is supposed to do.

- Prefer these over guessing intent.
- If you change behavior, update the comment or remove it if it becomes misleading.

### `?` Rationale / constraint context

These explain **why** the code is written a certain way.

- Preserve and consider them during refactors.
- Avoid changes that violate the stated constraint.
- If you propose a change that affects the constraint, explicitly mention the `?` comment in your rationale.

### `~` Rule / invariant

These are requirements.

- Prefer rules that are checkable (inputs/outputs/side effects). If it can’t be made concrete, consider using `?` rationale or a no-prefix intent comment instead.
- If the code violates a `~` rule, you must **surface it clearly**.
- If you are asked to implement or modify code near a `~` rule, treat satisfying the rule as a hard requirement unless the user explicitly overrides it.

When reporting a violation, include:
- file path and approximate location (function/block)
- the rule text
- what the code currently does that violates it
- your proposed fix (or why it can’t be fixed safely)

### `>` Instruction / task

These are actionable instructions from a human (or earlier agent) to you.

- Treat each `>` as a task with priority.
- Implement it with minimal, targeted changes.
- After completion, replace the leading `>` with `:` (keep the rest of the text the same).
- After flipping to `:`, ask the operator whether they want the completed comment deleted.
- Recommend frequent cleanup of lingering `>` and completed `:` (for example, during PR review).

If the instruction is ambiguous or risky:
- ask a clarifying question before making changes
- or propose a safe interpretation and explicitly confirm

### `:` Completed instruction

This indicates the instruction has been carried out.

- Do not revert it to `>`.
- It may be left in place as a breadcrumb, but you should ask whether to delete it after completion.

## 4) Editing rules (to keep comments useful)

- Do not add long explanations inside AI Comments; keep them short and high-signal.
- One AI Comment should express one idea.
- Avoid secrets and sensitive data.
- Preserve text verbatim when switching `>` → `:` (only change the operator).
- If your code changes make an AI Comment untrue, update or remove it.

## 5) Association and prioritization (practical heuristics)

When reasoning about code, associate AI Comments with the nearest relevant scope:

- Comments immediately above a function/class/block apply to that unit.
- Inline comments apply to the next statement or the surrounding small block.
- AI Comments should appear **immediately before** the entity they describe (method definition, class declaration, code block, etc).

Coverage guidance:

- Ideally, add AI Comments to **all critical or complex methods**.
- Also comment small methods when they are **high-signal** (important behavior, tricky logic, subtle constraints).
- Skip AI Comments for small and trivial methods.

Small examples (format only):

```ts
//[ ? Allocating in hot path is slow ]
function renderFrameNoAlloc() { /* ... */ }

//[ ~ Must return cached value when key is unchanged ]
class Cache { /* ... */ }
```

Prioritization rules:

1. `~` rules are constraints you must satisfy (or flag).
2. `?` rationales are constraints you must respect.
3. `>` instructions are tasks you must execute.
4. No-prefix comments are intent and helpful context.

If two AI Comments conflict, do not guess: surface the conflict and ask what should win.

## 6) Generating AI Comments (when asked)

If the operator asks you to add AI Comments:

- Default: add **1–3 `~` rules** (invariants) for the function/area.
- If the code has more quirks/constraints than fit into 1–3 rules, you may go up to **5 total AI Comments**, where:
  - **1–3** are `~` rules (checkable invariants)
  - up to **2** are `?` rationales (non-obvious constraints)
- Optionally add **one** no-prefix summary if it materially improves understanding.
- Prefer concrete wording (inputs/outputs, side effects, limits).

Avoid:
- restating obvious code
- long narrative prose
- speculative claims

## 7) Recommended reporting format

When you finish a change (or analysis), report AI Comment-related outcomes separately:

- `AI Comments: rules` — list any `~` violations found or fixed
- `AI Comments: instructions` — list any `>` executed and flipped to `:`
- `AI Comments: rationales` — call out any `?` constraints that influenced the approach

## 8) Multi-language wrappers (optional)

The canonical wrapper is `/*[ ... ]*/`. If the host language can’t express it, a project may define equivalents (for example `# [ ... ]`, `// [ ... ]`).

Regardless of wrapper, keep the same prefix semantics and the required space after the operator.
