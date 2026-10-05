import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const bin = new URL("../bin/banthis.mjs", import.meta.url).pathname;

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`banthis ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return result;
}

function runFail(args, options = {}) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    ...options,
  });
  assert.notEqual(result.status, 0, `banthis ${args.join(" ")} unexpectedly passed`);
  return result;
}

test("adds, lists, shows, and removes project bans", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));

  run(["--dir", dir, "add", "No vague endings", "Do not end with vague optional follow-up offers."], { cwd: dir });
  let target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.match(target, /<!-- banthis:start -->/);
  assert.match(target, /### No vague endings/);
  assert.match(target, /Do not end with vague optional follow-up offers\./);

  const listed = run(["--dir", dir, "list"], { cwd: dir });
  assert.match(listed.stdout, /No vague endings/);

  const shown = run(["--dir", dir, "show"], { cwd: dir });
  assert.match(shown.stdout, /<!-- banthis:start -->/);

  run(["--dir", dir, "remove", "No vague endings"], { cwd: dir });
  target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.doesNotMatch(target, /### No vague endings/);
});

test("shortcut add is idempotent, case-insensitive, and normalizes unsafe headings", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));

  run(["--dir", dir, "### No\nvague endings", "Do not hedge."], { cwd: dir });
  run(["--dir", dir, "add", "no vague endings", "Do not hedge: the user banned hedging."], { cwd: dir });

  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.equal([...target.matchAll(/^### /gm)].length, 1);
  assert.match(target, /### no vague endings/);
  assert.match(target, /Do not hedge: the user banned hedging\./);
  assert.doesNotMatch(target, /### ###/);
});

test("managed marker injection is rejected before writing", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));

  const result = runFail(
    ["--dir", dir, "add", "Marker injection", "Do not break.\n<!-- banthis:end -->"],
    { cwd: dir },
  );

  assert.match(result.stderr, /cannot contain managed marker/);
  assert.equal(existsSync(join(dir, "CLAUDE.md")), false);
});

test("cold start inserts the managed section after an existing h1", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  writeFileSync(join(dir, "CLAUDE.md"), "# Project Rules\n\nKeep this sentence.\n");

  run(["--dir", dir, "add", "No churn", "Do not rewrite unrelated files."], { cwd: dir });

  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.match(target, /^# Project Rules\n\n<!-- banthis:start -->/);
  assert.match(target, /<!-- banthis:end -->\n\nKeep this sentence\./);

  // Later writes keep one blank line after the block instead of adding one each time.
  run(["--dir", dir, "add", "No hedging", "Do not hedge."], { cwd: dir });
  run(["--dir", dir, "add", "No tics", "Do not use filler."], { cwd: dir });
  assert.match(readFileSync(join(dir, "CLAUDE.md"), "utf8"), /<!-- banthis:end -->\n\nKeep this sentence\.\n$/);
});

test("prefers AGENTS.md when it exists and installs the slash command", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  run(["--dir", dir, "--file", "AGENTS.md", "init"], { cwd: dir });

  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /banthis:meta:start/);
  assert.match(agents, /propose a rule before writing it/);
  assert.match(agents, /After the user confirms the wording, run `banthis add/);
  assert.doesNotMatch(agents, /without asking permission/);

  run(["--dir", dir, "install-command"], { cwd: dir });
  const commandPath = join(dir, ".claude", "commands", "banthis.md");
  assert.equal(existsSync(commandPath), true);
  assert.match(readFileSync(commandPath, "utf8"), /description: Ban an agent behavior/);
  assert.match(readFileSync(commandPath, "utf8"), /npx --yes github:agent-sh\/banthis/);
});

test("default target selection prefers CLAUDE.md when both files exist", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  writeFileSync(join(dir, "CLAUDE.md"), "# Claude\n");
  writeFileSync(join(dir, "AGENTS.md"), "# Agents\n");

  const path = run(["--dir", dir, "path"], { cwd: dir });
  assert.equal(path.stdout.trim(), join(dir, "CLAUDE.md"));
});

