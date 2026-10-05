# banthis

Persist "banned behaviors" into `CLAUDE.md` / `AGENTS.md` so AI coding agents remember never to repeat annoying patterns across sessions.

When an agent does something frustrating repeatedly (hedging language, over-explaining, editing migration files directly, etc.), `banthis` turns it into a standing rule that later sessions read. The agent proposes the title, the rule and its scope, and writes it after you confirm the wording.

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
- `banthis init`: Install the meta-rule so agents know to propose a rule and save it with `banthis` once you confirm
- `banthis install-command`: Drop the `/banthis` slash command into `.claude/commands/`

### Flags

- `-g, --global`: Target `~/.claude/CLAUDE.md` (user-wide)
- `--file <NAME>`: Target specific filename
- `--dir <PATH>`: Target specific directory

## How It Works

`banthis` maintains a managed section in `CLAUDE.md` or `AGENTS.md` (between `<!-- banthis:start -->` and `<!-- banthis:end -->`).

The section opens with a short preamble: these are standing rules from past sessions, and the user's own words in the current conversation come first. When a rule conflicts with what you ask now, the agent does what you asked and mentions the conflict. Sections written by older versions get the new preamble on the next `add`, `remove` or `init`.

If the end marker goes missing (a hand edit or a bad merge), the next `add`, `remove` or `init` restores it after the last rule of the existing block instead of writing a second block.

banthis has no dependencies on other plugins. A config linter such as `agnix` can validate the result if you use one.

## Philosophy

A short rule with its reason is one of the cheapest instructions you can give an agent, and it survives long context windows well. `banthis` makes it quick to capture one at the moment of frustration, in your own wording, scoped to the project unless it applies everywhere.

## Related Projects

Optional, not required by banthis:

- `agnix`: linter and validator for agent configurations
- `skill-curator`, `system-prompt-curator`: help writing `SKILL.md` files and system prompts

## License

MIT
