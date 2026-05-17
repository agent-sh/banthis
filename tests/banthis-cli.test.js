import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
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
});

test("package and plugin manifests describe banthis consistently", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const claude = JSON.parse(readFileSync(".claude-plugin/plugin.json", "utf8"));
  const codex = JSON.parse(readFileSync(".codex-plugin/plugin.json", "utf8"));
  const marketplace = JSON.parse(readFileSync(".claude-plugin/marketplace.json", "utf8"));

  assert.equal(pkg.name, "@agent-sh/banthis");
  assert.equal(claude.name, "banthis");
  assert.equal(claude.version, pkg.version);
  assert.equal(marketplace.plugins[0].name, "banthis");
  assert.equal(marketplace.plugins[0].version, pkg.version);
  assert.equal(codex.skills, "./skills");
});
