---
description: Ban an agent behavior by persisting a "do not" rule into CLAUDE.md or AGENTS.md
argument-hint: [free-form description of behavior to ban]
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

The user wants an agent behavior to stop in future sessions. Draft a rule, confirm the wording with the user, then save it to the project's `CLAUDE.md` or `AGENTS.md` with the `banthis` CLI.

Behavior to ban: $ARGUMENTS

If that is empty, use the user's most recent explicit correction in this conversation.

Draft three things:

- **title**: under 60 characters, e.g. `No 'let me be honest' preambles`.
- **rule**: one or two plain sentences that state the behavior and the reason, e.g. `Start with the answer, without a "let me be honest" preamble: it adds nothing.` The reason lets a future agent handle cases the title does not name.
- **scope**: this project by default. Propose `--global` only when the behavior applies in every project (verbal tics, generic model habits).

Show the user the title, rule and scope and ask them to confirm or edit. Write the rule only after they confirm. Use `banthis` if it is on PATH, otherwise `npx --yes github:agent-sh/banthis`:

```bash
banthis add "<title>" "<rule>"    # add --global for a user-wide rule
```

Done when the command exits 0 and names the file it wrote. Reply with one line: `Banned: <title>`. If it fails, show the error and the exact command to retry.
