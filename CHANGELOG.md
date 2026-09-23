# Changelog

## 0.4.0

- A managed section that lost its `<!-- banthis:end -->` marker is repaired in place (end marker restored after the last rule of the block) instead of getting a second block.
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
