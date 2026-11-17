# Price check: query shapes

Starting points for `search_query`. Add `channel_id` to each (history datasets need exactly one channel). Check every field against the channel's schema first.

## 1. Find the product

By code:

```json
{"dataset": "products", "filter": {"field": "sku", "operator": "eq", "value": "12345"}, "select": ["product_id", "title", "sku", "ean", "price"], "limit": 5}
```

By words:

```json
{"dataset": "products", "search": "bosch gsr 18v-55", "select": ["product_id", "title", "sku", "price"], "limit": 5}
```

`search` matches title, product codes and searchable custom fields word by word and adds a `relevance` field.

## 2. My price and position

```json
{
  "dataset": "products",
  "product_ids": [101],
  "select": ["product_id", "title", "price", "regular_price", "special_price", "stock", "price_updated_at", "is_stale",
             "lowest_competitor", "lowest_competitor_price", "price_diff", "price_position", "price_position_of",
             "cheaper_competitor_count", "margin", "rrp"]
}
```

## 3. Every competitor (price ladder)

```json
{
  "dataset": "offers",
  "product_ids": [101],
  "select": ["competitor", "title", "brand", "price", "stock", "price_updated_at", "is_stale", "price_vs_own_pct", "own_price", "match_source", "url"],
  "sort": [{"field": "price"}]
}
```

## 4. History (step lines)

```json
{"dataset": "price_history", "product_ids": [101], "time": {"last": "90d"}, "bucket": "day"}
```

Narrow to a few shops with `"competitors": ["shop-a.com", "shop-b.com"]`; my own series is always kept. For who moved when, list `price_changes` for the product over the same window.

## 7. Comparables (channels with product groups)

```json
{"dataset": "comparables", "product_ids": [101]}
```

The default columns include `comparable_brand`, `comparable_title`, `retailer`, `price`, `own_average`, `price_vs_own_pct` and `pack_quantity`. Group history: `comparable_history` with the same `product_ids` (at most 10).
