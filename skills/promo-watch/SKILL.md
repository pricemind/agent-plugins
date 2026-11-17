---
name: promo-watch
description: Watch for competitor price-cutting campaigns in Pricemind data - which competitors started cutting prices, how deep, since when and in which categories, compared with their normal rhythm, with charts. Use before or during sales events (Black Friday, Cyber Monday, seasonal sales, a competitor's promotion), or when the user asks "have competitors started cutting prices", "who is discounting", "is there a price war", or "which shops are running promotions".
---

# Promo watch

A read-only check for unusual competitor price cutting on one channel: who, how deep, since when and where. Use `search_get_schema` and `search_query` only. Never guess numbers.

Definitions: [references/kpi-glossary.md](references/kpi-glossary.md). Output shape: [references/report-template.md](references/report-template.md). Query shapes: [references/queries.md](references/queries.md).

## Before you start

- Reads never need approval. Run every query in this workflow without asking.
- **Channel:** if the user named one, use it. Otherwise call `pricemind_list_channels`: one channel → use it without asking; several → ask once which one and keep it for the rest of the conversation. Pricemind staff connected with "All accounts" start with `pricemind_search_accounts`, then `pricemind_list_account_channels`.
- Call `search_get_schema` once for the channel and cache it by `version`. Competitor changes need `competitor_prices:read`; without it there is nothing to watch, so say so and stop.
- **Window:** the last 14 days against the 14 days before (the baseline), unless the user names an event or dates. For a named event, also count the days left until it.

## Steps

1. **Is something happening?** Count competitor cuts (`price_changes`, `is_own` false, `direction` down) in the window and in the baseline. A cut rate clearly above the baseline (say 1.5× or more) is a campaign signal; if it is not, say so first and keep the rest short.
2. **Cuts per day.** Group the window plus baseline by `changed_at:day`. Point out the day the wave started and any spikes. A spike on one day from one shop is often a catalogue-wide repricing, not a promotion: check step 3.
3. **Who and how deep.** Group the window by `shop` with `count`, `avg` and `min` of `change_pct`. Call a shop **deep** when its average cut is −15% or deeper. Report "<n> of <m> tracked shops are cutting", the deepest average and the biggest volume.
4. **Since when.** For each of the leading shops (up to five), group its cuts by `changed_at:day` and give the first day of the current run.
5. **Where.** Group the window's cuts by `categories` (or `brand` when the channel has no categories) with `count` and `avg` of `change_pct`; name the top three categories per leading shop when the user asks for detail.
6. **What it means for me.** For the leading shops, find my products they now undercut: `offers` with that `competitor`, `is_cheaper_than_own` true, in stock and not stale, sorted by `price_vs_own_pct`. Give the count and the five largest gaps.
7. **Charts:** cuts per day, then cuts by shop.

## Reading the data honestly

- Use `price_changes` for "started cutting". `in_promotion` or a special price is not proof of a campaign: shops often show a crossed-out RRP permanently, which Pricemind stores as regular price plus special price.
- Treat cuts beyond about −70% as suspected mismatches or pack-size changes. Exclude them from averages and mention how many you excluded.
- Changes are recorded even while an offer is out of stock: a "cut" on an out-of-stock offer is not a price a shopper can pay. Say so if it matters for a shop.

## Charts

1. If your client shows Pricemind's interactive chart view for a `search_query` result, that view is the chart. Do not draw another one; add the written summary.
2. Otherwise use the chart template shipped with the price-intelligence skill: [../price-intelligence/assets/chart.html](../price-intelligence/assets/chart.html). Copy it, replace the JSON inside `<script type="application/json" id="pricemind-chart-data">` with `{"title", "subtitle", "visual": <the visual hint from search_query, unchanged>, "rows": <data.rows>, "columns": <data.columns>, "open_in_pricemind_url": <only when a tool result gave a link>}`, and open or publish the file as your client allows. Never write chart code yourself.
3. If neither is possible, show compact tables (at most 15 rows each).

## Next steps (hand-offs)

This workflow only reads. For actions:

- respond with price changes or temporary rules → the `pricing-strategies` skill;
- a cut that looks like a wrong product → the `matching-review` skill;
- one product in depth → the `price-check` skill.
