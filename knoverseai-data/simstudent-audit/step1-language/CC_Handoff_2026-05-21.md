# CC Handoff — simstudent-audit step 1 (language-fidelity characterization)

**Date:** 2026-05-21
**Working dir:** `C:\Users\rcleg\simstudent-audit\`
**Publication dir (this file):** `knoverseai-data\simstudent-audit\step1-language\`
**Author/operator:** Robert Clegg (KnoverseAI) via Claude Code
**Spec executed:** CC Spec — Step One: Language-Fidelity Characterization (provided in this session)

---

## What this audit is

A small, deterministic characterization of the *linguistic channel* in the simulated-student framework. Three sources produce next-student turns on the same real Eedi tutoring contexts; we measure how their language distributions differ on locked deterministic features, and how close each gets to real students.

This is NOT the channel-dissociation / cardinality test. That is step 2.

## Sources

1. **Real students** — Eedi Question-Anchored Tutoring Dialogues 2k (real middle-school math chat), via the annotated test split shipped in `umass-ml4ed/sim-student-eval` repo (commit `9ec3f7d`). 382 dialogues; 4,225 student turns; 300 sampled stratified by turn position.
2. **Frontier models** (Zero-Shot via OpenRouter, system prompt verbatim from sim-student-eval):
   - `anthropic/claude-opus-4.7`
   - `anthropic/claude-sonnet-4.6`
   - `openai/gpt-5`
   - `google/gemini-2.5-pro`
   - `meta-llama/llama-3.3-70b-instruct`
   - `deepseek/deepseek-chat-v3`
3. **Digital Promise Model** (operationalization for this audit): the **Reasoning** prompting baseline with `openai/gpt-5-mini` — the strongest *prompting-only* method in the paper. The paper's strongest method overall (DPO on Llama-3.1-8B) requires GPU training out of scope here; flagged in MATERIALS.md and RESULTS.md.

## Baseline integrity gate

Target: ROUGE-L = 0.1648 (paper Table 1, Zero-Shot row, GPT-4.1).
Observed: 0.1683 (Δ +0.0035, within ±0.025 tolerance). **PASS.**
This confirms our Zero-Shot reimplementation is faithful at the level step 1 requires.

## Headline result

(one paragraph, plain language)

Frontier LLMs, prompted to act as students on real Eedi math contexts, produce linguistically distinguishable output (AUROC vs real ≈ 0.87 averaged across 6 models). The Reasoning prompting baseline ('Digital Promise Model' stand-in) is closer to real students (AUROC ≈ 0.82) but still distinguishable — consistent with the paper's finding that prompting improves but does not saturate linguistic fidelity. This is channel characterization, not the cardinality test.

## Files in this directory

- `CC_Handoff_2026-05-21.md` — this file
- `comparisons.json` — machine-readable results
- `baseline_gate.json` — gate metrics
- `feature_means.csv`, `feature_sds.csv` — per-source feature distributions
- `per_feature_anova.csv` — per-feature ANOVA with Holm correction
- `ks_per_feature.csv` — Kolmogorov–Smirnov distance per (source, feature)
- `fidelity_auc_chart.png` — bar chart of fidelity AUROC by source
- `PREDICTIONS.md` — copy of the pre-registration
- `RESULTS.md` — copy of the results doc
- `MATERIALS.md` — copy of provenance / license doc
- `SECURITY_NOTE.md` — OpenRouter key rotation reminder

## What step 1 establishes for step 2

- A **fidelity baseline** for the linguistic channel: how distinguishable each source's *language* is from real students, on locked deterministic features.
- A **faithful Zero-Shot reimplementation** (gate-passed) of the sim-student-eval framework, callable through OpenRouter, that can be reused in step 2.
- A 300-context sample of real Eedi dialogues with held-out next-student turns, ready to drive step 2 comparisons that need the same real-anchor.

## Action items for Robert

1. **Rotate the OpenRouter API key** on https://openrouter.ai/settings/keys. The key previously hardcoded in `neutral-zone-game/run_kira_free.py` should be treated as compromised. Details in `simstudent-audit/SECURITY_NOTE.md`.
2. **Confirm "Digital Promise Model" definition** with DTP. This audit uses the Reasoning prompting baseline (strongest prompting method in the paper) as the DP stand-in. If DTP intends a specific SFT/DPO checkpoint, step 1 should be re-run against that artifact.
3. **Forward to DTP.** Step 1 is channel characterization; the cardinality test still owes step 2.

## Step 2 hand-off

Step 2 design (from prior conversation):
- 60-item forced-choice behavioral battery → models' decision-style channel
- PetroActive headless synthetic profiles with ground-truth (type × tier) → behavioral recovery test
- Neutral Zone dual-channel sessions → joint dialogue + behavior comparison
- MAP misconception corpus → cross-modal validity probe

Pre-registration for step 2 should reuse the same 300-context Eedi sample as the linguistic anchor and add the behavioral channels.
