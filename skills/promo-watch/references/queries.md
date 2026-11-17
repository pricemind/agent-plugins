# Promo watch: query shapes

Starting points for `search_query`. Add `channel_id` to each (history datasets need exactly one channel). Check every field against the channel's schema first.

## 1. Cuts in the window vs the baseline

```json
{
  "dataset": "price_changes",
  "time": {"last": "14d"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "eq", "value": "down"},
    {"field": "change_pct", "operator": "gte", "value": -70}
  ]},
  "metrics": [{"function": "count", "as": "cuts"}, {"function": "count_distinct", "field": "shop", "as": "shops_cutting"}]
}
```

Baseline: the same query with `"time": {"from": "<28 days ago>", "to": "<15 days ago>"}`. Count the excluded outliers with the opposite `change_pct` condition (`lt -70`).

## 2. Cuts per day (window and baseline together)

```json
{
  "dataset": "price_changes",
  "time": {"last": "28d"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "eq", "value": "down"},
    {"field": "change_pct", "operator": "gte", "value": -70}
  ]},
  "group_by": ["changed_at:day"],
  "metrics": [{"function": "count", "as": "cuts"}]
}
```

## 3. Who and how deep

```json
{
  "dataset": "price_changes",
  "time": {"last": "14d"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "eq", "value": "down"},
    {"field": "change_pct", "operator": "gte", "value": -70}
  ]},
  "group_by": ["shop"],
  "metrics": [
    {"function": "count", "as": "cuts"},
    {"function": "avg", "field": "change_pct", "as": "avg_cut_pct"},
    {"function": "min", "field": "change_pct", "as": "deepest_cut_pct"}
  ],
  "sort": [{"field": "cuts", "direction": "desc"}]
}
```

"Tracked shops" = the competitors listed for the channel in the schema.

## 4. Since when (one shop)

The same filter plus `{"field": "shop", "operator": "eq", "value": "<shop>"}`, `"time": {"last": "28d"}`, grouped by `changed_at:day`. The run starts at the first day of the current stretch of days with cuts clearly above the shop's baseline.

## 5. Where: categories

```json
{
  "dataset": "price_changes",
  "time": {"last": "14d"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "eq", "value": "down"},
    {"field": "change_pct", "operator": "gte", "value": -70}
  ]},
  "group_by": ["categories"],
  "metrics": [{"function": "count", "as": "cuts"}, {"function": "avg", "field": "change_pct", "as": "avg_cut_pct"}],
  "sort": [{"field": "cuts", "direction": "desc"}],
  "limit": 10
}
```

Add `shop` as a second `group_by` for categories per leading shop. Grouping counts a change once per category.

## 6. My products a leading shop now undercuts

```json
{
  "dataset": "offers",
  "filter": {"and": [
    {"field": "competitor", "operator": "eq", "value": "<shop>"},
    {"field": "is_cheaper_than_own", "operator": "eq", "value": true},
    {"field": "stock", "operator": "eq", "value": "in_stock"},
    {"field": "is_stale", "operator": "eq", "value": false},
    {"field": "enabled", "operator": "eq", "value": true}
  ]},
  "select": ["product_id", "own_title", "own_price", "price", "price_vs_own_pct", "in_promotion", "price_updated_at"],
  "sort": [{"field": "price_vs_own_pct", "direction": "asc"}],
  "limit": 5,
  "include_total": true
}
```
