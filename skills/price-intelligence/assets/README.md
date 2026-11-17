# Pricemind chart template

`chart.html` draws a Pricemind chart from a `search_query` result in the Pricemind chart style, light and dark, with no libraries and no network access. It is the fallback for clients that cannot show the Pricemind chart view (the MCP App `ui://pricemind/chart`), such as Claude Code in a terminal or Codex CLI. Both draw from the same file, so the chart looks the same everywhere.

Do not edit it here. The source is the Pricemind MCP server, which serves the same file as its chart view; `scripts/sync-chart.sh` copies it from a server checkout.

## Use

1. Copy `chart.html` to a new file.
2. Replace `null` inside `<script type="application/json" id="pricemind-chart-data">null</script>` with one JSON object (below). Escape `</` as `<\/` inside strings.
3. Open the file in a browser or publish it as a page.

## Data object

```json
{
  "title": "Price history: own price vs competitors",
  "subtitle": "Bosch GSR 18V-55 · last 90 days",
  "visual": { "kind": "step_line", "x": "bucket_start", "y": "price", "series": "shop" },
  "rows": [ { "shop": "emag.bg", "bucket_start": "2026-10-01T00:00:00Z", "price": 229 } ],
  "columns": [ { "name": "price", "type": "number" } ],
  "open_in_pricemind_url": "https://app.pricemind.io/channels/12/prices/"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `rows` | yes | `data.rows` from `search_query`, unchanged. |
| `visual` | no | The `visual` hint exactly as `search_query` returned it. Without it the page shows a table. |
| `columns` | no | `data.columns` from `search_query`; types improve number and date formatting. |
| `title`, `subtitle` | no | `title` defaults to `visual.title`. |
| `open_in_pricemind_url` | no | The "Open in Pricemind" button is hidden when it is missing and no single `channel_id` is given. |
| `channel_id`, `currency`, `locale`, `shops` | no | `currency` (ISO code) adds the currency sign; `shops` is `data.shops`. |

The raw `search_query` result (`{"data": {...}, "visual": {...}}`) is accepted as is.

## Hint rules

- Kinds: `step_line`, `line`, `bar`, `grouped_bar`, `stacked_bar`, `price_ladder`, `timeline`, `heatmap`.
- Every colour, muted or omitted shop, highlight and note is optional. Missing colours fall back to the Pricemind palette (own shop indigo, seven competitor colours, then grey), so a minimal hint such as `{"kind": "bar", "x": "title", "y": "gap_pct"}` works.
- Heatmap from a grouped bar: set `kind` to `"heatmap"` on a `grouped_bar` hint and keep its rows. Rows are the `x` values, columns the `series` values, cells the `y` value. The scale diverges at 100 for an index, at 0 for signed percentages (diff, gap, change, vs own) or values that cross zero, and shades from neutral to indigo otherwise.
- Add `#theme=dark` or `#theme=light` to the file URL to pin the theme; otherwise it follows the system.
