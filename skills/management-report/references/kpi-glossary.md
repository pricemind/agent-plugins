# Pricemind KPI glossary

Use these definitions when you explain a number. Field names are `search_query` fields; the schema from `search_get_schema` is the final word on what exists for a channel.

## Price basis

- **My price** depends on the channel (`channels[]` in the schema):
  - `channel_type` **ecommerce**: my shop's own selling price.
  - `channel_type` **vendor** (a brand, or a retailer's own brands): my product's listings at retailers; in product groups my price is `own_average`.
- **Incl. or excl. VAT:** `price`, `lowest_competitor_price`, offer prices and history prices are incl. tax; `price_net` and `lowest_competitor_price_net` are excl. tax. `price_basis` in the schema says which one the channel reprices on. Name the basis whenever you show money, and never mix bases in one table.
- **Effective price:** the special (promo) price when one is active, else the regular price.

## Position

- **Price difference** (`price_diff`): (cheapest fresh, in-stock competitor − my price) ÷ my price × 100, on net prices. **Negative = I am more expensive**; positive = I am cheaper. `price_diff_amount` is the same gap in money, incl. tax.
- **Price position** (`price_position` of `price_position_of`): my rank among all distinct shop prices for the product, 1 = cheapest, ties share a rank. It counts out-of-stock and stale offers too (as the Pricemind Prices grid does). `is_cheapest` / `is_most_expensive` use the same ranking.
- **Cheaper competitors** (`cheaper_competitor_count`): fresh, in-stock offers below my price.
- **Group rank** (product groups, `group_rank` of `group_rank_of`): my place among the averages of the comparable products, 1 = cheapest.

## Price index

- **Price index** = my price ÷ reference price × 100. **100 = parity; above 100 = I am more expensive; below 100 = I am cheaper.** Always say what the reference is.
  - `tier_analytics_daily.price_index`: daily, against each product's tier reference competitor. Only channels with tier analytics have it; it is the only source for an index trend across many products.
  - Without tier analytics, the **index vs cheapest competitor** for a set of products = sum of my prices ÷ sum of the cheapest competitor prices × 100, over products that have both (from `products`, metrics `sum` of `price` and of `lowest_competitor_price`). It is a snapshot of now, not a trend.
  - Product groups: `index_vs_comparable_min`, `index_vs_comparable_avg`, `index_vs_group_avg`.
- **At or below market:** share of products with `price_diff ≥ 0` (I am not above the cheapest fresh, in-stock competitor), or with `price_index ≤ 100` in tier analytics.

## Freshness and stock

- **Fresh offer:** not failing, not a 404, observed within its stale threshold (a few days by default) and not out of stock. Cheapest-competitor figures (`lowest_competitor_price`, `price_diff`) use fresh, in-stock offers only.
- **Stale** (`is_stale`): the price was observed longer ago than the threshold. Say how old (`price_updated_at`) instead of treating it as current.
- **Muted shops** (chart hint `visual.muted`): out of stock or stale, drawn muted because a shopper cannot pay that price now. **Omitted shops** (`visual.omit`): no price observed.
- In `price_history` a competitor's price is empty while it is out of stock (`in_stock` false); `carried_forward` rows repeat the last known price.

## Changes

- **Price change** (`price_changes`): one event per change, with `old_price`, `new_price`, `change_pct` = (new − old) ÷ old × 100 and `direction` up / down. `shop` is who changed; `is_own` marks my own changes. Changes are listed even when recorded while an offer was out of stock.
- **Cut** = `direction` down; **increase** = up. Treat a change beyond about −70% or +200% as a suspected mismatch or pack-size change, not a market move, until checked.

## RRP

- **RRP** (`rrp`): the recommended retail price incl. tax stored on my product.
- **RRP violation:** an offer priced below my product's RRP (for a vendor channel: a retailer selling my product under the recommended price). Compare offer prices with `products.rrp` per product; there is no RRP field on offers.
- Shops often show an RRP or "was" price crossed out: Pricemind stores the crossed-out price as the regular price and the selling price as the special price. So `in_promotion` can be a permanent strike-through, not a real promotion; use `price_changes` to see whether a price actually moved.

## Product groups

- Channels whose schema has `product_groups.available` can compare my product with **comparables** (similar products of other brands). `lowest_comparable_diff_pct` = (cheapest comparable average − my price) ÷ my price × 100: **positive = I am cheaper**. In `comparables`, `price_vs_own_pct` is negative when the comparable is cheaper.
- Comparables can differ in pack size (`pack_quantity`); unit prices are not normalised, so say so when sizes differ.
