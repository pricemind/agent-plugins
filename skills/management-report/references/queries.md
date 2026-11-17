# Management report: query shapes

Starting points for `search_query`. Add `channel_id` to each (history datasets need exactly one channel). Check every field against the channel's schema first.

## 1. Price index trend (channels with tier analytics)

```json
{
  "dataset": "tier_analytics_daily",
  "time": {"from": "2026-01-01", "to": "2026-06-30"},
  "group_by": ["snapshot_date:week"],
  "metrics": [
    {"function": "avg", "field": "price_index", "as": "price_index"},
    {"function": "share", "as": "at_or_below_market", "filter": {"field": "price_index", "operator": "lte", "value": 100}}
  ]
}
```

The server returns a line hint with 100 as the parity line. Run the share metric once per period (group by nothing) for the KPI tile. An empty result means the channel has no tier analytics.

## 1b. Current index without tier analytics

```json
{
  "dataset": "products",
  "filter": {"and": [
    {"field": "enabled", "operator": "eq", "value": true},
    {"field": "lowest_competitor_price", "operator": "is_not_null"},
    {"field": "price", "operator": "gt", "value": 0}
  ]},
  "metrics": [
    {"function": "sum", "field": "price", "as": "own_total"},
    {"function": "sum", "field": "lowest_competitor_price", "as": "cheapest_total"},
    {"function": "share", "as": "at_or_below_market", "filter": {"field": "price_diff", "operator": "gte", "value": 0}},
    {"function": "count", "as": "products"}
  ]
}
```

Index vs cheapest competitor = own_total ÷ cheapest_total × 100.

## 2. Competitor activity per period (stacked bars per shop)

```json
{
  "dataset": "price_changes",
  "time": {"from": "2026-04-01", "to": "2026-06-30"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "in", "value": ["up", "down"]}
  ]},
  "group_by": ["shop", "direction"],
  "metrics": [{"function": "count", "as": "changes"}],
  "sort": [{"field": "changes", "direction": "desc"}]
}
```

Run it for the prior period too, grouped by `direction` only, for the ratio.

## 3. Position heatmap: brand × competitor

```json
{
  "dataset": "offers",
  "filter": {"and": [
    {"field": "enabled", "operator": "eq", "value": true},
    {"field": "has_price", "operator": "eq", "value": true},
    {"field": "stock", "operator": "eq", "value": "in_stock"},
    {"field": "is_stale", "operator": "eq", "value": false}
  ]},
  "group_by": ["own_brand", "competitor"],
  "metrics": [
    {"function": "avg", "field": "price_vs_own_pct", "as": "competitor_vs_me_pct"},
    {"function": "count", "as": "offers"}
  ],
  "having": [{"field": "offers", "operator": "gte", "value": 20}],
  "limit": 200
}
```

`price_vs_own_pct` is (offer − my price) ÷ my price × 100: positive = the competitor is dearer than me. To pick the 10 largest brands first, group `products` by `brand` with a `count` and pass those brands as a filter (`own_brand in [...]`). For categories, group by `categories` instead of `own_brand`.

## 4. Own price changes per period

```json
{
  "dataset": "price_changes",
  "time": {"from": "2026-04-01", "to": "2026-06-30"},
  "filter": {"field": "is_own", "operator": "eq", "value": true},
  "group_by": ["direction"],
  "metrics": [{"function": "count", "as": "changes"}, {"function": "avg", "field": "change_pct", "as": "avg_change_pct"}]
}
```
