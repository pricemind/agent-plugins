---
name: pricing-strategies
description: Inspect, explain, draft and safely change competitive pricing strategies (repricing rules) for a Pricemind channel - for example "match the cheapest competitor but never below cost plus 10%" or "stay 2% under Shop X for brand Y". Use when the user asks how their repricing works, wants a new pricing rule, or wants to change an existing one.
---

# Pricing strategies in Pricemind

A pricing strategy is a typed rule that turns competitor prices into a recommended or applied price for products in one channel. Changes can move real shelf prices, so be precise and always preview.

## Hard rules

- Work in exactly one `channel_id`.
- Start with `pricing_strategy_get_context`. Call `pricing_strategy_get_schema` only when its version is new to you, and build drafts strictly from that schema.
- Never send `enabled`, `priority`, raw `rule_logic`, account scope or any provider secrets. Those stay with the user in the Pricemind app.
- Before an update, read the exact current strategy with `pricing_strategy_get`, so the draft starts from its current version.
- Preview first:
  - new strategy: `pricing_strategy_preview_create`;
  - change: `pricing_strategy_preview_update`.
  
  Show the user the preview: which products are affected, the old and new rule, and warnings. Then execute the approved draft with `pricing_strategy_execute_create` or `pricing_strategy_execute_update`, using the preparation token.
- Stop and report on a version conflict, missing permissions, a scope expansion or an unacknowledged material warning. Re-prepare an expired token only within the same approved scope.
- A read-only connection cannot change strategies. Tell the user to reconnect with "Read and make changes".

## Workflow

1. **Understand.** `pricing_strategy_list` shows the channel's strategies. Explain them in plain language: which products, which competitors, which target position, which limits (floor and ceiling, cost or margin guards, rounding).
2. **Draft.** Turn the user's goal into the schema's fields. Ask only about decisions the schema needs and the user has not given, such as the floor price basis or rounding.
3. **Check impact.** Optionally use the `price-intelligence` skill (`search_query`) to show how many products would move and roughly by how much.
4. **Preview, confirm, execute, verify.** After executing, read the strategy back and report its version.

If pricing strategies are not enabled for the channel (`pricing_strategy_feature_disabled`), say so and point the user to Pricemind support or their account settings. Do not try to work around it.
