---
name: banthis
description: "Use when the user explicitly asks to ban an agent behavior ('ban this', 'never again', 'stop doing X', 'remember not to X'). Captures it as a permanent negative rule with the banthis CLI."
version: 0.5.0
argument-hint: "[behavior description]"
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

# banthis

Turn a behavior the user wants gone into a permanent rule in `CLAUDE.md` or `AGENTS.md`, so later sessions do not repeat it.

Behavior to ban:

```text
$ARGUMENTS
```

If that is empty, use the user's most recent explicit correction.

## When it applies

Only when the user asks for a ban in words: "ban this", "never again", "stop doing X", "remember not to X". A pattern you noticed yourself, or a correction the user made without asking for a ban, does not count. The user decides what becomes permanent, because a ban outranks their future requests.

Once they ask, act without asking permission.

## What to write

- **title**: under 60 characters, framed as a prohibition, e.g. `No 'let me be honest' preambles`.
- **rule**: one or two sentences, `Do not X: reason.` The reason lets a future agent handle cases the title does not name.

```bash
banthis add "<title>" "<rule>"
```

Use `banthis` if it is on PATH, otherwise `npx --yes github:agent-sh/banthis`. Add `--global` for behaviors that apply to every project (verbal tics, generic model habits); leave it off for project-specific rules.

If the target file has no banthis meta-rule yet, `banthis init` adds the short instruction that tells future agents to call the tool.

## Done

The command exits 0 and reports the file it wrote. Reply with one line: `Banned: <title>`. On failure, show the error and the exact command to retry.

banthis stands alone. A config linter such as `agnix` can validate the resulting file if one is installed.