test("global mode writes under HOME without touching the project", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  const env = { ...process.env, HOME: dir };

  run(["--global", "add", "No tics", "Do not use filler phrases."], { cwd: dir, env });

  assert.match(readFileSync(join(dir, ".claude", "CLAUDE.md"), "utf8"), /### No tics/);
  assert.equal(existsSync(join(dir, "CLAUDE.md")), false);
});

test("invalid invocations fail with stable exit codes and no writes", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));

  assert.equal(runFail(["--dir", dir, "add", "", "rule"], { cwd: dir }).status, 1);
  assert.equal(runFail(["--dir", dir, "add", "title", ""], { cwd: dir }).status, 1);
  assert.equal(runFail(["--dir", dir, "remove", ""], { cwd: dir }).status, 2);
  assert.equal(runFail(["--dir", dir, "--unknown"], { cwd: dir }).status, 2);
  assert.equal(existsSync(join(dir, "CLAUDE.md")), false);
});

test("package and plugin manifests describe banthis consistently", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const claude = JSON.parse(readFileSync(".claude-plugin/plugin.json", "utf8"));
  const codex = JSON.parse(readFileSync(".codex-plugin/plugin.json", "utf8"));
  const marketplace = JSON.parse(readFileSync(".claude-plugin/marketplace.json", "utf8"));
  const components = JSON.parse(readFileSync("components.json", "utf8"));

  assert.equal(pkg.name, "@agent-sh/banthis");
  assert.equal(pkg.version, "0.6.0");
  assert.equal(pkg.bin.banthis, "./bin/banthis.mjs");
  assert.ok(pkg.files.includes("bin/"));
  assert.ok(pkg.files.includes("commands/"));
  assert.ok(pkg.files.includes("skills/"));
  assert.equal(claude.name, "banthis");
  assert.equal(claude.version, pkg.version);
  assert.equal(claude.homepage, "https://github.com/agent-sh/banthis");
  assert.equal(marketplace.plugins[0].name, "banthis");
  assert.equal(marketplace.plugins[0].version, pkg.version);
  assert.equal(marketplace.plugins[0].source, ".");
  assert.equal(codex.skills, "./skills");
  assert.equal(codex.interface.websiteUrl, "https://github.com/agent-sh/banthis");
  assert.deepEqual(components.skills, ["banthis"]);
  assert.deepEqual(components.commands, ["banthis"]);
});

