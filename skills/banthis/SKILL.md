---
name: banthis
description: "Use when the user explicitly asks to ban an agent behavior ('ban this', 'never again', 'stop doing X', 'remember not to X'). Proposes a rule and, once the user confirms the wording, saves it with the banthis CLI."
version: 0.6.0
argument-hint: "[behavior description]"
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

# banthis

Turn a behavior the user wants gone into a standing rule in `CLAUDE.md` or `AGENTS.md`, so later sessions avoid it.

Behavior to ban:

```text
$ARGUMENTS
```

If that is empty, use the user's most recent explicit correction.

## When it applies

When the user asks for a ban in words: "ban this", "never again", "stop doing X", "remember not to X". A pattern you noticed yourself, or a correction with no request to keep it, is not a ban request.

## Propose, then write

1. Draft:
   - **title**: under 60 characters, e.g. `No 'let me be honest' preambles`.
   - **rule**: one or two plain sentences that state the behavior and the reason, e.g. `Start with the answer, without a "let me be honest" preamble: it adds nothing.` The reason lets a future agent handle cases the title does not name.
   - **scope**: this project by default. Propose `--global` only for behaviors that apply in every project (verbal tics, generic model habits).
2. Show the user the title, rule and scope and ask them to confirm or edit the wording.
3. After they confirm, run:

```bash
banthis add "<title>" "<rule>"    # add --global for a user-wide rule
```

Use `banthis` if it is on PATH, otherwise `npx --yes github:agent-sh/banthis`. If the target file has no banthis meta-rule yet, `banthis init` adds the short instruction that tells future agents how to use the tool.

`banthis list` shows the current rules. `banthis add` with an existing title replaces that rule, and `banthis remove "<title>"` deletes it.

## Done

The command exits 0 and names the file it wrote. Reply with one line: `Banned: <title>`. On failure, show the error and the exact command to retry.
