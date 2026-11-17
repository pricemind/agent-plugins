# Let read-only Pricemind tools run without a prompt

Pricemind's read-only tools (search, context, history, previews) never change anything. Allowing them means the assistant can answer pricing questions without the client asking for permission on every lookup. Tools that change data (match, unmatch, attach, detach, crawl, pricing strategies) are not in this list and keep the client's normal permission prompt.

Only change settings after the user says yes. Show them the exact change first.

## Claude Code

Plugin tools are named `mcp__plugin_pricemind_pricemind__<tool>`. Add the entries below to `permissions.allow` in the user's settings file (`~/.claude/settings.json` for every project, or `.claude/settings.json` for one project). Merge them into the existing list; never replace the user's other entries.

```json
{
  "permissions": {
    "allow": [
      "mcp__plugin_pricemind_pricemind__crawl_get",
      "mcp__plugin_pricemind_pricemind__crawl_list_results",
      "mcp__plugin_pricemind_pricemind__crawl_list_targets",
      "mcp__plugin_pricemind_pricemind__matching_analyze_issues",
      "mcp__plugin_pricemind_pricemind__matching_explain_pair",
      "mcp__plugin_pricemind_pricemind__matching_get_context",
      "mcp__plugin_pricemind_pricemind__matching_get_job",
      "mcp__plugin_pricemind_pricemind__matching_get_pair",
      "mcp__plugin_pricemind_pricemind__matching_get_run",
      "mcp__plugin_pricemind_pricemind__matching_get_schema",
      "mcp__plugin_pricemind_pricemind__matching_get_signal_details",
      "mcp__plugin_pricemind_pricemind__matching_list_current_matches",
      "mcp__plugin_pricemind_pricemind__matching_list_history",
      "mcp__plugin_pricemind_pricemind__matching_list_job_runs",
      "mcp__plugin_pricemind_pricemind__matching_list_jobs",
      "mcp__plugin_pricemind_pricemind__matching_list_runs",
      "mcp__plugin_pricemind_pricemind__matching_preview_match",
      "mcp__plugin_pricemind_pricemind__matching_preview_match_batch",
      "mcp__plugin_pricemind_pricemind__matching_preview_unmatch",
      "mcp__plugin_pricemind_pricemind__matching_query",
      "mcp__plugin_pricemind_pricemind__matching_query_suggestions",
      "mcp__plugin_pricemind_pricemind__pricemind_list_account_channels",
      "mcp__plugin_pricemind_pricemind__pricemind_list_channels",
      "mcp__plugin_pricemind_pricemind__pricemind_search_accounts",
      "mcp__plugin_pricemind_pricemind__pricing_strategy_get",
      "mcp__plugin_pricemind_pricemind__pricing_strategy_get_context",
      "mcp__plugin_pricemind_pricemind__pricing_strategy_get_schema",
      "mcp__plugin_pricemind_pricemind__pricing_strategy_list",
      "mcp__plugin_pricemind_pricemind__pricing_strategy_preview_create",
      "mcp__plugin_pricemind_pricemind__pricing_strategy_preview_update",
      "mcp__plugin_pricemind_pricemind__product_discovery_get_comparable",
      "mcp__plugin_pricemind_pricemind__product_discovery_get_context",
      "mcp__plugin_pricemind_pricemind__product_discovery_get_group",
      "mcp__plugin_pricemind_pricemind__product_discovery_get_run",
      "mcp__plugin_pricemind_pricemind__product_discovery_list_candidates",
      "mcp__plugin_pricemind_pricemind__product_discovery_list_items",
      "mcp__plugin_pricemind_pricemind__product_discovery_list_runs",
      "mcp__plugin_pricemind_pricemind__product_discovery_preview_attach",
      "mcp__plugin_pricemind_pricemind__product_discovery_preview_detach",
      "mcp__plugin_pricemind_pricemind__product_discovery_preview_remove_comparable",
      "mcp__plugin_pricemind_pricemind__search_get_schema",
      "mcp__plugin_pricemind_pricemind__search_query"
    ]
  }
}
```

If the server was added by hand under another name (not through the plugin), the prefix is `mcp__<server name>__` instead.

## Claude on the web and desktop

Connector tool permissions are set in the client's connector settings for Pricemind. Point the user there; nothing needs to be edited by the assistant.

## Codex

Not verified yet. Codex decides approvals through its approval mode and its MCP server settings in `~/.codex/config.toml`. Do not edit Codex configuration on the user's behalf; tell them where the setting lives instead.

## Keeping the list current

The list follows the tools the Pricemind server offers. If the server adds a new read-only tool, it prompts until it is added here.
