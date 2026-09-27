# AGENTS.md: banthis

`banthis` is a small but high-leverage DX tool for capturing negative rules ("never do this") that should survive across all future agent sessions.

## Overview

This repository ships a dependency-free Node.js CLI, one slash command, and one skill. `AGENTS.md` is the repository instruction source.

## Core Responsibility

- Keep the CLI (`bin/banthis.mjs`) clean, robust, and cross-platform.
- Maintain the slash command and the automatic `init` meta-rule so agents discover the tool.
- Ensure rules written by `banthis` are high-signal and respected by agents.

## Design Principles

- **Minimal surface**: Keep this as a tiny CLI plus slash command.
- **Permanent effect**: Once a rule is added, it should be very hard for an agent to ignore it.
- **Human in the loop for quality**: The tool captures human frustration in the moment. The quality of the rule depends on the human phrasing it well.

## When Modifying

- Keep changes to the managed section rendering (`<!-- banthis:start -->` ... `<!-- banthis:end -->`) backward compatible.
- Update the `init` meta-rule carefully; it is the instruction that tells agents to call `banthis`.
- Test with both Claude Code and at least one other tool (Cursor or Codex).

## Relationship to Other Tools

banthis stands alone. It does not require any other plugin; `agnix` can validate the files it writes if it is installed.

## Additional maintainer guidance

Follow the Karpathy Guidelines (simplicity, surgical changes, clear success criteria) in this repository.

`banthis` is a deliberately small tool. Its power comes from being extremely low-friction to use at the exact moment of frustration.

## Key Constraints

- Keep the surface tiny so the "I want to ban this right now" flow stays fast.
- The managed section markers (`<!-- banthis:start -->` / `<!-- banthis:end -->`) and the preamble text are part of the contract with agents: change them with extreme care.
- Treat the `init` meta-rule as the highest-impact text in the project. Keep the instruction clear that agents invoke `banthis` directly after the user signals a behavior ban.

## Testing

When making changes:
- Run the tool manually on both supported instruction filenames in disposable test projects.
- Verify the output is clean and the rules are respected by agents in practice.
- Test both project-level and `--global` usage.

## Validation scope

Choose checks that cover the changed behavior. For CPU-only tooling, documentation
and configuration changes, run the relevant CPU tests, static checks and configuration
validation. Do not require a blanket GPU gate for those changes. Require GPU
qualification when GPU, runtime or model behavior, or related claims, change.
Preserve applicable native, model and hardware qualification gates. CPU checks do
not qualify GPU behavior.
