---
name: pricing-strategies
description: Inspect, explain, draft and change competitive pricing strategies (repricing rules) for a Pricemind channel - for example "match the cheapest competitor but never below cost plus 10%" or "stay 2% under Shop X for brand Y". Use when the user asks how their repricing works, wants a new pricing rule, or wants to change an existing one.
---

# Pricing strategies in Pricemind

A pricing strategy is a typed rule that turns competitor prices into a recommended or applied price for products in one channel. Creating or changing one can move real shelf prices.

## How changes work: one approval per job

- **Reading and explaining** strategies never needs a question.
- **Creating or changing** a strategy moves prices, so show the plan once: the affected products (count and a few examples), the old and new rule, the expected price moves and any warnings. Ask one question. After the yes, execute and report; do not ask again for the same job.
- If the user already approved an exact change in their request ("create this rule: ..."), the plan is the approval: execute, then report.
- **The server returns `decision_required`** (version conflict, scope expansion, material warning): the only mid-job stop. Explain the reason, ask once, continue with the answer.
- A read-only connection cannot change strategies. Tell the user to reconnect with "Read and make changes".

## Rules

- Work in exactly one `channel_id`.
- Start with `pricing_strategy_get_context`. Call `pricing_strategy_get_schema` only when its version is new to you, and build drafts strictly from that schema.
- Never send `enabled`, `priority`, raw `rule_logic`, account scope or any provider secrets. Those stay with the user in the Pricemind app.
- Before an update, read the exact current strategy with `pricing_strategy_get`, so the draft starts from its current version. Keep that version: it is the undo.

## Workflow

1. **Understand.** `pricing_strategy_list` shows the channel's strategies. Explain them in plain language: which products, which competitors, which target position, which limits (floor and ceiling, cost or margin guards, rounding).
2. **Draft.** Turn the user's goal into the schema's fields. Ask only about decisions the schema needs and the user has not given, such as the floor price basis or rounding. Collect those in the same single question as the approval.
3. **Plan.** Call `pricing_strategy_preview_create` or `pricing_strategy_preview_update` once to get the affected products and warnings for the plan. Optionally use the `price-intelligence` skill (`search_query`) to show how many products would move and roughly by how much.
4. **Execute.** After the approval, call `pricing_strategy_execute_create` or `pricing_strategy_execute_update` with the approved draft as `intent`, a stable `idempotency_key` (reuse it on retries) and `acknowledgements` only for the warnings the user's approval covered.
5. **Report.** Read the strategy back with `pricing_strategy_get` and report its version, what changed and how to undo it:
   - an update is undone by applying the previous version's values with `pricing_strategy_execute_update`;
   - a new strategy is switched off or removed by the user in the Pricemind app (this connection does not change `enabled`).

If pricing strategies are not enabled for the channel (`pricing_strategy_feature_disabled`), say so and point the user to Pricemind support or their account settings. Do not try to work around it.
