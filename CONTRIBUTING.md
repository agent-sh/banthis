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

banthis does not depend on other plugins. Keep it that way: `agnix` or any other tool is an optional companion, never a requirement.
