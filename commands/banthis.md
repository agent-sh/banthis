---
description: Ban an agent behavior by persisting a "do not" rule into CLAUDE.md or AGENTS.md
argument-hint: [free-form description of behavior to ban]
allowed-tools: Bash(banthis:*), Bash(npx:*)
---

The user wants to ban a behavior. Persist it into the project's `CLAUDE.md` or `AGENTS.md` via the `banthis` CLI so it survives across sessions.

Validate the free-form input before use: if it is empty, infer the behavior from the most recent explicit correction; if several behaviors are plausible, choose the most recent one the user named.

User input: $ARGUMENTS

Steps:
1. If the user input is empty, infer the behavior from the recent conversation. If multiple candidate behaviors exist, pick the one the user named **most recently and most explicitly**.
2. Craft two strings:
   - **title** (under 60 chars), framed as a prohibition (e.g. `No 'let me be honest' preambles`)
   - **rule** (1–2 sentences), phrased as `Do not X — reason.`
3. Run via the Bash tool. Prefer the bare command if `banthis` is on PATH; otherwise use `npx @agent-sh/banthis@latest`:
   `banthis add "<title>" "<rule>"`
   - Add `--global` for rules that apply to every project (verbal tics, hedging, generic LLM behaviors).
   - Omit `--global` for project-specific rules (e.g. `do not edit migration files directly in repo X`).
4. Confirm in one short line: `Banned: <title>`.

Invoke the tool directly after the user names the behavior; the final response can briefly report the title that was banned.

## Example

Input:
`/banthis stop ending with vague optional follow-up offers`

Command:
```bash
banthis add "No vague endings" "Do not end with vague optional follow-up offers — the user wants concise completion."
```

## Verification

Confirm the `banthis` command exited successfully and wrote to the expected target file.

## Output Format

Return one short line: `Banned: <title>`. If the command fails, explain the failure and the exact command that needs to be retried.
