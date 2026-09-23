---
description: Ban an agent behavior by persisting a "do not" rule into CLAUDE.md or AGENTS.md
argument-hint: [free-form description of behavior to ban]
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

The user wants a behavior banned for good. Write it into the project's `CLAUDE.md` or `AGENTS.md` with the `banthis` CLI so it survives across sessions.

Behavior to ban: $ARGUMENTS

If that is empty, use the correction the user made most recently and most explicitly in this conversation.

Write two strings:

- **title**: under 60 characters, framed as a prohibition, e.g. `No 'let me be honest' preambles`.
- **rule**: one or two sentences in the form `Do not X: reason.` The reason is what lets a future agent apply the rule to cases the title does not name.

Run it. Use `banthis` if it is on PATH, otherwise `npx --yes github:agent-sh/banthis`:

```bash
banthis add "<title>" "<rule>"
```

Add `--global` when the behavior applies everywhere (verbal tics, hedging, generic model habits). Leave it off for project-specific rules, e.g. `Do not edit migration files directly`.

Do not ask for confirmation first: the user already asked for the ban.

Done when the command exits 0 and names the file it wrote. Reply with one line: `Banned: <title>`. If it fails, show the error and the exact command to retry.
