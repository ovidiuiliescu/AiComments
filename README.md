# AI Comments

A lightweight comment convention for better human–AI collaboration in codebases.

**Status:** Concept / draft convention (tooling can come later)

## Table of Contents

- [What are AI Comments?](#what-are-ai-comments)
- [Why?](#why)
- [The Convention](#the-convention)
- [Examples](#examples)
- [Where can AI Comments appear?](#where-can-ai-comments-appear)
- [Equivalents for other languages](#equivalents-for-other-languages)
- [Writing good AI Comments](#writing-good-ai-comments)
- [For AI Agents](#for-ai-agents)
- [FAQ](#faq)
- [License](#license)

## What are AI Comments?

AI Comments are regular code comments written in a recognizable wrapper format:

```c
/*[ ... ]*/
```

The wrapper makes them easy for AI agents to detect and prioritize, while staying readable for humans.
The goal is to embed *intent* and *actionable guidance* close to the code, without inventing a heavy spec.

## Why?

- Improve collaboration between humans and AI agents
- Improve token efficiency by highlighting important intent
- Speed up codebase understanding (humans and agents)
- Keep code and intent in sync by detecting drift
- Enable quick “maps” of behavior, invariants, and TODOs

## The Convention

### Canonical form

```c
/*[ <payload> ]*/
```

The `<payload>` is plain text. Optionally, the first character can be a control prefix that gives the comment special meaning.

If a prefix is used, write it followed by a space (for example: `/*[ > Do this ]*/`, `/*[ ~ Must always hold ]*/`).

### Meaning of prefixes

| Prefix | Meaning | Expected agent behavior |
|-------:|--------|-------------------------|
| *(none)* | Context / intent | Use as high-signal documentation for understanding “what/why”. |
| `?` | Rationale / constraint context | Preserve and consider before refactors; avoid changes that violate the stated constraint. |
| `~` | Rule / invariant | If code doesn’t match the rule, flag it clearly. |
| `>` | Instruction / task | Treat as actionable instruction; after completing, switch `>` to `:`. |
| `:` | Completed instruction | Indicates the task is done; agent should ask whether to delete it. |

Notes:
- The goal is “obvious to humans, machine-detectable for agents”.
- Keep comments short and specific; prefer one idea per comment.

## Examples

The snippets below use simple pseudo-code so the idea stays language-neutral.

### 1) Intent (no prefix)

Use an un-prefixed AI Comment for high-signal intent: what the code does and what shape of behavior callers should rely on.

```text
/*[ Parse and validate raw input into a Request object. ]*/
function parseRequest(rawText) {
    text = trim(rawText)

    if (text == "") {
        return { ok: false, error: "empty_input" }
    }

    return { ok: true, value: text }
}
```

### 2) Rationale / constraint context (`?`)

Use `?` when the code looks “weird on purpose” because of a non-obvious constraint.

```text
function formatMessage(userText) {
    message = "user=" + sanitize(userText)

    /*[ ? Upstream transport has a fixed 512-char buffer; truncate to avoid overflow. ]*/
    if (length(message) > 512) {
        message = substring(message, 0, 512)
    }

    return message
}
```

### 3) Rule / invariant (`~`)

Use `~` for rules the code must follow. Agents should flag when the implementation drifts from the rule.

**Violation (should be flagged):**

```text
/*[ ~ If input is invalid, return { ok: false } without side effects. ]*/ // <- This will get flagged
function process(input, store) {
    store.write({ event: "process_called", input })

    if (!isValid(input)) {
        return { ok: false, error: "invalid_input" }
    }

    // ... normal processing ...
    return { ok: true }
}
```

**Fixed (rule satisfied):**

```text
/*[ ~ If input is invalid, return { ok: false } without side effects. ]*/
function process(input, store) {
    if (!isValid(input)) {
        return { ok: false, error: "invalid_input" }
    }

    store.write({ event: "process_called", input })
    return { ok: true }
}
```

### 4) Instruction (`>`) becomes completed (`:`)

Use `>` to ask an agent to make a specific change. After the agent completes it, it should flip `>` to `:` and ask whether you want the completed comment removed.

**Before (agent instruction):**

```text
function buildReport(items) {
    /*[ > If items is empty, return an empty report (no logging). ]*/
    reportText = render(items)
    return { ok: true, report: reportText }
}
```

**After (agent executed it):**

```text
function buildReport(items) {
    /*[ : If items is empty, return an empty report (no logging). ]*/
    if (items.length == 0) {
        return { ok: true, report: "" }
    }

    reportText = render(items)
    return { ok: true, report: reportText }
}
```

### 5) Agent-generated AI Comments

AI Comments can also be added by an agent when asked (for example: “add AI Comments that document the invariants and constraints here”).

**Before (no AI Comments):**

```text
function getUserProfile(userId, cache, db) {
    cached = cache.get("user:" + userId)
    if (cached != null) {
        return { ok: true, profile: cached }
    }

    row = db.queryOne("SELECT * FROM users WHERE id = ?", userId)
    if (row == null) {
        return { ok: false, error: "not_found" }
    }

    profile = mapRowToProfile(row)
    cache.set("user:" + userId, profile, ttlSeconds = 30)
    return { ok: true, profile }
}
```

**After (agent adds AI Comments):**

```text
/*[ Fetch a user profile by id; prefer cache; return { ok: false } when missing. ]*/
/*[ ? Cache TTL is 30s to reduce DB load; slight staleness is acceptable. ]*/
/*[ ~ Never cache a missing user (avoid caching null / not_found). ]*/
function getUserProfile(userId, cache, db) {
    cached = cache.get("user:" + userId)
    if (cached != null) {
        return { ok: true, profile: cached }
    }

    row = db.queryOne("SELECT * FROM users WHERE id = ?", userId)
    if (row == null) {
        return { ok: false, error: "not_found" }
    }

    profile = mapRowToProfile(row)
    cache.set("user:" + userId, profile, ttlSeconds = 30)
    return { ok: true, profile }
}
```

### 6) Regular comments and AI Comments together

Regular comments can be detailed and human-friendly; AI Comments should be short, structured, and high-signal.

```text
/*
This function intentionally allows a small amount of staleness.
We prefer returning cached data to keep the UI responsive during traffic spikes.
If you are debugging a "stale profile" report, reproduce with cache disabled.
*/

/*[ ? We accept up to 30s stale data for responsiveness. ]*/
function getUserProfile(userId, cache, db) {
    // ...
}
```

Notice the difference: the regular comment uses `/* ... */`, while the AI Comment uses `/*[ ... ]*/` (with brackets).
In practice: humans read the long-form explanation; agents prioritize the compact `/*[ ? ... ]*/` constraint when making changes.

## Where can AI Comments appear?

Anywhere a normal comment can appear:

- File headers
- Near function/class definitions
- Inline next to a tricky block
- Next to edge-case handling, invariants, or assumptions

## Equivalents for other languages

The *canonical* wrapper is:

```c
/*[ ... ]*/
```

Some languages don’t use C-style block comments. Tooling can support equivalents like:

```text
# [~ ...]     (Python / YAML / TOML)
-- [> ...]    (Lua)
; [ ... ]     (some INI-style configs)
```

The wrapper changes; the semantics stay the same.

## Writing good AI Comments

- Use `?` for non-obvious constraints (limits, upstream quirks, compatibility)
- Make `~` rules verifiable (avoid vague language like “should probably”)
- Keep `>` instructions small and single-purpose
- Prefer “why” and constraints over restating obvious code
- Avoid secrets or sensitive data in comments
- If code changes invalidate a comment, update the comment (or remove it)

## For AI Agents

If you want to use AI Comments in your own projects, you can download/copy `AICOMMENTS_FOR_AGENTS.md` into your repo and point your AI coding agent at it.

- `README.md` explains the concept for humans (this file).
- `AICOMMENTS_FOR_AGENTS.md` is the agent-focused guide: how to interpret prefixes, how to report `~` violations, and how/when to flip `>` → `:`.

## FAQ

**Is this a tool/library?**
Not yet. It’s a convention that tooling and agents can adopt.

**Does this replace normal comments?**
No—use it for high-signal intent, invariants, and agent actions.

**What if agents ignore it?**
Humans still get readable intent. The convention becomes more valuable as tooling improves.

## License

MIT — see `LICENSE`.
