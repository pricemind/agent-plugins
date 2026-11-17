---
name: matching-review
description: Review and fix how competitor offers are matched to the user's own products in Pricemind - inspect suggested matches, explain why two listings are or are not the same product, find bad or missing matches, then preview and apply match or unmatch decisions the user approves. Use when prices look wrong because of a wrong match, or when the user asks to review, approve, reject or clean up matches.
---

# Reviewing product matches in Pricemind

A *match* says a competitor's listing is the **same product** as one of the user's own products. Competitor prices are only as good as the matches behind them. Similar or substitute products are not matches; for those, use the `competitor-alternatives` skill.

## Hard rules

- Never auto-match and never submit SQL.
- Before any `matching_match`, `matching_match_batch` or `matching_unmatch`, run the matching preview tool (`matching_preview_match`, `matching_preview_match_batch` or `matching_preview_unmatch`). Show the user the exact effect: which products, which offers, what changes.
- Execute only what the user approved, using the returned preparation token with the `matching_execute_*` tool.
- If the preview reports a changed identity or version, missing permissions or a material warning, stop and report it. Do not widen the scope.
- A read-only connection cannot change matches. Say that the user needs to reconnect with "Read and make changes".

## Workflow (progressive disclosure: keep calls small)

1. **Context.** Call `matching_get_context` for the `channel_id`.
   - It returns compact jobs, runs and counts.
   - Call `matching_get_schema` only when its version is new to you. Pass `job_id` to get that job's effective signal weights.
2. **Find candidates.**
   - For a job's pending suggestions, use `matching_query_suggestions`; it is authoritative for that job.
   - For ad-hoc questions, such as current matches for a brand or matches with big price gaps, use `matching_query` or `matching_list_current_matches`.
   - Pick the collection profile the schema suggests, and project only the fields you need.
3. **Explain a pair.** Call `matching_explain_pair` with the `job_id` or `run_id` and only the expansions you need. For a signal audit, request `signal_summary` first, then call `matching_get_signal_details` for one exact signal.
   - Same product: the same brand and model, plus a strong identifier (EAN/GTIN, MPN, model code). Variant, pack size and volume must also agree.
   - Not the same product: a different pack size, a bundle, a different variant (colour, size, capacity), or "compatible with" or accessory listings.
4. **Decide with the user.** Present a short table: own product, competitor listing, price, evidence, proposed decision. Group by decision.
5. **Apply.** Preview, show the result, execute the approved items, then confirm with a fresh read.

## Bigger clean-ups

- `matching_analyze_issues` finds systematic problems, such as many pack-size mismatches or one competitor's listings drifting.
- `matching_list_jobs`, `matching_get_job` and `matching_list_runs` show what automation already runs.
- `matching_start_run` starts a new suggestion run, and `matching_update_job` tunes a job. Use them only when the user asks for it.
- Report how many matches were reviewed, approved, rejected and left for later.
