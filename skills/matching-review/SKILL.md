---
name: matching-review
description: Review and fix how competitor offers are matched to the user's own products in Pricemind - inspect suggested matches, explain why two listings are or are not the same product, find bad or missing matches, then apply the match and unmatch decisions as one job and report what changed. Use when prices look wrong because of a wrong match, or when the user asks to review, approve, reject or clean up matches.
---

# Reviewing product matches in Pricemind

A *match* says a competitor's listing is the **same product** as one of the user's own products. Competitor prices are only as good as the matches behind them. Similar or substitute products are not matches; for those, use the `competitor-alternatives` skill.

## How changes work: ask once per job, never per step

| What | Examples | What you do |
| -- | -- | -- |
| Read | context, queries, explain a pair, history | Never ask. |
| Add a match | approve suggestions, match a pair | When the user asked for it ("approve these", "match them"), do it, then report what changed and how to undo it. |
| Remove a match | unmatch, reject an existing match | Show the whole plan once (one table, every unmatch in it) and ask one question. After the yes, run the whole plan to the end without asking again. |
| The server returns `decision_required` | changed identity or version, material warning, wider scope | The only reason to stop mid-job. Say what changed, ask once, continue with the answer. |

- A request such as "approve these 30 matches and remove these 5" is one job: one question (for the 5 removals), then everything runs, then one summary.
- Never repeat a question the user already answered in this job. Never ask for permission to read.
- Never auto-match beyond what the user asked for, and never submit SQL.
- A read-only connection cannot change matches. Say that the user needs to reconnect with "Read and make changes".

## Workflow (keep calls small)

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
4. **Plan.** Present one short table: own product, competitor listing, price, evidence, decision (match / unmatch / leave). Group by decision. If the user only asked for a review, stop here: this is a review, not a job.
5. **Run the job.** Use the execute tools; each prepares, validates and applies in one call:
   - matches: `matching_execute_match_batch` (or `matching_execute_match` for a single pair);
   - unmatches: `matching_execute_unmatch_batch` (or `matching_execute_unmatch` for a single pair).

   Every call takes `intent`, a stable `idempotency_key` for that exact job (reuse the same key when you retry), and optional `acknowledgements`. The `intent` differs per tool:
   - `matching_execute_match` and `matching_execute_unmatch` (one pair): `channel_id`, `source_product_domain_id`, `target_product_domain_id` and a short `reason`; a match may also carry `suggestion_id`, `matching_job_id` or `matching_job_run_id` when the pair came from a job.
   - `matching_execute_match_batch`: `channel_id`, `pairs` (each with `source_product_domain_id`, `target_product_domain_id` and optionally its own `suggestion_id`), plus one shared `reason` and, when the pairs came from a job, one shared `matching_job_id` or `matching_job_run_id`.
   - `matching_execute_unmatch_batch`: `channel_id`, `pairs` (each with `source_product_domain_id`, `target_product_domain_id` and optionally `connection_id`), plus one shared `reason`.

   Every batch takes 1 to 25 pairs; split longer lists into several calls, each with its own key. A batch returns one result per pair: pairs that need a decision are left unchanged while the rest run. Pass `acknowledgements` only for warnings the user's approval actually covered; never invent approval.
6. **Report.** One summary at the end:
   - how many pairs were matched, unmatched, skipped and why;
   - anything that stopped with `decision_required`;
   - how to undo: a match is undone with an unmatch of the same pair, an unmatch with a match of the same pair. `matching_list_history` shows every change.

   Confirm with a fresh read only when something looked off.

The preview tools (`matching_preview_match`, `matching_preview_match_batch`, `matching_preview_unmatch`) are for review-only requests ("what would happen if..."). Do not call them as an extra step before executing a job the user already asked for.

## Bigger clean-ups

- `matching_analyze_issues` finds systematic problems, such as many pack-size mismatches or one competitor's listings drifting.
- `matching_list_jobs`, `matching_get_job` and `matching_list_runs` show what automation already runs.
- `matching_start_run` starts a new suggestion run and `matching_update_job` tunes a job. Do them when the user asks for that outcome, then report what you started or changed.
- Report how many matches were reviewed, approved, rejected and left for later.
