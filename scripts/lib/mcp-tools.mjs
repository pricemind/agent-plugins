// Minimal MCP client (streamable HTTP, JSON-RPC) that lists the tools a
// Pricemind connection can see. No dependencies; Node 20+ (global fetch).

export const DEFAULT_SERVER = "https://mcp.pricemind.io/mcp";

async function rpc(url, credential, sessionId, body) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${credential}`,
    "mcp-protocol-version": "2025-06-18",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok && res.status !== 202) {
    throw new Error(`${body.method}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const session = res.headers.get("mcp-session-id") ?? sessionId;
  if (body.id === undefined) return { session, message: null };
  const text = await res.text();
  const type = res.headers.get("content-type") ?? "";
  let message = null;
  if (type.includes("text/event-stream")) {
    // Take the JSON-RPC response with our id from the SSE stream.
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const parsed = JSON.parse(line.slice(5).trim());
      if (parsed.id === body.id) message = parsed;
    }
  } else {
    message = JSON.parse(text);
  }
  if (!message) throw new Error(`${body.method}: no response in stream`);
  if (message.error) throw new Error(`${body.method}: ${JSON.stringify(message.error)}`);
  return { session, message };
}

/** Returns the sorted tool names from tools/list, following pagination. */
export async function listLiveTools(credential, url = DEFAULT_SERVER) {
  const init = await rpc(url, credential, null, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "agent-plugins-ci", version: "1.0.0" },
    },
  });
  const session = init.session;
  await rpc(url, credential, session, { jsonrpc: "2.0", method: "notifications/initialized" });
  const names = [];
  let cursor;
  let id = 2;
  do {
    const { message } = await rpc(url, credential, session, {
      jsonrpc: "2.0",
      id: id++,
      method: "tools/list",
      params: cursor ? { cursor } : {},
    });
    for (const tool of message.result.tools ?? []) names.push(tool.name);
    cursor = message.result.nextCursor;
  } while (cursor);
  return [...new Set(names)].sort();
}
