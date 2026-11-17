---
name: competitor-alternatives
description: Research comparable competitor models for one of the user's products (substitutes and analogs from other brands, not the identical product), record each real model in Pricemind as a comparison product under the user's product, and attach already-tracked retailer offers of those models. Use for "what are the alternatives to X", competitor-brand discovery, building product groups or comparing cross-brand price positioning in Pricemind.
---

# Competitor alternatives (cross-vendor comparables)

Two products are *comparable* when a shopper would choose between them, for example two 2 L stand mixers from different brands with similar specs. A comparable is **not** the same product, so never record it as a match. Pricemind stores each real comparable model as a *comparison product definition* placed beneath the user's own product. Grouped Prices views can show it even before any retailer offer is attached.

## Hard rules

- Base every decision on verified facts: specs from the manufacturer or reputable retailer pages, with the source URL recorded as `research_evidence`.
- Create one definition per real model. Never create one per listing, search result or brand family.
- Before creating anything, read `product_discovery_get_context` for the channel and product.
  - If the exact model already exists at account level, call `product_discovery_link_existing_comparable` with its `comparison_product_definition_id` as `definition_id`.
  - Never create an enriched duplicate.
- When a source has a stable HTTP(S) product image, record it as `image_url`.
- Research and review requests stay read-only. Create, link, attach or remove only what the user explicitly asked for, within that scope. Use preview tools to show the effect first when the user is reviewing.

## Workflow

1. **Scope.** Collect:
   - the channel;
   - the user's product (`product_domain_id`, or a title or code to resolve);
   - the market or locale;
   - an optional allow-list of competitor brands;
   - whether the user wants research only or persistence.
2. **Context.** `product_discovery_get_context` shows the product and the existing comparables and groups. `product_discovery_get_group` shows the current group.
3. **Research.**
   - Use your web search and fetch tools to find the 3–8 strongest comparable models.
   - For each, note: brand, exact model name and code, key specs that make it comparable, typical price, source URLs and an image URL.
   - Drop anything you cannot verify.
4. **Propose.** Show a table of the proposed comparables with the evidence and how close each one is. Ask for confirmation unless the user already authorized creation.
5. **Persist** (when authorized):
   - New model: `product_discovery_add_comparable`, with `research_evidence` and `image_url`.
   - Existing model: `product_discovery_link_existing_comparable`.
   - Fix details: `product_discovery_update_comparable`.
   - Remove: preview with `product_discovery_preview_remove_comparable`, then call `product_discovery_execute_remove_comparable`.
6. **Attach tracked offers** of a comparable model that Pricemind already loads from retailers:
   - Use direct mode: `product_discovery_preview_attach` with `group_id`, `definition_id`, `product_domain_id` and a concrete exact-identity reason, then `product_discovery_execute_attach` with a stable `idempotency_key`.
   - Candidate mode (`identity_id` + `discovery_run_id`, `discovery_item_id`, `candidate_id`) is a different flow. Never mix the two.
   - Do not use normal matching here: matching links retailer listings to the user's own product, not to a comparable.
7. **Report.** List what was created, linked and attached, and what was skipped and why.

## Retailer coverage runs

- `product_discovery_start`, `product_discovery_list_runs`, `product_discovery_get_run`, `product_discovery_list_items` and `product_discovery_list_candidates` run a different pipeline. It finds more retailer listings of the *same* product, not alternatives from other brands.
- Use it only when the user asks to find more shops selling their product. Never describe it as cross-brand research.
