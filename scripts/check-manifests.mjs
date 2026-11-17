#!/usr/bin/env node
// Consistency checks for the client manifests that `claude plugin validate`
// does not cover: the Codex / Agent Plugins manifests, the two MCP files, the
// marketplaces and each skill's agents/openai.yaml. No dependencies.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const errors = [];
const fail = (msg) => errors.push(msg);
const read = (p) => readFileSync(join(root, p), "utf8");
const json = (p) => {
  try {
    return JSON.parse(read(p));
  } catch (e) {
    fail(`${p}: ${e.message}`);
    return {};
  }
};

const claude = json(".claude-plugin/plugin.json");
const claudeMarket = json(".claude-plugin/marketplace.json");
const portable = json("plugin.json");
const codex = json(".codex-plugin/plugin.json");
const agentsMarket = json(".agents/plugins/marketplace.json");
const dotMcp = json(".mcp.json");
const portableMcp = json("mcp.json");

// One version everywhere.
const version = claude.version;
const versions = {
  ".claude-plugin/plugin.json": claude.version,
  ".claude-plugin/marketplace.json metadata": claudeMarket.metadata?.version,
  ".claude-plugin/marketplace.json plugins[0]": claudeMarket.plugins?.[0]?.version,
  "plugin.json": portable.version,
  ".codex-plugin/plugin.json": codex.version,
};
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) fail(`.claude-plugin/plugin.json: version ${version} is not semver`);
for (const [where, v] of Object.entries(versions)) if (v !== version) fail(`${where}: version ${v} != ${version}`);

// Same identity.
for (const [where, m] of [["plugin.json", portable], [".codex-plugin/plugin.json", codex]]) {
  if (m.name !== claude.name) fail(`${where}: name ${m.name} != ${claude.name}`);
  if (m.repository !== claude.repository) fail(`${where}: repository differs from .claude-plugin/plugin.json`);
  if (!m.description) fail(`${where}: description is empty`);
}
if (portable.$schema !== "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json") fail("plugin.json: unexpected $schema");
const portableAllowed = new Set(["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"]);
for (const key of Object.keys(portable)) if (!portableAllowed.has(key)) fail(`plugin.json: field ${key} is not in the Agent Plugins 1.0.0 schema`);

// Both MCP files point at the same server.
const dotServers = dotMcp.mcpServers ?? {};
const portableServers = portableMcp.mcpServers ?? {};
if (portableMcp.$schema !== "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json") fail("mcp.json: unexpected $schema");
for (const [name, server] of Object.entries(dotServers)) {
  const other = portableServers[name];
  if (!other) fail(`mcp.json: missing server ${name} that .mcp.json declares`);
  else if (other.url !== server.url) fail(`mcp.json: ${name} url ${other.url} != .mcp.json ${server.url}`);
  if (other && other.type !== "streamable-http") fail(`mcp.json: ${name} type must be streamable-http`);
  if (server.headers && Object.keys(server.headers).length) fail(`.mcp.json: ${name} has headers (public submission rejects them)`);
}
for (const name of Object.keys(portableServers)) if (!dotServers[name]) fail(`.mcp.json: missing server ${name} that mcp.json declares`);
if (codex.mcpServers !== "./.mcp.json") fail(`.codex-plugin/plugin.json: mcpServers should be ./.mcp.json`);
const mcpUrl = Object.values(dotServers)[0]?.url;

