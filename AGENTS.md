# AGENTS.md: banthis

`banthis` saves rules about agent behavior ("stop doing X") into the project or user instruction file (CLAUDE.md or AGENTS.md), so they carry across sessions.

## Overview

A dependency-free Node.js CLI (`bin/banthis.mjs`), one slash command (`commands/banthis.md`) and one skill (`skills/banthis/SKILL.md`). It stands alone; `agnix` can validate the files it writes when installed.

## Design

- Keep the surface tiny so adding a rule stays fast.
- The user decides what becomes a rule. The command, the skill and the `init` meta-rule have the agent propose the title, rule and scope, and write only after the user confirms the wording.
- Rules are plain sentences with a reason, scoped to one project unless they apply everywhere.
- The rendered preamble puts the user's current words above the stored rules.

## Contract

- The managed section markers (`<!-- banthis:start -->`, `<!-- banthis:end -->`, and the `banthis:meta` pair) and the `## Banned behaviors` header are parsed by existing installs. Keep them backward compatible.
- The preamble and the `init` meta-rule (`PREAMBLE` and `INIT_META` in `bin/banthis.mjs`) are the text agents read in every session. Change them deliberately and update the tests that pin them.
- Keep the CLI commands, flags and exit codes stable: `add`, `list`, `show`, `remove`, `init`, `path`, `install-command`, `--global`, `--file`, `--dir`.

## Testing

- `npm test` runs the CLI tests. `agnix .` validates the skill, command and plugin manifests, as CI does.
- For a change to rendered text, also run the CLI on a disposable project with each supported instruction filename, and once with `--global` under a temporary `HOME`.

## Versioning

Bump the version in `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the skill frontmatter together, update the version the tests pin, and add a `CHANGELOG.md` entry.
