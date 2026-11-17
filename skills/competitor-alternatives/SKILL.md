---
name: competitor-alternatives
description: Research comparable competitor models for one of the user's products (substitutes and analogs from other brands, not the identical product), record each real model in Pricemind as a comparison product under the user's product, and attach already-tracked retailer offers of those models. Use for "what are the alternatives to X", competitor-brand discovery, or building and maintaining product groups in Pricemind.
---

# Competitor alternatives (cross-vendor comparables)

Two products are *comparable* when a shopper would choose between them, for example two 2 L stand mixers from different brands with similar specs. A comparable is **not** the same product, so never record it as a match. Pricemind stores each real comparable model as a *comparison product definition* placed beneath the user's own product. Grouped Prices views can show it even before any retailer offer is attached.

## How changes work: ask once per job, never per step

| What | Examples | What you do |
| -- | -- | -- |
| Research and reads | context, groups, web research | Never ask. Research requests stay research: nothing is saved. |
| Add | add or link a comparable, attach a tracked offer, fix a comparable's details | When the user asked for that outcome ("add the alternatives", "build the group"), do it, then report what changed and how to undo it. |
| Remove | detach an offer, remove a comparable | Show the whole plan once and ask one question. After the yes, run it all without asking again. |
| The server returns `decision_required` | changed identity or version, material warning | The only mid-job stop. Explain, ask once, continue. |

Stay within the scope the user gave (that product, those brands). Never widen it on your own.

## Facts and identity rules

- Base every decision on verified facts: specs from the manufacturer or reputable retailer pages, with the source URL recorded as `research_evidence`.
- Create one definition per real model. Never create one per listing, search result or brand family.
- Before creating anything, read `product_discovery_get_context` for the channel and product.
  - If the exact model already exists at account level, call `product_discovery_link_existing_comparable` with its `comparison_product_definition_id` as `definition_id`.
  - Never create an enriched duplicate.
- When a source has a stable HTTP(S) product image, record it as `image_url`.

## Workflow

1. **Scope.** Collect:
   - the channel;
   - the user's product (`product_domain_id`, or a title or code to resolve);
   - the market or locale;
   - an optional allow-list of competitor brands;
   - whether the user wants research only or wants the result saved in Pricemind.

   Ask only for what you cannot infer, in one question.
2. **Context.** `product_discovery_get_context` shows the product and the existing comparables and groups. `product_discovery_get_group` shows the current group.
3. **Research.**
   - Use your web search and fetch tools to find the 3–8 strongest comparable models.
   - For each, note: brand, exact model name and code, key specs that make it comparable, typical price, source URLs and an image URL.
   - Drop anything you cannot verify.
4. **Show.** A table of the comparables with the evidence and how close each one is. If the user asked for research only, stop here.
5. **Save** (when the user asked for it):
   - New model: `product_discovery_add_comparable`, with `research_evidence` and `image_url`.
   - Existing model: `product_discovery_link_existing_comparable`.
   - Fix details: `product_discovery_update_comparable`.
6. **Attach tracked offers** of a comparable model that Pricemind already loads from retailers (direct mode):
   - One offer: `product_discovery_execute_attach` with `intent` = `channel_id`, `group_id`, `definition_id`, `product_domain_id` and a concrete exact-identity `reason`.
   - Several offers: `product_discovery_execute_attach_batch` with `intent` = `channel_id` plus `items` (1 to 25, each with `group_id`, `definition_id`, `product_domain_id` and `reason`); split longer lists into several calls.
   - Pass a stable `idempotency_key` with every call and reuse it on retries.
   - Candidate mode (`identity_id` + `discovery_run_id`, `discovery_item_id`, `candidate_id`) is a different flow. Never mix the two.
   - Do not use normal matching here: matching links retailer listings to the user's own product, not to a comparable.
7. **Remove** (one approval for the whole plan):
   - detach offers: `product_discovery_execute_detach` for one (`channel_id`, `identity_id`, `observation_id`), or `product_discovery_execute_detach_batch` for several (`channel_id` plus `items`, 1 to 25, each with `identity_id` and `observation_id`); the ids come from `product_discovery_get_group`;
   - remove a comparable from the group: `product_discovery_execute_remove_comparable` with `group_id` and `definition_id`.
8. **Report.** One summary: what was created, linked, attached, detached or removed, what was skipped and why, and how to undo it:
   - an attach is undone with a detach of the same offer, a detach with an attach;
   - an added or linked comparable is undone with `product_discovery_execute_remove_comparable`, and a removed one can be linked again with `product_discovery_link_existing_comparable`.

The preview tools (`product_discovery_preview_attach`, `product_discovery_preview_detach`, `product_discovery_preview_remove_comparable`) are for review-only requests. Do not call them as an extra step before a job the user already asked for.

## Retailer coverage runs

- `product_discovery_start`, `product_discovery_list_runs`, `product_discovery_get_run`, `product_discovery_list_items` and `product_discovery_list_candidates` run a different pipeline. It finds more retailer listings of the *same* product, not alternatives from other brands.
- Use it when the user asks to find more shops selling their product; start it without asking again and report the run. Never describe it as cross-brand research.
