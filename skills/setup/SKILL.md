---
name: setup
description: First run of Pricemind in an AI assistant - check that the Pricemind connection is signed in, find the user's channels, explain what the assistant can and cannot do with Pricemind, and suggest three first questions based on the user's own data. Use when the user has just installed Pricemind, asks how to get started, asks what Pricemind can do here, or a Pricemind tool reports that sign-in is missing.
---

# Pricemind setup

Goal: a new user reaches a first useful answer without knowing a channel ID or a tool name. Keep it short and friendly; this is a guided first run, not a manual.

Everything here is read-only. Do not ask permission to look things up.

## 1. Check sign-in

Call `pricemind_list_channels`. Staff connections signed in with "All accounts" do not have that tool; they have `pricemind_search_accounts` instead (see the last bullet).

- **It works:** go to step 2.
- **It reports missing or expired sign-in (unauthorized, 401, no token):** explain that Pricemind needs a one-time sign-in in the browser, then give the hint for the client the user is in:
  - Claude Code: open the MCP server list (`/mcp`), pick `pricemind`, choose Authenticate.
  - Claude on the web or desktop: open the connector settings, find Pricemind, choose Connect.
  - Codex: run `codex mcp login pricemind`.
  - Other clients: use the client's sign-in or connect action for the Pricemind MCP server.

  On the Pricemind consent page the user picks the account and the access level: "Read" for analysis only, or "Read and make changes" to also approve matches, build product groups and change pricing strategies. Ask them to tell you when it is done, then try again.
- **Pricemind staff with "All accounts" access:** ask which customer account to work in, find it with `pricemind_search_accounts`, then list its channels with `pricemind_list_account_channels`.

## 2. Pick the channel

A *channel* is one of the user's catalogs (a shop, a vendor catalog) that Pricemind compares against competitors.

- **One channel:** use it without asking. Say which one it is in one line.
- **Several channels:** show them as a short list (name, type, product count when available) and ask once which one to use. Keep that choice for the rest of the conversation; only switch when the user names another channel.

## 3. Look at the data

Call `search_get_schema` for the channel. From it, note:

- the competitors tracked (the `price@<competitor>` keys);
- the price basis (for example including VAT) and channel type;
- the datasets available, in particular whether the channel uses product groups (`group_cells`, `comparables`).

Optionally run one small `search_query` (for example product count by brand, limit 5) to get real names to put in the suggestions.

## 4. Explain what the assistant can do

In four or five lines, in the user's language:

- **Answer pricing questions** from Pricemind data: price position, cheapest competitor, price changes, history, price index, with Pricemind charts.
- **Review and fix matches** between the user's products and competitor listings.
- **Find competitor alternatives** (comparable models from other brands) and build product groups.
- **Explain and change pricing strategies.**
- **How changes work:** questions and lookups never need approval. When the user asks for something that adds data (approve matches, attach offers, start a refresh), the assistant does it and reports what changed and how to undo it. Before removing things or changing prices it shows the whole plan once and asks one question, then finishes the job. If the connection is "Read" only, it can analyse but not change anything.

## 5. Suggest three first questions

Write three questions that fit this channel's real data, using real competitor, brand or category names from step 3. Pick from these patterns:

- Position: "Where am I more expensive than <competitor> on in-stock products?"
- Movement: "Which competitors changed prices in the last 7 days, and on which brands?"
- One product: "Show the price history of <product> against all competitors."
- Groups (only if the channel has product groups): "How does my own brand compare with the cheapest comparable product in <category>?"
- Matching (only if the connection can make changes): "Are there suspicious matches for <brand>?"

Offer to run the first one right away.

## 6. Offer to stop read-only prompts (optional)

Some clients ask for permission on every tool call, including read-only lookups. Offer once: "Do you want me to allow Pricemind's read-only tools so lookups never ask for permission? Your client will still show its own permission prompt for tools that change data." Only on a yes, follow [references/allow-read-tools.md](references/allow-read-tools.md): show the exact settings change, apply it, and say how to revert it. On a no, drop it.
