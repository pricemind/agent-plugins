---
name: weekly-review
description: Weekly competitive pricing review from Pricemind data - competitor price moves in the last 7 days, products where I lost or gained price position, competitors newly out of stock, and the top 10 products to act on, with charts. Use when the user asks for a weekly review, "what happened this week", "what changed in the market", "what should I look at on Monday", or a recap of the last 7 days of prices and competitors.
---

# Weekly pricing review

A fixed, read-only review of the last 7 days for one channel, ending with the ten products most worth acting on. Use `search_get_schema` and `search_query` only. Never guess numbers.

Definitions: [references/kpi-glossary.md](references/kpi-glossary.md). Output shape: [references/report-template.md](references/report-template.md). Query shapes: [references/queries.md](references/queries.md).

## Before you start

- Reads never need approval. Run every query in this workflow without asking.
- **Channel:** if the user named one, use it. Otherwise call `pricemind_list_channels`: one channel → use it without asking; several → ask once which one and keep it for the rest of the conversation. Pricemind staff connected with "All accounts" start with `pricemind_search_accounts`, then `pricemind_list_account_channels`.
- Call `search_get_schema` once for the channel and cache it by `version`. Use only fields and competitor keys it returns. Note `channel_type`, `price_basis` and whether competitor fields are present. Without `competitor_prices:read` there are no competitor fields: say so and report only the own-price parts.
- The window is the last 7 days (`time.last: "7d"`) unless the user gives other dates. For "vs last week", run the same query for the 7 days before (`time.from`/`time.to`).

## Steps

1. **Competitor moves.** `price_changes`, competitor rows only (`is_own` false), grouped by `shop` and `direction` with `count` and `avg` of `change_pct`. Then grouped by `changed_at:day` for the daily rhythm. Report who moved most, how deep, and whether cuts or increases dominate.
2. **Position lost or gained.** Take the product_ids with competitor changes this week (group by `product_id`, sort by count, the 200 most active), then read those products: `price`, `lowest_competitor`, `lowest_competitor_price`, `price_diff`, `price_position`, `price_position_of`, `is_cheapest`. A product **lost** position when a competitor change crossed my current price from above to below (`old_price ≥ my price > new_price`); it **gained** when a competitor moved above me or my own change took me below the cheapest. Say these are judged against my price now.
3. **New out-of-stocks.** `offers` with `stock` out_of_stock on my in-stock, enabled products, grouped by `competitor`. Pricemind does not store when stock changed, so confirm "new this week" with `price_history` (`time.last: "14d"`, `bucket: "day"`) for the top products (at most 50): in stock before the window, `in_stock` false inside it. A competitor out of stock is a chance to hold or raise price; call that out.
4. **Top 10 to act on.** From `products` (enabled, in stock), pick the ten with the biggest, most actionable gap:
   - more expensive than the cheapest fresh, in-stock competitor (`price_diff` < 0), largest `price_diff_amount` first, preferring products with several cheaper competitors (`cheaper_competitor_count`);
   - or cheapest by a wide margin (`price_diff` above about +10) where price can go up;
   - include `margin` when the schema has it, so the user sees room to move.
   Give one line per product: what is wrong, the number, and the suggested direction (lower, hold, raise).
5. **Charts** (see below): competitor changes by shop, cuts per day, and the top 10 price differences.

## Charts

1. If your client shows Pricemind's interactive chart view for a `search_query` result, that view is the chart. Do not draw another one; add the written summary.
2. Otherwise use the chart template shipped with the price-intelligence skill: [../price-intelligence/assets/chart.html](../price-intelligence/assets/chart.html). Copy it, replace the JSON inside `<script type="application/json" id="pricemind-chart-data">` with `{"title", "subtitle", "visual": <the visual hint from search_query, unchanged>, "rows": <data.rows>, "columns": <data.columns>, "open_in_pricemind_url": <only when a tool result gave a link>}`, and open or publish the file as your client allows. Never write chart code yourself.
3. If neither is possible, show a compact table (at most 15 rows).

## Answer

Follow the report template: a three-line headline first, then one section per step with its chart, then caveats. Be honest about coverage: stale offers, out-of-stock shops, missing competitor rights, and changes beyond about −70% or +200% (likely mismatches or pack sizes, not market moves).

## Next steps (hand-offs)

This workflow only reads. When the user wants to act:

- change prices or repricing rules → the `pricing-strategies` skill;
- a product's competitor offer looks wrong (suspicious gap, wrong product) → the `matching-review` skill;
- one product in depth → the `price-check` skill.
