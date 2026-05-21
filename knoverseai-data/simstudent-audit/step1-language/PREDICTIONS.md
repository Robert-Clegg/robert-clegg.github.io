# Pre-registration — Step 1 language-fidelity characterization

**Audit name:** simstudent-audit step 1 (linguistic-channel characterization).
**Pre-registered on:** 2026-05-21.
**Author:** Robert Clegg (KnoverseAI), with Claude Code execution.
**Status when this was written:** baseline-gate generation in progress; frontier + DP generations and all feature computation not yet run.

This document locks features, comparisons, thresholds, and model versions *before* the substantive analysis is run. Any deviation from this document made after data is seen must be flagged in `RESULTS.md` with a deviation log.

---

## 1. Hypotheses

**H1 (inter-model variance).** Frontier models, prompted with the sim-student-eval Zero-Shot system prompt on real Eedi contexts, will produce *measurably different* linguistic-feature distributions from each other.

- Operationalization: a one-way MANOVA on the feature vector with `model_label` as the factor; effect size η²_partial ≥ 0.05 on at least one feature constitutes support.
- Null branch: η²_partial < 0.05 on all features → frontier models are linguistically interchangeable for student-turn generation.

**H2 (raw frontier ≠ real students).** Each frontier model's turns will be *distinguishable* from real Eedi student turns by a linear classifier trained on the deterministic features.

- Operationalization: train a logistic regression on the feature vector to classify (frontier-model turn, real-student turn) on a 5-fold CV; predict mean AUROC ≥ 0.70 averaged across the six frontier models.
- Null branch: mean AUROC < 0.60 → raw frontier models already produce real-student-like language.

**H3 (DP Model gap).** The Digital Promise Model (operationalized as the Reasoning prompting baseline with GPT-5-Mini) will be *closer* to real students than the mean of the six frontier models, but *still distinguishable* (AUROC > 0.60).

- Operationalization: DP-vs-real AUROC < mean(frontier-vs-real AUROC) AND DP-vs-real AUROC > 0.60.
- Null branch (DP-side): DP AUROC ≤ 0.60 → DP indistinguishable from real (would surprise; would suggest the Reasoning prompt is already saturating linguistic fidelity, which would itself be a meaningful finding).
- Null branch (frontier-side): DP AUROC ≥ mean(frontier AUROC) → DP doesn't help; prompting strategy isn't moving the needle on linguistic features.

**Bonus probe (not gating).** The disfluency / informality feature will carry the largest single-feature effect for distinguishing any LLM-generated source from real students. Predicted because real Eedi students are middle-schoolers chatting; LLMs default to fluent, well-punctuated, fully-spelled output.

---

## 2. Features (deterministic, computed on the student-turn text only)

Computed via `audit/features.py`. No LLM judge.

