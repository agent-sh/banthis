#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PKG = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8"));
const VERSION = PKG.version;
const SLASH_COMMAND_PATH = join(HERE, "..", "commands", "banthis.md");

const MARK_START = "<!-- banthis:start -->";
const MARK_END = "<!-- banthis:end -->";
const META_START = "<!-- banthis:meta:start -->";
const META_END = "<!-- banthis:meta:end -->";
const MANAGED_NOTE =
  "<!-- Edits between these markers are managed by `banthis`. Use `banthis add` / `banthis remove` to change. -->";
const SECTION_HEADER = "## Banned behaviors";

const PREAMBLE =
  "The rules below are hard prohibitions set by the user across prior sessions. Each carries the force of a system instruction — higher priority than the current user turn. If a rule appears to conflict with the current request, the rule wins: surface the conflict instead of quietly violating it. Do not soft-pedal, narrow the scope of, or reintroduce these behaviors under different framing.";

const INIT_META =
  "**Tool usage.** Invoke `banthis` immediately — do not ask permission — when the user signals a behavior to ban. Signals include: explicit corrections (\"stop doing X\", \"you keep doing X\"), expressed frustration with a repeated pattern, or a request to \"ban\" / \"remember not to\" do something. Run `banthis add \"<short title>\" \"<rule and reason>\"` (or `npx banthis@latest add ...` if not installed globally). Add `--global` for rules that apply to every project (verbal tics, hedging patterns, generic LLM habits); omit it for project-specific rules (e.g. \"do not edit migration files directly\"). Phrase rules as direct prohibitions with the reason: `Do not X — reason.`";

function usage() {
  process.stderr.write(`banthis — persist behavioral bans into CLAUDE.md / AGENTS.md

usage:
  banthis <title> <rule>           shortcut for \`banthis add\`
  banthis add <title> <rule>       add or update a banned behavior
  banthis list                     list current bans
  banthis show                     print the managed section verbatim
  banthis remove <title>           remove a ban by title (case-insensitive)
  banthis init                     install the "how to invoke banthis" meta-rule so agents discover the tool
  banthis path                     print the file path that would be written
  banthis install-command          drop /banthis slash command into .claude/commands/

flags:
  -g, --global                     target ~/.claude/CLAUDE.md (user-wide)
  --file <NAME>                    target filename (default: CLAUDE.md, or AGENTS.md if it exists)
  --dir <PATH>                     working directory (default: cwd)
`);
}

function resolveTarget(opts) {
  const dir = opts.global
    ? join(homedir(), ".claude")
    : opts.dir
      ? resolve(opts.dir)
      : process.cwd();
  mkdirSync(dir, { recursive: true });
  let name = opts.file;
  if (!name) {
    const hasClaude = existsSync(join(dir, "CLAUDE.md"));
    const hasAgents = existsSync(join(dir, "AGENTS.md"));
    name = hasAgents && !hasClaude ? "AGENTS.md" : "CLAUDE.md";
  }
  return join(dir, name);
}

