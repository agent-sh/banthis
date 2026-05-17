# Changelog

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
