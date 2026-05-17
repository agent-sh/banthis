# AGENTS.md — banthis

`banthis` is a small but high-leverage DX tool for capturing negative rules ("never do this") that should survive across all future agent sessions.

## Overview

This repository ships a dependency-free Node.js CLI, one slash command, and one skill. `AGENTS.md` takes precedence over `CLAUDE.md` for repository-wide decisions; `CLAUDE.md` only adds Claude Code reminders.

## Core Responsibility

- Keep the CLI (`bin/banthis.mjs`) clean, robust, and cross-platform.
- Maintain the slash command and the automatic `init` meta-rule so agents discover the tool.
- Ensure rules written by `banthis` are high-signal and respected by agents.

## Design Principles

- **Minimal surface** — Keep this as a tiny CLI plus slash command.
- **Permanent effect** — Once a rule is added, it should be very hard for an agent to ignore it.
- **Human in the loop for quality** — The tool captures human frustration in the moment. The quality of the rule depends on the human phrasing it well.

## When Modifying

- Keep changes to the managed section rendering (`<!-- banthis:start -->` ... `<!-- banthis:end -->`) backward compatible.
- Update the `init` meta-rule carefully; it is the instruction that tells agents to call `banthis`.
- Test with both Claude Code and at least one other tool (Cursor or Codex).

## Relationship to Other Tools

- Complements `axiom` (positive memory / principles) — banthis is the negative counterpart.
- Works alongside `agnix` (validation) and `skill-curator` / `system-prompt-curator`.
