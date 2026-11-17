---
name: management-report
description: Period-over-period pricing review for management from Pricemind data - price index against the market, share of products at or below market, price position by brand or category and competitor (heatmap), and competitor price activity, in a fixed report structure with charts. Use when the user asks for a management report, a quarterly or monthly pricing review, a board or leadership update, "prepare the Q2 pricing review", or how our price position changed between two periods.
---

# Management pricing report

A fixed, read-only report that compares two periods for one channel and is ready to present. Use `search_get_schema` and `search_query` only. Never guess numbers.

Definitions: [references/kpi-glossary.md](references/kpi-glossary.md). Output shape: [references/report-template.md](references/report-template.md). Query shapes: [references/queries.md](references/queries.md).

## Before you start

- Reads never need approval. Run every query in this workflow without asking.
- **Channel:** if the user named one, use it. Otherwise call `pricemind_list_channels`: one channel → use it without asking; several → ask once which one and keep it for the rest of the conversation. Pricemind staff connected with "All accounts" start with `pricemind_search_accounts`, then `pricemind_list_account_channels`.
- Call `search_get_schema` once for the channel and cache it by `version`. Use only fields and competitor keys it returns. Note `channel_type`, `price_basis`, and whether competitor fields are present (they need `competitor_prices:read`; without them say so and report only own-price figures).
- **Periods:** take them from the user ("Q2" = 1 April – 30 June of the current year, "last month", explicit dates). Default: the last full calendar quarter against the quarter before. Compare equal-length periods. History datasets cover at most 400 days.

## Steps

1. **Price index trend.** If the channel has tier analytics (`tier_analytics_daily` returns rows), chart the index over both periods: group by `snapshot_date:week` with `avg` of `price_index`, and per period the share of products with `price_index ≤ 100`. If it returns nothing, the channel has no index history: say so plainly, and give the **current** index vs the cheapest competitor from `products` (sum of `price` ÷ sum of `lowest_competitor_price` × 100) and the current share with `price_diff ≥ 0`. Never present a snapshot as a trend.
2. **Competitor activity.** `price_changes` for each period, competitor rows only, grouped by `shop` and `direction`: count of cuts and increases per competitor and the ratio between periods ("2.1× Q1"). Name the two or three competitors that lead it.
3. **Position by brand or category × competitor (heatmap).** `offers` on my enabled products with a fresh, in-stock price, grouped by `own_brand` (or `categories` when the user thinks in categories, or when the channel has no brands) and `competitor`, with `avg` of `price_vs_own_pct` and a `count`; keep groups with at least 20 offers (`having`). Limit to the 10 largest brands or categories and the channel's main competitors. This is the current position; say so.
4. **Own price moves.** `price_changes` with `is_own` true per period: how often and in which direction we changed prices, so the reader sees whether the index moved because of us or the market.
5. **Write it up** with the template: KPI tiles, the charts, a short "what changed and why", and up to three recommendations.

## Charts

1. If your client shows Pricemind's interactive chart view for a `search_query` result, that view is the chart. Do not draw another one; add the written summary.
2. Otherwise use the chart template shipped with the price-intelligence skill: [../price-intelligence/assets/chart.html](../price-intelligence/assets/chart.html). Copy it, replace the JSON inside `<script type="application/json" id="pricemind-chart-data">` with `{"title", "subtitle", "visual": <the visual hint from search_query, unchanged>, "rows": <data.rows>, "columns": <data.columns>, "open_in_pricemind_url": <only when a tool result gave a link>}`, and open or publish the file as your client allows. Never write chart code yourself.
3. **Heatmap:** the brand × competitor query comes back with a `grouped_bar` hint. Keep that hint and change only `kind` to `heatmap`: the template draws the hint's `x` values as rows and its `series` values as columns. Brands or categories should be the rows; if the hint has them the other way round, swap `x` and `series`. Colour reads: positive = competitors are dearer than me (good), negative = they are cheaper.
4. If neither is possible, show compact tables (at most 15 rows each).

## Answer

Follow the report template exactly, so reports from different months line up. Lead with three KPI tiles (index, share at or below market, competitor cuts), each with the prior period beside it. Keep the narrative to what the numbers show; label anything inferred as an interpretation. End with caveats: price basis, coverage (tracked products, competitors), data the channel lacks (no tier analytics, no brands), suspected mismatches.

## Next steps (hand-offs)

This workflow only reads. For actions:

- change prices or repricing rules → the `pricing-strategies` skill;
- suspicious gaps that look like wrong matches → the `matching-review` skill;
- a recent wave of competitor cuts → the `promo-watch` skill.