// OpenAI listing limits (developers.openai.com/plugins/deploy/submission).
const hex = /^#[0-9A-Fa-f]{6}$/;
const checkInterface = (where, i) => {
  if (!i) return fail(`${where}: interface missing`);
  for (const key of ["displayName", "shortDescription", "longDescription", "developerName", "category", "websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL", "composerIcon", "logo"]) {
    if (!i[key]) fail(`${where}: interface.${key} missing`);
  }
  if ((i.displayName ?? "").length > 30) fail(`${where}: displayName over 30 characters`);
  if ((i.shortDescription ?? "").length > 30) fail(`${where}: shortDescription over 30 characters`);
  if ((i.longDescription ?? "").length > 4000) fail(`${where}: longDescription over 4000 characters`);
  if ((i.developerName ?? "").length > 80) fail(`${where}: developerName over 80 characters`);
  for (const key of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
    if (i[key] && !i[key].startsWith("https://")) fail(`${where}: ${key} must be https`);
  }
  for (const key of ["brandColor", "brandColorDark"]) if (i[key] && !hex.test(i[key])) fail(`${where}: ${key} must be #RRGGBB`);
  const prompts = i.defaultPrompt ?? [];
  if (prompts.length > 3) fail(`${where}: more than 3 defaultPrompt entries`);
  for (const p of prompts) if (p.length > 128) fail(`${where}: defaultPrompt over 128 characters: ${p}`);
  for (const key of ["composerIcon", "logo", "composerIconDark", "logoDark"]) {
    const p = i[key];
    if (!p) continue;
    if (!p.startsWith("./") || p.includes("..")) fail(`${where}: ${key} must start with ./ and stay in the plugin`);
    else if (!existsSync(join(root, p))) fail(`${where}: ${key} ${p} does not exist`);
  }
};
const openai = portable.extensions?.["com.openai"] ?? {};
checkInterface("plugin.json extensions.com.openai", openai.interface);
checkInterface(".codex-plugin/plugin.json", codex.interface);
if (JSON.stringify(openai.interface) !== JSON.stringify(codex.interface)) fail("plugin.json and .codex-plugin/plugin.json interfaces differ");
if (openai.onboardingSkill && !existsSync(join(root, openai.onboardingSkill))) {
  console.warn(`warning: onboardingSkill ${openai.onboardingSkill} does not exist yet`);
}

// Marketplaces list this plugin from the repo root.
const agentsEntry = agentsMarket.plugins?.find((p) => p.name === claude.name);
if (!agentsEntry) fail(".agents/plugins/marketplace.json: plugin entry missing");
else if (agentsEntry.source?.path !== "./" && agentsEntry.source !== "./") fail(".agents/plugins/marketplace.json: source should be the repo root");
if (!claudeMarket.plugins?.some((p) => p.name === claude.name && p.source === "./")) fail(".claude-plugin/marketplace.json: plugin entry missing");

// Every skill: client-neutral SKILL.md frontmatter and an agents/openai.yaml.
const skillsDir = join(root, "skills");
for (const skill of readdirSync(skillsDir)) {
  const dir = join(skillsDir, skill);
  if (!statSync(dir).isDirectory()) continue;
  const where = `skills/${skill}`;
  const skillMd = join(dir, "SKILL.md");
  if (!existsSync(skillMd)) {
    fail(`${where}: SKILL.md missing`);
  } else {
    const front = readFileSync(skillMd, "utf8").match(/^---\n([\s\S]*?)\n---/);
    if (!front) fail(`${where}/SKILL.md: frontmatter missing`);
    else {
      const keys = front[1].split("\n").filter((l) => /^[A-Za-z_-]+:/.test(l)).map((l) => l.split(":")[0]);
      for (const k of keys) if (!["name", "description"].includes(k)) fail(`${where}/SKILL.md: frontmatter key ${k} (keep skills client-neutral: name + description only)`);
      const name = front[1].match(/^name:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
      if (name !== skill) fail(`${where}/SKILL.md: name ${name} != folder ${skill}`);
    }
  }
  const yamlPath = join(dir, "agents", "openai.yaml");
  if (!existsSync(yamlPath)) {
    fail(`${where}: agents/openai.yaml missing`);
    continue;
  }
  const yaml = readFileSync(yamlPath, "utf8");
  if (/\t/.test(yaml)) fail(`${where}/agents/openai.yaml: tabs are not valid YAML indentation`);
  for (const key of ["interface:", "display_name:", "short_description:"]) {
    if (!yaml.includes(key)) fail(`${where}/agents/openai.yaml: ${key} missing`);
  }
  const color = yaml.match(/brand_color:\s*"([^"]*)"/)?.[1];
  if (color && !hex.test(color)) fail(`${where}/agents/openai.yaml: brand_color ${color} is not #RRGGBB`);
  const url = yaml.match(/url:\s*"([^"]*)"/)?.[1];
  if (url && url !== mcpUrl) fail(`${where}/agents/openai.yaml: url ${url} != ${mcpUrl}`);
}

for (const e of errors) console.error(`error: ${e}`);
console.log(errors.length ? `${errors.length} manifest error(s)` : `manifests consistent (version ${version})`);
process.exit(errors.length ? 1 : 0);
