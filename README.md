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
- [Search & Maintenance](#search--maintenance)
- [Try It Out](#try-it-out)
- [For AI Agents](#for-ai-agents)
- [FAQ](#faq)
- [License](#license)

## What are AI Comments?

AI Comments are designed to sit alongside regular comments.

```text
/*
This is a regular comment: it can be verbose and human-friendly.
It can include background, trade-offs, and debugging notes.
*/

/*[ ? Upstream transport has a fixed 512-char buffer; truncation avoids overflow. ]*/
/*[ ~ Never emit a message longer than 512 chars. ]*/
function formatMessage(userText) {
    // ...
}
```

Notice the difference: regular comments use `/* ... */`, while AI Comments use `/*[ ... ]*/` (with brackets).

AI Comments are regular code comments written in a recognizable wrapper format:

```c
/*[ ... ]*/
```

The wrapper makes them easy to spot for humans and easy for agents/tools to detect.
Used consistently, AI Comments keep high-signal intent, constraints, and invariants close to the code—reducing back-and-forth and helping humans and AI agents iterate faster with less drift.

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
| `~` | Rule / invariant | If code doesn’t match the rule, flag it clearly. |
| `?` | Rationale / constraint context | Treat as crucial context for both humans and agents; preserve and consider before refactors, and avoid changes that violate the stated constraint. |
| `>` | Instruction / task | Treat as actionable instruction; after completing, switch `>` to `:`. |
| `:` | Completed instruction | Indicates the task is done; agent should ask whether to delete it. |
| *(none)* | Context / intent | Use as high-signal documentation for understanding “what/why”. |

Notes:
- The goal is “obvious to humans, machine-detectable for agents”.
- Keep comments short and specific; prefer one idea per comment.

## Examples

The snippets below use simple pseudo-code so the idea stays language-neutral.

### 1) Rule / invariant (`~`)

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

### 2) Rationale / constraint context (`?`)

Use `?` to capture crucial extra context: why the code is written this way, and what constraints both humans and agents must respect.

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

### 3) Instruction (`>`) becomes completed (`:`)

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

### 4) Intent (no prefix)

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
/*[ <payload> ]*/
```

Conceptually, an AI Comment is “a normal comment containing a bracketed payload”: the host language’s comment delimiter plus a `[` … `]` wrapper around the payload.

If the host language supports line comments, a line form like `//[ <payload> ]` (or the closest equivalent) is also acceptable; agents/tools should treat these as equivalent wrappers.

Common equivalents:

```text
//[ ... ]      (C/C++/JS/TS/Java/etc line comments)
# [ ... ]      (Python / YAML / TOML)
-- [ ... ]     (Lua / SQL)
; [ ... ]      (INI-style configs)
```

Recommended detection patterns (for tooling/agents):

```text
Block:  /\/\*\[\s*([\s\S]*?)\s*\]\*\//
Line:   /^\s*(?://|#|--|;)\s*\[\s*(.*?)\s*\]\s*$/
```

The wrapper may vary by language; the prefix semantics stay the same.

## Writing good AI Comments

- Start with `~` rules that are checkable (word them so they could become an assertion/test)
- Add `?` when there is crucial extra context (limits, upstream quirks, compatibility)
- Keep `>` instructions small and single-purpose
- Clean up stale `>` and completed `:` frequently (for example, during PR review)
- Optional: add a short `ref:` in `?` comments (ticket/RFC/spec) when it matters
- Prefer “why” and constraints over restating obvious code
- Avoid secrets or sensitive data in comments
- If code changes invalidate a comment, update the comment (or remove it)

### Wording examples

Good `~` rules are concrete and checkable:

- `/*[ ~ On invalid input, return { ok: false } with no side effects. ]*/`
- `/*[ ~ Never cache a missing user (avoid caching null / not_found). ]*/`

Bad `~` rules are vague and hard to verify:

- `/*[ ~ This should be fast. ]*/`
- `/*[ ~ Handle errors gracefully. ]*/`

Good `?` rationales capture constraints and trade-offs:

- `/*[ ? Upstream transport buffer is 512 chars; truncate to avoid overflow. ]*/`
- `/*[ ? ref: RFC-123 Cache TTL is 30s; slight staleness is acceptable. ]*/`

## Search & Maintenance

You can get a quick “map” of AI Comments with simple text search (no custom tooling required):

```text
rg -n -F "/*[" .
rg -n -F "//[" .
rg -n -F "# [" .
rg -n -F "-- [" .
rg -n -F "; [" .
```

Useful focused searches:

```text
rg -n -F "[ ~ " .
rg -n -F "[ ? " .
rg -n -F "[ > " .
rg -n -F "[ : " .
```

Review hygiene:

- If a change makes an AI Comment untrue, update or remove it.
- Clean up lingering `>` and completed `:` frequently (for example, during PR review).

## Try It Out

The easiest way to get a feel for the concept is to play with the two sample apps in `samples/`:

- `samples/sample_app_no_ai_comments` — a small multi-file TypeScript CLI sample app with no AI Comments.
- `samples/sample_app_with_ai_comments` — a similar sample app, already annotated with AI Comments (and intentionally includes a few extra features and `>` tasks to experiment with).

To make your agent behave consistently across both samples, copy `AICOMMENTS_FOR_AGENTS.md` into each sample repo (or otherwise provide it to your agent as repo instructions).

Then try a few prompts with your favorite AI coding agent:

- Ask it to add AI Comments to the sample without them.
- Ask it to list all **actionable** AI Comments in the annotated sample (anything with `>`).
- Ask it to implement one or two of those actionable AI Comments (and ensure it flips `>` to `:` after completion).
- Intentionally change some code in a way that breaks a `~` rule, then ask the agent to check the **latest diff** for rule breaks.

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
