#!/usr/bin/env node
// Drift check: every Pricemind tool a skill names must exist.
//
//   node scripts/check-tool-names.mjs           # against tools.lock.json
//   PRICEMIND_MCP_TOKEN=... node scripts/check-tool-names.mjs
//                                               # also against live tools/list
//
// Fails when a skill names a tool that is not in the lock (or not live), or
// names one of the removed legacy tools. Prefixed identifiers that do not look
// like tools (error codes such as pricing_strategy_feature_disabled) only warn
// unless listed in tools.lock.json `nonTools`. Warns when the lock and the
// live server disagree. No dependencies.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { listLiveTools, DEFAULT_SERVER } from "./lib/mcp-tools.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const lock = JSON.parse(readFileSync(join(root, "tools.lock.json"), "utf8"));
const known = new Set(lock.tools);
const legacy = new Set(lock.legacy ?? []);
// Identifiers with a tool prefix that are not tools (error codes, fields).
const nonTools = new Set(lock.nonTools ?? []);
const PREFIXES = ["product_discovery", "pricing_strategy", "matching", "search", "crawl", "pricemind"];
// Second word of every tool name ("matching_execute_...", "search_query").
const TOOL_VERBS = new Set(["get", "list", "query", "preview", "execute", "start", "stop", "create", "update", "add", "link", "remove", "attach", "detach", "explain", "analyze", "match", "unmatch", "search"]);
const looksLikeTool = (name) => {
  const prefix = PREFIXES.find((p) => name.startsWith(p + "_"));
  return TOOL_VERBS.has(name.slice(prefix.length + 1).split("_")[0]);
};

// Tool names start with one of the server's tool-group prefixes.
const TOOL_NAME = /\b(?:search|matching|product_discovery|pricing_strategy|crawl|pricemind)_[a-z0-9_]*[a-z0-9]\b/g;

function* markdownFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* markdownFiles(path);
    else if (entry.endsWith(".md")) yield path;
  }
}

// name -> list of "file:line"
const referenced = new Map();
for (const file of markdownFiles(join(root, "skills"))) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      // Strip client prefixes such as `mcp__plugin_pricemind_pricemind__` so
      // permission entries are checked like bare tool names.
      const bare = line.replace(/mcp__[a-z0-9_]*?__(?=[a-z])/g, " ");
      for (const [name] of bare.matchAll(TOOL_NAME)) {
        const where = `${relative(root, file)}:${i + 1}`;
        if (!referenced.has(name)) referenced.set(name, []);
        referenced.get(name).push(where);
      }
    });
}

const errors = [];
const warnings = [];

for (const [name, places] of [...referenced].sort()) {
  if (legacy.has(name)) {
    errors.push(`legacy tool ${name} (removed from the server) at ${places.join(", ")}`);
  } else if (!known.has(name) && !nonTools.has(name)) {
    const msg = `unknown tool ${name} at ${places.join(", ")} (fix the name, or add it to nonTools in tools.lock.json if it is an error code or field)`;
    if (looksLikeTool(name)) errors.push(msg);
    else warnings.push(msg);
  }
}

const credential = process.env.PRICEMIND_MCP_TOKEN;
if (credential) {
  const url = process.env.PRICEMIND_MCP_URL || lock.server || DEFAULT_SERVER;
  const live = new Set(await listLiveTools(credential, url));
  for (const [name, places] of referenced) {
    if (known.has(name) && !live.has(name) && !(lock.principalSpecific ?? []).includes(name)) {
      errors.push(`tool ${name} is in tools.lock.json but not on ${url} at ${places.join(", ")}`);
    }
  }
  // Principal-specific tools (staff vs account) legitimately differ; only warn.
  for (const name of known) if (!live.has(name)) warnings.push(`lock has ${name}; this connection's tools/list does not`);
  for (const name of live) if (!known.has(name) && !legacy.has(name)) warnings.push(`server has ${name}; tools.lock.json does not (run scripts/update-tools-lock.mjs)`);
  for (const name of legacy) if (live.has(name)) warnings.push(`legacy tool ${name} is still live on ${url}`);
  console.log(`checked against live tools/list (${live.size} tools)`);
} else {
  console.log("PRICEMIND_MCP_TOKEN not set: checked against tools.lock.json only");
}

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(`${referenced.size} tool names referenced in skills, ${known.size} in the lock, ${errors.length} error(s)`);
process.exit(errors.length ? 1 : 0);
