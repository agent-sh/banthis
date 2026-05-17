# Contributing to banthis

`banthis` is intentionally a small, sharp tool. Its value comes from being extremely low-friction at the moment of frustration.

## Guidelines

- The core logic lives in `bin/banthis.mjs`. Keep it simple and dependency-free.
- The slash command (`commands/banthis.md`) and the `init` meta-rule are critical for discoverability.
- When changing how rules are rendered into `CLAUDE.md`/`AGENTS.md`, be extremely careful about backward compatibility.
- The skill in `skills/banthis/SKILL.md` teaches agents when to invoke the tool automatically.

## Testing

- Test the CLI directly on real projects.
- Verify that agents actually respect newly added bans.
- Test both local project files and `--global`.

## Related Tools

This tool is the negative counterpart to positive memory systems (e.g. the upcoming `axiom`). It works best alongside `agnix`, `skill-curator`, and `system-prompt-curator`.
