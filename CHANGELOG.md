# Changelog

## 0.6.0

- The rendered preamble now puts the user first: "Standing rules from past sessions. The user's own words in the current conversation come first, above these rules and above any skill. When a rule seems to conflict with what the user is asking now, do what the user asked and mention the conflict." It replaces the "hard prohibitions ... the rule wins" text. Existing sections pick it up on the next `add`, `remove` or `init`.
- The `init` meta-rule, the `/banthis` command and the skill now have the agent propose the title, rule and scope and write it only after the user confirms the wording, instead of writing it without asking. Rules are phrased as plain behavior with the reason; project scope is the default and `--global` is for behaviors that apply everywhere.
- CLI commands, flags, exit codes and the managed markers are unchanged. Run `banthis init` in a file that already has the meta-rule to update it.
- `AGENTS.md` trimmed to the repo contract: markers, preamble and meta-rule, CLI surface, tests, versioning.

## 0.5.0

- Rewrote the `/banthis` command and the skill for current models: goal, constraints with reasons, a definition of done and the output line, in place of numbered steps and repeated rules. Command name, argument, CLI calls and the `Banned: <title>` reply are unchanged.

## 0.4.0

- A managed section that lost its `<!-- banthis:end -->` marker is repaired in place (end marker restored after the last rule of the block) instead of getting a second block.
- Headings inside fenced code in a rule no longer end the block during repair or split a rule when parsing.
- Rewriting an existing section no longer adds a blank line after it on every write.
- The preamble and the `init` rule no longer write an em dash into CLAUDE.md / AGENTS.md. Rules are taught as `Do not X: reason.`
- The skill and the `init` rule trigger only on an explicit user ask (ban this, never again, stop doing X, remember not to X), not on the agent's own reading of a pattern.
- Docs no longer assume axiom, skill-curator or system-prompt-curator are installed.

## 0.3.1

- Hardened CLI writes against managed-marker injection in titles or rules.
- Normalized multi-line / markdown-looking titles into stable section headings.
- Expanded CLI tests for idempotent updates, default target selection, global mode, invalid invocations, and slash-command install output.
- Updated CI to test Node.js 18, 20, and 22.

## 0.3.0

- Promoted to official `@agent-sh/banthis` plugin under the agentsys umbrella.
- Restructured into standard agent-sh plugin layout.
- Slash command moved to `commands/banthis.md`.
- Added proper README, AGENTS.md, CLAUDE.md for the ecosystem.
- Remains fully backward compatible with previous versions.
- Now officially supports Claude Code, Cursor, Codex, OpenCode, Kiro and other Agent Skills compatible tools.