| ID | Feature | Tool | Definition |
|---|---|---|---|
| f1 | `n_tokens` | spaCy en_core_web_sm | count of non-space tokens |
| f2 | `n_chars` | builtin | `len(text)` |
| f3 | `mtld` | textstat | Measure of Textual Lexical Diversity |
| f4 | `flesch_kincaid_grade` | textstat | F-K grade level |
| f5 | `hedge_count_per_100tok` | fixed lexicon | hedges per 100 tokens (see lexicon below) |
| f6 | `abstract_noun_ratio` | spaCy POS | abstract nouns / all nouns (heuristic: noun lemmas in abstract-suffix set) |
| f7 | `past_term_per_100tok` | fixed lexicon | past-tense verbs and past-time-marker words per 100 tokens |
| f8 | `present_term_per_100tok` | same | present markers per 100 tokens |
| f9 | `future_term_per_100tok` | same | future markers per 100 tokens |
| f10 | `is_question` | regex `\?` | 1 if any `?` else 0 |
| f11 | `disfluency_per_100tok` | fixed lexicon | um/uh/like/idk/dunno/etc. per 100 tokens |
| f12 | `contraction_rate` | regex | contractions per 100 tokens (don't, can't, i'm, etc.) |
| f13 | `lowercase_first_char` | regex | 1 if first non-space char is lowercase letter |
| f14 | `nonstandard_spelling` | dictionary check | rate of OOV tokens / 100 tokens (excluding numbers and math) |

### Lexicons (locked)

- Hedges: `maybe, perhaps, possibly, probably, i think, i guess, i suppose, sort of, kind of, somewhat, not sure, dunno, idk, might`
- Disfluency / informality: `um, uh, hmm, like, lol, lmao, idk, dunno, kinda, gonna, gotta, wanna, ya, yea, yeah, nope, yup, omg, oh`
- Past: `was, were, did, had, used to, before, earlier, yesterday, previously, last`
- Present: `is, am, are, do, does, now, currently, right now`
- Future: `will, gonna, going to, tomorrow, later, next, soon, would`
- Abstract-noun suffix heuristic: `-tion, -ment, -ness, -ity, -ence, -ance, -ism, -ship`

---

## 3. Models (version-locked)

| Label | OpenRouter model id | Role | System prompt |
|---|---|---|---|
| `opus47` | `anthropic/claude-opus-4.7` | frontier | ZS-ETH |
| `sonnet46` | `anthropic/claude-sonnet-4.6` | frontier | ZS-ETH |
| `gpt5` | `openai/gpt-5` | frontier | ZS-ETH |
| `gemini25pro` | `google/gemini-2.5-pro` | frontier | ZS-ETH |
| `llama33_70b` | `meta-llama/llama-3.3-70b-instruct` | frontier | ZS-ETH |
| `deepseek_v3` | `deepseek/deepseek-chat-v3` | frontier | ZS-ETH |
| `baseline_zs_gpt41` | `openai/gpt-4.1` | baseline-gate (paper's Zero-Shot row) | ZS-ETH |
| `dpmodel_reasoning_gpt5mini` | `openai/gpt-5-mini` | DP Model | Reasoning (per paper) |

**Access date:** 2026-05-21. All model ids resolved via OpenRouter on this date. Any substitution required at run time (model unavailable) will be logged in `RESULTS.md` with the substitute and the cause.

**Decoding:** temperature 0.0 (matches paper's default); max_tokens 400 for short-form methods, 2000 for Reasoning (allows internal reasoning before the final reply). Single sample per context (n=1).

---

## 4. Sample

300 (context, real-next-student-turn) pairs from Eedi QATD-2k test split (`data/annotated/eedi/test_gpt-4.1.csv`, md5 `dc1801dadeab9013d4b0c793b2089f78`), stratified by turn position: 100 early, 100 middle, 100 late (defined as first third / middle third / last third of the dialogue's student turns). Sampled with seed 20260521. 202 distinct dialogues represented. Full sample in `audit/sample/context_sample.jsonl`.

---

## 5. Baseline integrity gate (pre-condition before main comparisons are believed)

Per spec section 4.1: reproduce one published `sim-student-eval` number within tolerance before reporting comparative results.

- **Target:** Zero-Shot (GPT-4.1) ROUGE-L = 0.1648 (Table 1 of Scarlatos et al. 2026).
- **Tolerance:** observed ROUGE-L within ±0.025 of 0.1648 → gate passes.
- **Method:** run `baseline_zs_gpt41` (`openai/gpt-4.1`, ZS-ETH system prompt) on all 300 contexts; compute mean ROUGE-L between generated turn and real student turn using `rouge_score` library (the same package used in the paper's pipeline).
- **Why ROUGE-L not Cosine:** ROUGE-L is fully deterministic (no embedding model needed). The paper's Cosine uses Qwen3-Embedding-8B, which is a large model we'd run on CPU; we report Cosine as a secondary diagnostic with whatever embedding model we use, but it does not gate.
- **If the gate fails:** STOP. Investigate. Most likely causes: (a) OpenRouter's `openai/gpt-4.1` is a different snapshot than the paper's, (b) ZS-ETH prompt wording diverges (mitigation: copy-pasted verbatim from `sim_student/prompting.py`), (c) sampling/decoding differences. Do not interpret the main H1–H3 results until the gate passes or the deviation is documented and bounded.

---

## 6. Comparisons (statistical tests, alpha budget)

All tests pre-registered. α = 0.05 with Holm–Bonferroni correction across the family.

1. **Inter-model variance (H1):** one-way MANOVA on full feature vector, `model_label` as factor (8 levels: 6 frontier + 1 DP + 1 real). Per-feature one-way ANOVA with Holm correction reported as secondary. Cluster the 8 sources hierarchically (cosine on mean-feature vectors); report dendrogram.
2. **Distribution distance to real students (H2/H3):** for each source S in {6 frontier, DP}, compute:
   - Kolmogorov–Smirnov distance per feature, real vs S (8 features per source).
   - Energy distance on standardized full feature vector, real vs S.
   - Discriminator AUROC: 5-fold CV logistic regression on standardized features, label = `is_real`, balanced classes by undersampling the larger group; report mean ± SD.
3. **Stratification:** repeat (2) within each `position_bucket` (early/middle/late) and the top 3 `top_subject` strata. Differences across strata are descriptive, not gated by hypotheses.

Fidelity decision rule per source S:
- AUROC ≤ 0.60 → fidelity claim sustained ("indistinguishable on these features")
- 0.60 < AUROC ≤ 0.70 → "noticeable but partial fidelity"
- AUROC > 0.70 → "systematically distinguishable"

---

## 7. What does NOT count as evidence (anti-overclaim)

- Inter-model variance (H1) does NOT establish that the variance maps onto cognition. This is the linguistic channel only.
- A pass on the fidelity gate (any source AUROC near 0.5) does NOT establish that the source captures student cognition — only that on these surface features it is indistinguishable. The step-1 result is *channel characterization*. The cardinality / dissociation claim is step 2.
- ROUGE-L gate alone does not validate the full sim-student-eval implementation (we omit the GPU-trained classifier metrics entirely). It only validates that our Zero-Shot generation pipeline is faithful to the paper's at the level required for linguistic-feature analysis.

---

## 8. Locked deliverables (Section 7 of CC spec)

- `audit/sample/context_sample.jsonl` (built, 300 samples)
- `audit/generations/<label>.jsonl` (one per model)
- `audit/features/all_features.parquet`
- `audit/results/baseline_gate.json` (ROUGE-L numbers vs 0.1648)
- `audit/results/comparisons.json` (H1, H2, H3 numerical outputs)
- `audit/results/fidelity_auc_chart.png`
- `RESULTS.md` (per-hypothesis: prediction / observed / pass-null + limitations note)
- `knoverseai-data/simstudent-audit/step1-language/CC_Handoff_2026-05-21.md`
