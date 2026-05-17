---
name: banthis
description: "Use when user asks to ban, stop, or remember not to repeat an agent behavior ('stop doing X', 'you keep doing X', 'ban this'). Immediately capture it as a permanent negative rule using the banthis tool."
version: 0.3.0
argument-hint: "[behavior description]"
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

# Banthis Skill

When the user shows clear frustration with a recurring agent behavior, you must capture it using `banthis` so the rule persists across all future sessions.

## Parse Arguments

Use `$ARGUMENTS` as the behavior to ban. If it is empty, infer the behavior from the most recent explicit correction in the conversation.

```text
$ARGUMENTS
```

## When to Activate

- User says variations of: "stop doing X", "you always do X", "don't ever X again", "ban this", "remember not to..."
- User corrects the same class of mistake multiple times in one session
- You notice a pattern of low-value behavior (excessive hedging, over-explaining, touching files you were told not to, etc.)

## How to Use

1. **Do not ask for permission.** The user has already signaled they want this behavior banned.
2. Craft two strings:
   - **title**: Short (under 60 chars), framed as a prohibition (e.g. `No 'let me be honest' preambles`)
   - **rule**: 1–2 sentences in the form `Do not X — reason.`
3. Call the tool (prefer the local `banthis` if available, otherwise `npx @agent-sh/banthis@latest`):

```bash
banthis add "<title>" "<rule>"
```

Use `--global` only for behaviors that should apply to every project (verbal tics, generic LLM habits).

4. Confirm in one short line: `Banned: <title>`

## Important Notes

- Rules added by `banthis` go into a managed section of `CLAUDE.md` or `AGENTS.md` and have higher priority than normal instructions.
- This is the negative counterpart to positive memory tools (e.g. `axiom`).
- Run `banthis init` in projects if the meta-rule is not yet present (it teaches agents to invoke `banthis` automatically).

## Related Tools

- `axiom` (positive knowledge capture)
- `agnix` (validates the resulting CLAUDE.md / AGENTS.md)
- `skill-curator` and `system-prompt-curator` (for improving how agents are instructed)
