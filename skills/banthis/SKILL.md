---
name: banthis
description: "Use when the user explicitly asks to ban an agent behavior ('ban this', 'never again', 'stop doing X', 'remember not to X'). Captures it as a permanent negative rule with the banthis CLI."
version: 0.4.0
argument-hint: "[behavior description]"
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

# Banthis Skill

When the user explicitly asks to ban an agent behavior, capture it with `banthis` so the rule persists across future sessions.

## Parse Arguments

Use `$ARGUMENTS` as the behavior to ban. If it is empty, infer the behavior from the most recent explicit correction in the conversation.

```text
$ARGUMENTS
```

## When to Activate

Only on an explicit signal from the user:

- "ban this", "ban X"
- "never again", "don't ever X again"
- "stop doing X"
- "remember not to X"

Do not ban on your own judgment. A pattern you notice, or a correction the user made without asking for a ban, is not a trigger: the user decides what becomes a permanent rule.

## How to Use

1. **Do not ask for permission.** The user already asked for the ban.
2. Craft two strings:
   - **title**: Short (under 60 chars), framed as a prohibition (e.g. `No 'let me be honest' preambles`)
   - **rule**: 1-2 sentences in the form `Do not X: reason.`
3. Call the tool (prefer the local `banthis` if available, otherwise `npx --yes github:agent-sh/banthis`):

```bash
banthis add "<title>" "<rule>"
```

Use `--global` only for behaviors that should apply to every project (verbal tics, generic LLM habits).

4. Confirm in one short line: `Banned: <title>`

## Important Notes

- Rules added by `banthis` go into a managed section of `CLAUDE.md` or `AGENTS.md` and have higher priority than normal instructions.
- Run `banthis init` in projects if the meta-rule is not yet present (it teaches agents to invoke `banthis` when the user asks for a ban).
- banthis works on its own. If a config linter such as `agnix` is installed, it can validate the resulting CLAUDE.md / AGENTS.md; nothing here depends on it.
