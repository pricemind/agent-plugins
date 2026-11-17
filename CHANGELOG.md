# Changelog

All notable changes to the Pricemind plugin. Versions follow [Semantic Versioning](https://semver.org/).

## 1.1.1 (2026-11-17)

Fixes from testing the chart view in a real Claude client.

- Price history comes back complete in one result (up to 360 rows), so a month of daily prices draws one chart with the right latest figures instead of one partial chart per page.
- Prices in the chart show their currency.
- A partial result is marked as such in the chart and leaves out the "now" figures it cannot know.
- The assistant no longer draws its own chart or table next to the Pricemind chart.

## 1.1.0 (2026-11-17)

Pricemind in an AI assistant should feel like a product, not a tool list.

### Charts

- Pricemind-styled, explorable charts (hover values, show or hide shops, own shop highlighted, chart/table switch). In the Claude apps they open inside the chat as an MCP App served by the Pricemind server; in Claude Code and Codex the assistant fills the same renderer, shipped as a chart page in the `price-intelligence` skill.

### Quiet approvals

- The assistant asks once per job, never per step: reads never ask, additive or reversible changes run and are reported with how to undo them, removals and price changes get one approval for the whole plan, and only a Pricemind `decision_required` stops a job midway.
- The four 1.0 skills are rewritten to this model.
- Skills use only the one-call `*_execute_*` tools and the new batch tools (`matching_execute_unmatch_batch`, `product_discovery_execute_attach_batch`, `product_discovery_execute_detach_batch`). The legacy preview-token tools are gone from the server.

### Workflows

- New skills: `weekly-review`, `management-report`, `promo-watch`, `price-check` and `own-brand-vs-market`, each ending in Pricemind charts, with report templates and a KPI glossary.
- New `setup` skill: checks sign-in, lists your channels and suggests three first questions for your data, so you never need a channel ID or a tool name.

### Codex

- One repository and one set of skills for Claude and Codex (preview): an Agent Plugins `plugin.json` and `mcp.json`, a `.codex-plugin/plugin.json` fallback for older Codex builds, `.agents/plugins/marketplace.json`, and `agents/openai.yaml` per skill.
- README sections per client.

### Repository

- GitHub Actions run `claude plugin validate --strict .`, the Agent Plugins schemas, a manifest consistency check and a tool-name drift check (`scripts/check-tool-names.mjs` against `tools.lock.json`, and against the live server when `PRICEMIND_MCP_TOKEN` is set).
- The logo moved to `assets/logo.png`.
- Version 1.1.0 in every manifest.

## 1.0.0 (2026-11-17)

- First public release: the Pricemind MCP connection with OAuth sign-in and four skills (`price-intelligence`, `matching-review`, `competitor-alternatives`, `pricing-strategies`).
