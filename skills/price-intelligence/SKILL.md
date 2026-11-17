---
name: price-intelligence
description: Answer competitive pricing questions from Pricemind data - where my prices sit against competitors, which products are over- or under-priced, who changed prices and when, price history and price index for a product, brand or category. Use when the user asks about prices, competitors, price position, price changes or price history in Pricemind.
---

# Price intelligence with Pricemind

Pricemind tracks the user's own catalog (a *channel*) and the matched offers of competitor shops. Answer pricing questions from that data with the `search_get_schema` and `search_query` tools. Never guess prices.

## 1. Pick the channel

- If the user names a shop, catalog or channel, call `pricemind_list_channels` and use the matching `channel_id`. If more than one could match, ask which one.
- Pricemind staff connect with "All accounts". Their first step is `pricemind_search_accounts`, then `pricemind_list_account_channels` for the chosen account. After that, every call uses only that `channel_id`.
- Read what "my price" means from the schema's `channels[]`: `channel_type` (vendor or ecommerce) and `price_basis` (for example including or excluding VAT). Say it in the answer whenever it matters.

## 2. Read the schema once

Call `search_get_schema` with the `channel_id` (and `dataset` when you know the one you need). Cache it by its `version` for the rest of the conversation. It lists:

- **datasets**:
  - `products`: my catalog with current price position;
  - `offers`: competitor offers;
  - `price_history`, `price_changes`: change over time;
  - `tier_analytics_daily`: daily price-index style aggregates;
  - `group_cells`, `comparables`, `comparable_history`: only when the channel uses product groups.
- **per-channel field families**: `price@<competitor>`, `diff@<competitor>`, `stock@<competitor>`, `custom.<field>` and `code.<key>`, with the values each one accepts.
- **operators, sortable/groupable flags and limits**.

Only use fields and competitor keys that the schema returns. Competitor price fields are missing when the connection lacks `competitor_prices:read`; say so instead of working around it.

## 3. Query narrowly

Use `search_query` with filters, a sort and a small limit that answer the exact question.

- **Price position**: which of my products are more expensive than a competitor, and by how much. Filter on `diff@<competitor>` and sort by it.
- **Cheapest competitor per product**: project the `price@...` fields for the competitors the user cares about.
- **Recent changes**: use `price_changes` with a date range, grouped by competitor or brand when the user wants totals.
- **One product over time**: use `price_history` for exactly one channel and one product.
- **Market view**: group by brand or category, and prefer counts and medians of differences over long product lists.

Start from the user's wording, such as a brand, category, SKU or EAN, and turn it into schema filters (`code.<key>`, `custom.<field>`, title search). If nothing matches, broaden one step and say what you changed.

## 4. Answer

- Lead with the answer in one or two sentences, then a compact table (at most about 15 rows), then caveats.
- When `search_query` returns a `visual` hint and the client can draw charts, draw exactly that chart from `data.rows`, following the hint's chart kind, colours, muted shops and notes, and add a short written summary.
- Be honest about coverage: unmatched products, out-of-stock offers, stale observation dates and price basis. Large jumps (for example 90% down) may be pack-size or mismatched offers; flag them instead of reporting them as market moves.
- Never show more than the user asked for, and never expose another account's data.

## Out of scope

- Fixing wrong competitor matches: use the `matching-review` skill.
- Changing repricing rules: use the `pricing-strategies` skill.
- Starting new crawls: only when the user explicitly asks to refresh data. Use `crawl_list_targets`, then `crawl_start`, and report progress with `crawl_get`.
