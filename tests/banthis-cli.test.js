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
  run(["--dir", dir, "add", "no vague endings", "Do not hedge — the user banned hedging."], { cwd: dir });

  const target = readFileSync(join(dir, "CLAUDE.md"), "utf8");
  assert.equal([...target.matchAll(/^### /gm)].length, 1);
  assert.match(target, /### no vague endings/);
  assert.match(target, /Do not hedge — the user banned hedging\./);
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
});

test("prefers AGENTS.md when it exists and installs the slash command", () => {
  const dir = mkdtempSync(join(tmpdir(), "banthis-"));
  run(["--dir", dir, "--file", "AGENTS.md", "init"], { cwd: dir });

  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /banthis:meta:start/);
  assert.match(agents, /Invoke `banthis` immediately/);

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
  assert.equal(pkg.version, "0.3.1");
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

  assert.match(skill, /^version: 0\.3\.1$/m);
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
