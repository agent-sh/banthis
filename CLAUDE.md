# CLAUDE.md — banthis

Follow the Karpathy Guidelines (simplicity, surgical changes, clear success criteria) in this repository.

`banthis` is a deliberately small tool. Its power comes from being extremely low-friction to use at the exact moment of frustration.

## Key Constraints

- Keep the surface tiny so the "I want to ban this right now" flow stays fast.
- The managed section markers (`<!-- banthis:start -->` / `<!-- banthis:end -->`) and the preamble text are part of the contract with agents — change them with extreme care.
- Treat the `init` meta-rule as the highest-impact text in the project. Keep the instruction clear that agents invoke `banthis` directly after the user signals a behavior ban.

## Testing

When making changes:
- Run the tool manually on real `CLAUDE.md` / `AGENTS.md` files.
- Verify the output is clean and the rules are respected by agents in practice.
- Test both project-level and `--global` usage.
