---
name: price-intelligence
description: Answer ad-hoc competitive pricing questions from Pricemind data - where my prices sit against competitors, which products are over- or under-priced, price position and price index for a brand, category or competitor - and show the answer as a Pricemind chart. Use for any pricing or competitor question in Pricemind that is not a single-product check, a weekly review, a promotion watch, a management report or an own-brand comparison; those have their own skills.
---

# Price intelligence with Pricemind

Pricemind tracks the user's own catalog (a *channel*) and the matched offers of competitor shops. Answer pricing questions from that data with `search_get_schema` and `search_query`. Never guess prices.

Everything in this skill is read-only: never ask the user for permission to look something up, just answer.

## 1. Pick the channel

- One channel on the connection: use it without asking.
- Several channels: if the user names a shop, catalog or channel, call `pricemind_list_channels` and use the matching `channel_id`. Otherwise ask once which channel, then keep using it for the rest of the conversation.
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
- **Market view**: group by brand or category, and prefer counts and averages of differences over long product lists.

Start from the user's wording, such as a brand, category, SKU or EAN, and turn it into schema filters (`code.<key>`, `custom.<field>`, title search). If nothing matches, broaden one step and say what you changed.

## 4. Show the chart

`search_query` returns a `visual` hint (chart kind, columns, colours, muted shops, notes) with its rows. Never write chart code yourself.

1. **The host shows the Pricemind chart view.** Some clients display an interactive Pricemind chart directly under the `search_query` result. Then do not draw anything; refer to the chart in your answer.
2. **Otherwise use the template.** Copy [assets/chart.html](assets/chart.html) and fill only its data block:

   ```html
   <script type="application/json" id="pricemind-chart-data">
   {"title": "...", "subtitle": "...", "visual": <the visual hint, unchanged>,
    "rows": <data.rows>, "columns": <data.columns>, "open_in_pricemind_url": "<link when the result has one>"}
   </script>
   ```

   Then open the file or publish it as a page, whichever the client supports. Keep the hint as returned: it already carries the Pricemind colours, the own-shop highlight and the muted shops. The workflow skills change it only where they say so (for example switching a grouped bar to a heatmap).
3. **The client cannot show HTML at all.** Give the table and the written summary only.

## 5. Answer

- Lead with the answer in one or two sentences, then the chart, then a compact table (at most about 15 rows), then caveats.
- Be honest about coverage: unmatched products, out-of-stock offers, stale observation dates and price basis. Large jumps (for example 90% down) may be pack-size or mismatched offers; flag them instead of reporting them as market moves.
- Never show more than the user asked for, and never expose another account's data.

## Refreshing data

When the user asks to refresh prices, start the crawl without asking again: `crawl_list_targets`, then `crawl_start`, then report progress with `crawl_get`. A crawl only adds fresh observations; nothing needs undoing.

## Out of scope

- Fixing wrong competitor matches: use the `matching-review` skill.
- Changing repricing rules: use the `pricing-strategies` skill.
