# Weekly review: query shapes

Starting points for `search_query`. Add `channel_id` to each. Check every field against the channel's schema first, and drop the ones it does not list.

## 1. Competitor moves by shop (stacked bars: cuts and increases per shop)

```json
{
  "dataset": "price_changes",
  "time": {"last": "7d"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "in", "value": ["up", "down"]}
  ]},
  "group_by": ["shop", "direction"],
  "metrics": [{"function": "count", "as": "changes"}],
  "sort": [{"field": "changes", "direction": "desc"}]
}
```

For the depth, run it again grouped by `shop` only, with `{"function": "avg", "field": "change_pct", "as": "avg_change_pct"}` and the filter `direction eq "down"`.

## 1b. Cuts per day (line or bars over time)

```json
{
  "dataset": "price_changes",
  "time": {"last": "7d"},
  "filter": {"and": [
    {"field": "is_own", "operator": "eq", "value": false},
    {"field": "direction", "operator": "eq", "value": "down"}
  ]},
  "group_by": ["changed_at:day"],
  "metrics": [{"function": "count", "as": "cuts"}]
}
```

## 2. Products touched by competitor changes

```json
{
  "dataset": "price_changes",
  "time": {"last": "7d"},
  "filter": {"field": "is_own", "operator": "eq", "value": false},
  "group_by": ["product_id"],
  "metrics": [{"function": "count", "as": "changes"}, {"function": "min", "field": "change_pct", "as": "deepest_change_pct"}],
  "sort": [{"field": "changes", "direction": "desc"}],
  "limit": 200
}
```

Then the products themselves (up to 500 ids):

```json
{
  "dataset": "products",
  "product_ids": [101, 102],
  "select": ["product_id", "title", "brand", "price", "lowest_competitor", "lowest_competitor_price", "price_diff", "price_diff_amount", "price_position", "price_position_of", "is_cheapest"]
}
```

To judge crossings, read the individual changes for those products (`price_changes` in row mode with `product_ids`, selecting `product_id`, `shop`, `old_price`, `new_price`, `changed_at`) and compare with each product's `price`.

## 3. Competitors out of stock on my in-stock products

```json
{
  "dataset": "offers",
  "filter": {"and": [
    {"field": "stock", "operator": "eq", "value": "out_of_stock"},
    {"field": "own_stock", "operator": "eq", "value": "in_stock"},
    {"field": "enabled", "operator": "eq", "value": true}
  ]},
  "group_by": ["competitor"],
  "metrics": [{"function": "count", "as": "out_of_stock_offers"}],
  "sort": [{"field": "out_of_stock_offers", "direction": "desc"}]
}
```

Confirm "new this week" for the top products (at most 50 ids):

```json
{"dataset": "price_history", "product_ids": [101], "time": {"last": "14d"}, "bucket": "day"}
```

## 4. Top 10 to act on: more expensive than the cheapest competitor

```json
{
  "dataset": "products",
  "filter": {"and": [
    {"field": "enabled", "operator": "eq", "value": true},
    {"field": "stock", "operator": "eq", "value": "in_stock"},
    {"field": "price_diff", "operator": "lt", "value": 0}
  ]},
  "select": ["product_id", "title", "price", "lowest_competitor", "lowest_competitor_price", "price_diff", "price_diff_amount", "cheaper_competitor_count", "margin"],
  "sort": [{"field": "price_diff_amount", "direction": "asc"}],
  "limit": 10
}
```

Sorting `price_diff_amount` ascending puts the largest overpricing in money first. With up to 30 rows that select `price_diff` and `title`, the server returns a bar-chart hint for the price differences.

Room to raise: the same query with `price_diff gt 10`, sorted by `price_diff` descending.