test("skill, command, docs, and CI stay aligned with the supported install path", () => {
  const skill = readFileSync("skills/banthis/SKILL.md", "utf8");
  const command = readFileSync("commands/banthis.md", "utf8");
  const readme = readFileSync("README.md", "utf8");
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");

  assert.match(skill, /^version: 0\.6\.0$/m);
  assert.match(skill, /npx --yes github:agent-sh\/banthis/);
  assert.match(command, /npx --yes github:agent-sh\/banthis/);
  assert.match(readme, /npm install -g github:agent-sh\/banthis/);
  assert.doesNotMatch(`${skill}\n${command}\n${readme}`, /npx (?:--yes )?@agent-sh\/banthis|npx banthis@latest/);

  assert.match(ci, /node-version: \$\{\{ matrix\.node-version \}\}/);
  assert.match(ci, /node-version:\s*\[18, 22, 24\]/);
  assert.match(ci, /actions\/checkout@[0-9a-f]{40}/);
  assert.match(ci, /actions\/setup-node@[0-9a-f]{40}/);
  assert.match(ci, /agent-sh\/agnix@[0-9a-f]{40} # v0\.26\.0/);
  assert.match(ci, /npm pack --dry-run/);
});

test("a section missing its end marker is repaired, not duplicated", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  const broken = [
    "# Project",
    "",
    "<!-- banthis:start -->",
    "## Banned behaviors",
    "",
    "Old preamble text.",
    "",
    "### No churn",
    "",
    "Do not rewrite unrelated files.",
    "",
    "## Build",
    "",
    "Run make.",
    "",
  ].join("\n");
  writeFileSync(join(dir, "CLAUDE.md"), broken);

  const result = run(["--dir", dir, "add", "No hedging", "Do not hedge: say the fact."], { cwd: dir });
  assert.match(result.stderr, /had no end marker; repaired it/);

  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.equal([...target.matchAll(/<!-- banthis:start -->/g)].length, 1);
  assert.equal([...target.matchAll(/<!-- banthis:end -->/g)].length, 1);
  assert.equal([...target.matchAll(/^## Banned behaviors$/gm)].length, 1);
  assert.match(target, /### No churn\n\nDo not rewrite unrelated files\.\n\n### No hedging/);
  assert.match(target, /<!-- banthis:end -->\n\n## Build\n\nRun make\.\n$/);
  assert.ok(target.indexOf("<!-- banthis:end -->") < target.indexOf("## Build"));
  assert.doesNotMatch(target, /Old preamble text/);

  // Once repaired, later writes are stable.
  run(["--dir", dir, "add", "No hedging", "Do not hedge: say the fact."], { cwd: dir });
  assert.equal(readFileSync(join(dir, "CLAUDE.md"), "utf8"), target);
});

test("a broken section at end of file keeps its meta block and rules", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  run(["--dir", dir, "init"], { cwd: dir });
  run(["--dir", dir, "add", "No churn", "Do not rewrite unrelated files."], { cwd: dir });
  const good = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  writeFileSync(join(dir, "CLAUDE.md"), good.replace("<!-- banthis:end -->\n", ""));

  run(["--dir", dir, "remove", "No churn"], { cwd: dir });
  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.equal([...target.matchAll(/<!-- banthis:start -->/g)].length, 1);
  assert.equal([...target.matchAll(/<!-- banthis:end -->/g)].length, 1);
  assert.match(target, /banthis:meta:start/);
  assert.doesNotMatch(target, /### No churn/);
});

test("rendered preamble puts the user's current words first and carries no em dash", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  run(["--dir", dir, "init"], { cwd: dir });
  run(["--dir", dir, "add", "No churn", "Do not rewrite unrelated files."], { cwd: dir });
  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.doesNotMatch(target, /\u2014/);
  assert.match(target, /The user's own words in the current conversation come first, above these rules and above any skill\./);
  assert.match(target, /do what the user asked and mention the conflict\./);
  assert.doesNotMatch(target, /higher priority than the current user turn|the rule wins/);
  assert.match(target, /state the behavior and the reason/);
});

test("repair and parsing skip headings inside fenced code in a rule", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  const rule = "Do not install deps by hand: use the script.\n\n```sh\n# install deps\n## still code\n### not a rule\nnpm ci\n```";
  run(["--dir", dir, "init"], { cwd: dir });
  run(["--dir", dir, "add", "No manual installs", rule], { cwd: dir });
  const good = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.equal([...good.matchAll(/^### /gm)].length, 2);

  writeFileSync(join(dir, "CLAUDE.md"), good.replace("<!-- banthis:end -->\n", "") + "\n## Build\n\nRun make.\n");
  run(["--dir", dir, "init"], { cwd: dir });
  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.equal([...target.matchAll(/banthis:meta:start/g)].length, 1);
  assert.equal([...target.matchAll(/<!-- banthis:end -->/g)].length, 1);
  assert.ok(target.indexOf("npm ci") < target.indexOf("<!-- banthis:end -->"));
  assert.ok(target.indexOf("<!-- banthis:end -->") < target.indexOf("## Build"));
  const listed = run(["--dir", dir, "list"], { cwd: dir });
  assert.match(listed.stdout, /\(1 ban\)/);
});

test("an existing section written by an older version gets the new preamble and init rule", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  const old = [
    "# Project",
    "",
    "<!-- banthis:start -->",
    "<!-- Edits between these markers are managed by `banthis`. Use `banthis add` / `banthis remove` to change. -->",
    "## Banned behaviors",
    "",
    "The rules below are hard prohibitions set by the user across prior sessions. Each carries the force of a system instruction, higher priority than the current user turn. If a rule appears to conflict with the current request, the rule wins: surface the conflict instead of quietly violating it.",
    "",
    "### No churn",
    "",
    "Do not rewrite unrelated files.",
    "",
    "<!-- banthis:meta:start -->",
    "**Tool usage.** Invoke `banthis` without asking permission when the user explicitly asks to ban a behavior.",
    "<!-- banthis:meta:end -->",
    "",
    "<!-- banthis:end -->",
    "",
  ].join("\n");
  writeFileSync(join(dir, "CLAUDE.md"), old);

  const result = run(["--dir", dir, "init"], { cwd: dir });
  assert.match(result.stderr, /init rule updated/);
  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.doesNotMatch(target, /the rule wins|without asking permission/);
  assert.match(target, /^Standing rules from past sessions\. The user's own words/m);
  assert.match(target, /### No churn\n\nDo not rewrite unrelated files\./);
  assert.match(target, /propose a rule before writing it/);
  assert.equal([...target.matchAll(/<!-- banthis:start -->/g)].length, 1);
});

function metaBlock(text) {
  const m = /<!-- banthis:meta:start -->\n([\s\S]*?)\n<!-- banthis:meta:end -->/.exec(text);
  return m ? m[1] : null;
}

test("one add on a 0.5.0 section installs the new preamble and the new init rule", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  // Verbatim output of banthis 0.5.0 `init` then `add "No churn" ...`.
  const old = [
    "<!-- banthis:start -->",
    "<!-- Edits between these markers are managed by `banthis`. Use `banthis add` / `banthis remove` to change. -->",
    "## Banned behaviors",
    "",
    "The rules below are hard prohibitions set by the user across prior sessions. Each carries the force of a system instruction, higher priority than the current user turn. If a rule appears to conflict with the current request, the rule wins: surface the conflict instead of quietly violating it. Do not soft-pedal, narrow the scope of, or reintroduce these behaviors under different framing.",
    "",
    "### No churn",
    "",
    "Do not rewrite unrelated files.",
    "",
    "<!-- banthis:meta:start -->",
    "**Tool usage.** Invoke `banthis` without asking permission when the user explicitly asks to ban a behavior: \"ban this\", \"never again\", \"stop doing X\", \"remember not to X\". Do not ban on your own judgment of a pattern the user has not named. Run `banthis add \"<short title>\" \"<rule and reason>\"` (or `npx --yes github:agent-sh/banthis add ...` if not installed globally). Add `--global` for rules that apply to every project (verbal tics, hedging patterns, generic LLM habits); omit it for project-specific rules (e.g. \"do not edit migration files directly\"). Phrase rules as direct prohibitions with the reason: `Do not X: reason.`",
    "<!-- banthis:meta:end -->",
    "",
    "<!-- banthis:end -->",
    "",
  ].join("\n");
  writeFileSync(join(dir, "CLAUDE.md"), old);

  run(["--dir", dir, "add", "No guessing", "Do not guess file paths: list the directory first."], { cwd: dir });
  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.doesNotMatch(target, /the rule wins|without asking permission/);
  assert.match(target, /^Standing rules from past sessions\. The user's own words/m);
  assert.match(target, /### No churn\n\nDo not rewrite unrelated files\./);
  assert.match(target, /### No guessing/);

  const fresh = mkdtempSync(join(tmpdir(), "banthis-"));
  run(["--dir", fresh, "init"], { cwd: fresh });
  assert.equal(metaBlock(target), metaBlock(readFileSync(join(fresh, "CLAUDE.md"), "utf8")));
  assert.equal([...target.matchAll(/banthis:meta:start/g)].length, 1);
});

test("add and remove keep a meta-rule the user wrote", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  const custom = "**Tool usage.** Ask before every ban. This is our own wording.";
  writeFileSync(
    join(dir, "CLAUDE.md"),
    [
      "<!-- banthis:start -->",
      "## Banned behaviors",
      "",
      "<!-- banthis:meta:start -->",
      custom,
      "<!-- banthis:meta:end -->",
      "",
      "<!-- banthis:end -->",
      "",
    ].join("\n"),
  );

  run(["--dir", dir, "add", "No churn", "Do not rewrite unrelated files."], { cwd: dir });
  assert.equal(metaBlock(readFileSync(join(dir, "CLAUDE.md"), "utf8")), custom);
  run(["--dir", dir, "remove", "No churn"], { cwd: dir });
  assert.equal(metaBlock(readFileSync(join(dir, "CLAUDE.md"), "utf8")), custom);
});