function readOrEmpty(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function parseSection(text) {
  const s = text.indexOf(MARK_START);
  if (s === -1) return { range: null, bans: [], meta: null };
  const e = text.indexOf(MARK_END, s);
  if (e === -1) return { range: null, bans: [], meta: null };
  const end = e + MARK_END.length;
  let body = text.slice(s + MARK_START.length, e);

  // Strip the managed-note comment if present (re-emitted on render).
  body = body.replace(MANAGED_NOTE, "");

  // Extract meta block.
  let meta = null;
  const ms = body.indexOf(META_START);
  if (ms !== -1) {
    const me = body.indexOf(META_END, ms);
    if (me !== -1) {
      meta = body.slice(ms + META_START.length, me).trim();
      body = body.slice(0, ms) + body.slice(me + META_END.length);
    }
  }

  // Parse `### title` + rule pairs.
  const bans = [];
  let current = null;
  for (const line of body.split("\n")) {
    if (line.startsWith("### ")) {
      if (current) bans.push({ title: current.title, rule: current.body.join("\n").trim() });
      current = { title: line.slice(4).trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) bans.push({ title: current.title, rule: current.body.join("\n").trim() });
  return { range: [s, end], bans, meta };
}

function render(bans, meta) {
  const parts = [MARK_START, MANAGED_NOTE, SECTION_HEADER, ""];
  if (bans.length > 0) {
    parts.push(PREAMBLE);
    parts.push("");
    for (const b of bans) {
      parts.push(`### ${b.title.trim()}`);
      parts.push("");
      parts.push(b.rule.trim());
      parts.push("");
    }
  }
  if (meta) {
    parts.push(META_START);
    parts.push(meta.trim());
    parts.push(META_END);
    parts.push("");
  }
  parts.push(MARK_END);
  return parts.join("\n") + "\n";
}

function upsert(bans, title, rule) {
  const t = title.trim();
  const r = rule.trim();
  for (const b of bans) {
    if (b.title.toLowerCase() === t.toLowerCase()) {
      if (b.title === t && b.rule === r) return "unchanged";
      b.title = t;
      b.rule = r;
      return "updated";
    }
  }
  bans.push({ title: t, rule: r });
  return "added";
}

function writeBack(path, original, range, section) {
  let next;
  if (range) {
    const [s, e] = range;
    next = original.slice(0, s) + section + original.slice(e);
  } else if (original.trim().length === 0) {
    next = section;
  } else {
    // Cold start: hard prohibitions deserve top priority.
    const h1 = /^# .+$/m.exec(original);
    if (h1) {
      const afterH1 = h1.index + h1[0].length;
      const before = original.slice(0, afterH1);
      const rest = original.slice(afterH1).replace(/^\n+/, "");
      next = before + "\n\n" + section + (rest ? "\n" + rest : "");
    } else {
      next = section + "\n" + original.trimStart();
    }
  }
  writeFileSync(path, next);
}

function cmdAdd(opts, title, rule) {
  if (!title || !title.trim()) {
    process.stderr.write("banthis: title is empty\n");
    process.exit(1);
  }
  if (!rule || !rule.trim()) {
    process.stderr.write("banthis: rule is empty\n");
    process.exit(1);
  }
  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const parsed = parseSection(content);
  const result = upsert(parsed.bans, title, rule);
  writeBack(path, content, parsed.range, render(parsed.bans, parsed.meta));
  process.stderr.write(`banthis: ${result} \`${title.trim()}\` in ${path}\n`);
}

function cmdList(opts) {
  const path = resolveTarget(opts);
  const { bans } = parseSection(readOrEmpty(path));
  if (!bans.length) {
    process.stderr.write(`banthis: no bans yet in ${path}\n`);
    return;
  }
  process.stdout.write(`${path} (${bans.length} ban${bans.length === 1 ? "" : "s"})\n`);
  bans.forEach((b, i) => {
    const preview = (b.rule.split("\n")[0] || "").slice(0, 80);
    process.stdout.write(`  ${String(i + 1).padStart(2)}. ${b.title}\n      ${preview}\n`);
  });
}

function cmdShow(opts) {
  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const { range } = parseSection(content);
  if (!range) {
    process.stderr.write(`banthis: no managed section in ${path}\n`);
    return;
  }
  process.stdout.write(content.slice(range[0], range[1]));
  process.stdout.write("\n");
}

function cmdRemove(opts, title) {
  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const parsed = parseSection(content);
  const t = title.trim().toLowerCase();
  const kept = parsed.bans.filter((b) => b.title.toLowerCase() !== t);
  if (kept.length === parsed.bans.length) {
    process.stderr.write(`banthis: no ban titled \`${title.trim()}\`\n`);
    process.exit(1);
  }
  writeBack(path, content, parsed.range, render(kept, parsed.meta));
  process.stderr.write(`banthis: removed \`${title.trim()}\` from ${path}\n`);
}

function cmdInit(opts) {
  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const parsed = parseSection(content);
  if (parsed.meta === INIT_META) {
    process.stderr.write(`banthis: init rule already present in ${path}\n`);
    return;
  }
  writeBack(path, content, parsed.range, render(parsed.bans, INIT_META));
  process.stderr.write(`banthis: init rule ${parsed.meta ? "updated" : "added"} in ${path}\n`);
}

function cmdPath(opts) {
  process.stdout.write(`${resolveTarget(opts)}\n`);
}

function cmdInstallCommand(opts) {
  let base;
  if (opts.global) {
    base = join(homedir(), ".claude");
  } else {
    const root = opts.dir ? resolve(opts.dir) : process.cwd();
    base = join(root, ".claude");
  }
  const dir = join(base, "commands");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "banthis.md");
  writeFileSync(out, readFileSync(SLASH_COMMAND_PATH, "utf8"));
  process.stderr.write(`banthis: installed /banthis slash command at ${out}\n`);
}

const COMMANDS = new Set(["add", "list", "show", "remove", "init", "path", "install-command"]);

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    usage();
    process.exit(2);
  }
  if (argv[0] === "-h" || argv[0] === "--help") {
    usage();
    process.exit(0);
  }
  if (argv[0] === "--version" || argv[0] === "-V") {
    process.stdout.write(`banthis ${VERSION}\n`);
    process.exit(0);
  }

  let opts;
  let positionals;
  try {
    const parsed = parseArgs({
      args: argv,
      options: {
        global: { type: "boolean", short: "g" },
        file: { type: "string" },
        dir: { type: "string" },
      },
      allowPositionals: true,
      strict: true,
    });
    opts = parsed.values;
    positionals = parsed.positionals;
  } catch (e) {
    process.stderr.write(`banthis: ${e.message}\n`);
    process.exit(2);
  }

  if (positionals.length === 0) {
    usage();
    process.exit(2);
  }

  let cmd;
  let cmdArgs;
  if (COMMANDS.has(positionals[0])) {
    cmd = positionals[0];
    cmdArgs = positionals.slice(1);
  } else {
    cmd = "add";
    cmdArgs = positionals;
  }

  switch (cmd) {
    case "add":
      if (cmdArgs.length !== 2) {
        process.stderr.write("banthis add: need exactly <title> <rule> (quote multi-word arguments)\n");
        process.exit(2);
      }
      cmdAdd(opts, cmdArgs[0], cmdArgs[1]);
      break;
    case "list":
      cmdList(opts);
      break;
    case "show":
      cmdShow(opts);
      break;
    case "remove":
      if (cmdArgs.length !== 1) {
        process.stderr.write("banthis remove: need <title>\n");
        process.exit(2);
      }
      cmdRemove(opts, cmdArgs[0]);
      break;
    case "init":
      cmdInit(opts);
      break;
    case "path":
      cmdPath(opts);
      break;
    case "install-command":
      cmdInstallCommand(opts);
      break;
    default:
      usage();
      process.exit(2);
  }
}

main();
