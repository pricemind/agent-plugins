---
name: price-check
description: Check one product in Pricemind - my price, every competitor's price, stock and freshness, where I rank, the price history chart, and a warning when a competitor match looks wrong. Use when the user names a single product, SKU, EAN or model and asks "how is X priced", "who is cheaper on X", "check the price of X", "price history of X", or "why is X not selling".
---

# Price check for one product

A read-only, one-product deep dive: my price against every matched competitor, its history, and whether the matches can be trusted. Use `search_get_schema` and `search_query` only. Never guess numbers.

Definitions: [references/kpi-glossary.md](references/kpi-glossary.md). Output shape: [references/report-template.md](references/report-template.md). Query shapes: [references/queries.md](references/queries.md).

## Before you start

- Reads never need approval. Run every query in this workflow without asking.
- **Channel:** if the user named one, use it. Otherwise call `pricemind_list_channels`: one channel → use it without asking; several → ask once which one and keep it for the rest of the conversation. Pricemind staff connected with "All accounts" start with `pricemind_search_accounts`, then `pricemind_list_account_channels`.
- Call `search_get_schema` once for the channel and cache it by `version`. Note `channel_type`, `price_basis` and whether competitor fields are present (they need `competitor_prices:read`).

## Steps

1. **Find the product.** Search `products` by what the user gave: `sku` or `ean` with `eq`, a `code.<key>` from the schema, or `search` for title words. One hit → go on. Several → show up to five (title, SKU, price) and ask which one. None → broaden once (drop a word, try another code key) and say what you tried.
2. **My price and position.** From `products`: `price`, `regular_price`, `special_price`, `stock`, `price_updated_at`, `is_stale`, `lowest_competitor`, `lowest_competitor_price`, `price_diff`, `price_position` of `price_position_of`, `cheaper_competitor_count`, and `margin` and `rrp` when present.
3. **Every competitor.** `offers` for the product: competitor, title, price, stock, `price_updated_at`, `is_stale`, `price_vs_own_pct`, `match_source`, `url`. The server answers with a price-ladder chart hint: every shop on one price axis, mine as the reference line, stale and out-of-stock shops muted.
4. **History.** `price_history` for the product over 90 days (`bucket: "day"`; `week` for longer windows). The server answers with a step-line chart hint, my line on top. Say who led the recent moves and when.
5. **Match-quality check.** Flag an offer as a **suspected wrong match** when any of these hold, and say which:
   - its price is less than half or more than double mine (`price_vs_own_pct` below −50 or above +100);
   - its title names a different model, size, pack quantity or variant than mine;
   - its brand differs from mine and the channel is not tracking alternatives.
   Keep flagged offers out of "cheapest competitor" in your summary, and tell the user that the `matching-review` skill can confirm or remove them.
6. **RRP.** When `rrp` is set, list competitors priced below it (an RRP violation for a vendor channel).
7. **Product groups.** When the channel has `product_groups.available` and the product `is_grouped`, add the comparables: `comparables` for this product (brand · retailer prices against my price) and, if asked, `comparable_history`.

## Charts

1. If your client shows Pricemind's interactive chart view for a `search_query` result, that view is the chart. Do not draw another one; add the written summary.
2. Otherwise use the chart template shipped with the price-intelligence skill: [../price-intelligence/assets/chart.html](../price-intelligence/assets/chart.html). Copy it, replace the JSON inside `<script type="application/json" id="pricemind-chart-data">` with `{"title", "subtitle", "visual": <the visual hint from search_query, unchanged>, "rows": <data.rows>, "columns": <data.columns>, "open_in_pricemind_url": <only when a tool result gave a link>}`, and open or publish the file as your client allows. Never write chart code yourself.
3. If neither is possible, show a compact table.

## Answer

Lead with one sentence: where I stand ("You are 3rd of 6 at 249.00 €; Shop X is cheapest at 229.00 €, 8% below you, in stock."). Then the ladder, the competitor table, the history chart with two or three sentences, then warnings (suspected wrong matches, stale or out-of-stock offers, RRP violations, price basis).

## Next steps (hand-offs)

This workflow only reads. For actions:

- a suspected wrong match → the `matching-review` skill;
- change this product's price or rule → the `pricing-strategies` skill;
- comparable products of other brands → the `competitor-alternatives` skill.
