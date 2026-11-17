#!/usr/bin/env node
// Refresh tools.lock.json from the live server.
//
//   PRICEMIND_MCP_TOKEN=... node scripts/update-tools-lock.mjs [--merge]
//
// Without --merge the lock becomes exactly this connection's tools/list.
// Use --merge to keep names the connection cannot see (for example
// staff-only tools when refreshing with an account-scoped token).
// Legacy names are never written into `tools`.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listLiveTools, DEFAULT_SERVER } from "./lib/mcp-tools.mjs";

const credential = process.env.PRICEMIND_MCP_TOKEN;
if (!credential) {
  console.error("Set PRICEMIND_MCP_TOKEN to a Pricemind MCP access token.");
  process.exit(2);
}

const path = join(fileURLToPath(new URL("..", import.meta.url)), "tools.lock.json");
const lock = JSON.parse(readFileSync(path, "utf8"));
const url = process.env.PRICEMIND_MCP_URL || lock.server || DEFAULT_SERVER;
const live = await listLiveTools(credential, url);
const legacy = new Set(lock.legacy ?? []);

const next = new Set(live.filter((name) => !legacy.has(name)));
if (process.argv.includes("--merge")) for (const name of lock.tools) next.add(name);

const before = new Set(lock.tools);
const added = [...next].filter((n) => !before.has(n));
const removed = [...before].filter((n) => !next.has(n));

lock.tools = [...next].sort();
lock.updated = new Date().toISOString().slice(0, 10);
lock.source = `tools/list from ${url}${process.argv.includes("--merge") ? " merged with the previous lock" : ""}`;
writeFileSync(path, JSON.stringify(lock, null, 2) + "\n");

console.log(`tools.lock.json: ${lock.tools.length} tools (+${added.length} -${removed.length})`);
for (const n of added) console.log(`  + ${n}`);
for (const n of removed) console.log(`  - ${n}`);
const stillLive = live.filter((n) => legacy.has(n));
if (stillLive.length) console.warn(`legacy tools still live: ${stillLive.join(", ")}`);
