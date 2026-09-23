# banthis

Persist "banned behaviors" into `CLAUDE.md` / `AGENTS.md` so AI coding agents remember never to repeat annoying patterns across sessions.

When an agent does something frustrating repeatedly (hedging language, over-explaining, editing migration files directly, etc.), `banthis` turns that frustration into a permanent, high-priority rule that wins over future user requests.

## Installation

```bash
npm install -g github:agent-sh/banthis
```

Or use via `npx`:

```bash
npx --yes github:agent-sh/banthis add "No hedging" "Do not start responses with 'To be honest' or 'I think': it undermines confidence."
```

## Core Commands

- `banthis <title> <rule>`: Quick add (shortcut for `add`)
- `banthis add <title> <rule>`: Add or update a banned behavior
- `banthis list`: List current bans
- `banthis remove <title>`: Remove a ban
- `banthis init`: Install the meta-rule so agents know to invoke `banthis` automatically
- `banthis install-command`: Drop the `/banthis` slash command into `.claude/commands/`

### Flags

- `-g, --global`: Target `~/.claude/CLAUDE.md` (user-wide)
- `--file <NAME>`: Target specific filename
- `--dir <PATH>`: Target specific directory

## How It Works

`banthis` maintains a managed section in `CLAUDE.md` or `AGENTS.md` (between `<!-- banthis:start -->` and `<!-- banthis:end -->`).

Rules added here are treated as **hard prohibitions**: the agent is instructed that these rules have higher priority than the current user request.

If the end marker goes missing (a hand edit or a bad merge), the next `add`, `remove` or `init` restores it after the last rule of the existing block instead of writing a second block.

banthis has no dependencies on other plugins. A config linter such as `agnix` can validate the result if you use one.

## Philosophy

Negative rules ("never do X") are some of the highest-leverage instructions you can give an agent. They are cheap to write, extremely reliable, and survive long context windows better than complex positive instructions.

`banthis` makes it trivial to capture these in the moment of frustration so they persist forever.

## Related Projects

Optional, not required by banthis:

- `agnix`: linter and validator for agent configurations
- `skill-curator`, `system-prompt-curator`: help writing `SKILL.md` files and system prompts

## License

MIT
