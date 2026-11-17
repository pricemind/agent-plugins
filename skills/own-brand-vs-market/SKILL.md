---
name: own-brand-vs-market
description: Compare own-brand or private-label products (or a brand's products) with the cheapest comparable products of other brands in Pricemind product groups - how many are cheaper or priced higher, by how much, at which retailers the cheaper alternatives sit, and by category, with charts. Use when the user asks "how do our own-brand prices compare with the cheapest alternatives", "which private labels have a cheaper branded alternative", "where do I rank in my product groups", or about Vendor View comparisons.
---

# Own brand vs. market

A read-only comparison of my grouped products (own brands, private labels, or a brand's range) with their comparable products from other brands. Use `search_get_schema` and `search_query` only. Never guess numbers.

Definitions: [references/kpi-glossary.md](references/kpi-glossary.md). Output shape: [references/report-template.md](references/report-template.md). Query shapes: [references/queries.md](references/queries.md).

## Before you start

- Reads never need approval. Run every query in this workflow without asking.
- **Channel:** if the user named one, use it. Otherwise call `pricemind_list_channels`: one channel → use it without asking; several → prefer the channels whose schema has `product_groups.available`, and ask once which one if more than one does. Keep it for the rest of the conversation. Pricemind staff connected with "All accounts" start with `pricemind_search_accounts`, then `pricemind_list_account_channels`.
- Call `search_get_schema` once for the channel and cache it by `version`. This workflow needs `product_groups.available`. If the channel has no product groups, say that comparables are set up per product (the `competitor-alternatives` skill can research and add them) and stop.
- Read `channel_type`: on a **vendor** channel my price in a group (`own_average`) is my average across the retailers where my listing counts (`group_basis` market), or My Price for an own brand listed nowhere (`group_basis` own_price). Say which one the numbers use.

## Steps

1. **Overview.** `products` with `is_grouped` true and at least one priced comparable, selecting `title`, `brand`, `own_average`, `comparable_min`, `lowest_comparable`, `lowest_comparable_diff_pct`, `index_vs_comparable_min`, `group_rank`, `group_rank_of`, `categories`. Narrow to the own brands the user means (`brand in [...]`) when they name them.
   - **Gap to the cheapest alternative** = `index_vs_comparable_min` − 100: negative = I am cheaper, positive = I am priced higher.
   - Count cheaper vs priced higher, and compute the median gap from the rows (there is no median metric; page through all rows first, at most a few hundred).
2. **Priced higher.** List the products with a positive gap, largest first: my price, the cheapest alternative and its brand, the gap.
3. **Where the cheaper alternatives are.** `comparables` rows with `is_cheaper_than_own` true, grouped by `retailer` with `count_distinct` of `product_id`: at which retailers shoppers find a cheaper alternative to my products.
4. **By category.** `products` (grouped) grouped by `categories` with `avg` of `own_vs_group_avg_pct` and a count, keeping categories with at least 5 products.
5. **One product, on request.** `comparables` with that `product_id` (every comparable's offers on one price axis against my price) and `comparable_history` for its prices over time.

## Charts

1. If your client shows Pricemind's interactive chart view for a `search_query` result, that view is the chart. Do not draw another one; add the written summary.
2. Otherwise use the chart template shipped with the price-intelligence skill: [../price-intelligence/assets/chart.html](../price-intelligence/assets/chart.html). Copy it, replace the JSON inside `<script type="application/json" id="pricemind-chart-data">` with `{"title", "subtitle", "visual": <the visual hint from search_query, unchanged>, "rows": <data.rows>, "columns": <data.columns>, "open_in_pricemind_url": <only when a tool result gave a link>}`, and open or publish the file as your client allows. Never write chart code yourself.
3. **Gap chart (step 1):** the server does not hint a chart for this list. Add a `gap_pct` value (`index_vs_comparable_min` − 100) to each row and to `columns` (type number), sort the rows by it, and pass `{"kind": "bar", "title": "Your price vs. cheapest alternative", "x": "title", "y": "gap_pct", "notes": ["below zero: I am cheaper than the cheapest alternative; above zero: priced higher"]}` as `visual`. The template supplies the Pricemind colours.
4. If neither is possible, show compact tables (at most 15 rows each).

## Answer

Lead with one sentence: "You're cheaper on <n> of <m> products, a median <x%> below the cheapest alternative. <k> are priced higher:" then the gap chart, the priced-higher table, retailers and categories. Caveats: comparables can differ in pack size (`pack_quantity`) and unit prices are not normalised; groups whose comparables have no offers yet; the price basis.

## Next steps (hand-offs)

This workflow only reads. For actions:

- reprice the products priced higher → the `pricing-strategies` skill;
- add or fix comparable products → the `competitor-alternatives` skill;
- an alternative that is not really comparable → the `competitor-alternatives` skill (remove it from the group).
