# Own brand vs. market: query shapes

Starting points for `search_query`. Add `channel_id` to each. Check every field against the channel's schema first; these fields exist only when the schema has `product_groups.available`.

## 1. Overview of grouped products

```json
{
  "dataset": "products",
  "filter": {"and": [
    {"field": "is_grouped", "operator": "eq", "value": true},
    {"field": "priced_comparables", "operator": "gt", "value": 0},
    {"field": "enabled", "operator": "eq", "value": true}
  ]},
  "select": ["product_id", "title", "brand", "own_average", "comparable_min", "lowest_comparable", "lowest_comparable_diff_pct",
             "index_vs_comparable_min", "group_rank", "group_rank_of", "categories"],
  "sort": [{"field": "index_vs_comparable_min", "direction": "desc"}],
  "limit": 200,
  "include_total": true
}
```

Count cheaper vs priced higher in one call:

```json
{
  "dataset": "products",
  "filter": {"and": [
    {"field": "is_grouped", "operator": "eq", "value": true},
    {"field": "priced_comparables", "operator": "gt", "value": 0}
  ]},
  "metrics": [
    {"function": "count", "as": "products"},
    {"function": "count", "as": "priced_higher", "filter": {"field": "index_vs_comparable_min", "operator": "gt", "value": 100}}
  ]
}
```

Sign reminder: `lowest_comparable_diff_pct` is positive when I am cheaper; `index_vs_comparable_min` is below 100 when I am cheaper.

## 3. Retailers with a cheaper alternative

```json
{
  "dataset": "comparables",
  "filter": {"field": "is_cheaper_than_own", "operator": "eq", "value": true},
  "group_by": ["retailer"],
  "metrics": [{"function": "count_distinct", "field": "product_id", "as": "my_products_with_cheaper_alternative"}],
  "sort": [{"field": "my_products_with_cheaper_alternative", "direction": "desc"}]
}
```

The same question as a product filter: `products` with `{"exists": {"dataset": "comparables", "filter": {"and": [{"field": "is_cheaper_than_own", "operator": "eq", "value": true}, {"field": "retailer", "operator": "eq", "value": "<retailer>"}]}}}`.

## 4. By category

```json
{
  "dataset": "products",
  "filter": {"and": [
    {"field": "is_grouped", "operator": "eq", "value": true},
    {"field": "priced_comparables", "operator": "gt", "value": 0}
  ]},
  "group_by": ["categories"],
  "metrics": [
    {"function": "avg", "field": "own_vs_group_avg_pct", "as": "avg_vs_group_pct"},
    {"function": "count", "as": "products"}
  ],
  "having": [{"field": "products", "operator": "gte", "value": 5}],
  "sort": [{"field": "avg_vs_group_pct", "direction": "desc"}]
}
```

Some channels have labels instead of categories; group by `labels` then.

## 5. One product's group

```json
{"dataset": "comparables", "product_ids": [101]}
```

```json
{"dataset": "comparable_history", "product_ids": [101], "time": {"last": "90d"}, "bucket": "week"}
```
