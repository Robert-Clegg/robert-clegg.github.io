# RESULTS — Step 1 language-fidelity characterization

This document compares observed outcomes against pre-registered predictions in `PREDICTIONS.md`.
See also: `MATERIALS.md` (data provenance), `audit/results/comparisons.json` (machine-readable).

---

## 1. Headline

Frontier LLMs, prompted to act as students on real Eedi math contexts, produce linguistically distinguishable output (AUROC vs real ≈ 0.88 averaged across 6 models). The Reasoning prompting baseline ('Digital Promise Model' stand-in) is closer to real students (AUROC ≈ 0.82) but still distinguishable — consistent with the paper's finding that prompting improves but does not saturate linguistic fidelity. This is channel characterization, not the cardinality test.

## 2. Baseline integrity gate

Target (paper Table 1, Zero-Shot row, GPT-4.1): **ROUGE-L = 0.1648**.

Observed (`openai/gpt-4.1` via OpenRouter, n=300 contexts):

- mean ROUGE-L = **0.1683** (delta +0.0035 from target)
- median = 0.1160; SD = 0.2088
- tolerance ±0.025; **Gate: PASS**

Faithful reimplementation of the paper's Zero-Shot generation pipeline confirmed.

## 3. Hypotheses — observed vs predicted

| Hypothesis | Prediction | Observed | Verdict |
|---|---|---|---|
| H1 inter-model variance | ≥1 feature with η²≥0.05 | 6/14 features; max η²=0.317 | PASS |
| H2 frontier ≠ real | mean frontier-vs-real AUROC ≥ 0.70 | 0.880 | PASS |
| H3 DP closer but distinguishable | DP AUROC ∈ (0.60, mean frontier AUROC) | DP AUROC = 0.821 vs mean front 0.880 | PASS |

## 4. Inter-model variance (H1) — per-feature ANOVA

| feature                 |        F |        p |   eta2 |   p_holm |
|:------------------------|---------:|---------:|-------:|---------:|
| n_tokens                | 155.3120 |   0.0000 | 0.3172 |   0.0000 |
| n_chars                 | 154.9627 |   0.0000 | 0.3167 |   0.0000 |
| is_question             |  77.2715 |   0.0000 | 0.1877 |   0.0000 |
| lowercase_first_char    |  43.5237 |   0.0000 | 0.1152 |   0.0000 |
| flesch_kincaid_grade    |  33.6801 |   0.0000 | 0.0915 |   0.0000 |
| contraction_rate        |  20.4618 |   0.0000 | 0.0577 |   0.0000 |
| disfluency_per_100tok   |  16.3838 |   0.0000 | 0.0467 |   0.0000 |
| present_term_per_100tok |  13.4246 |   0.0000 | 0.0386 |   0.0000 |
| nonstandard_spelling    |  11.9814 |   0.0000 | 0.0346 |   0.0000 |
| abstract_noun_ratio     |   4.9680 |   0.0000 | 0.0146 |   0.0000 |
| future_term_per_100tok  |   4.0517 |   0.0001 | 0.0120 |   0.0003 |
| hedge_count_per_100tok  |   3.8565 |   0.0002 | 0.0114 |   0.0005 |
| past_term_per_100tok    |   1.5205 |   0.1446 | 0.0045 |   0.2893 |
| mtld                    | nan      | nan      | 0.0000 | nan      |

(Holm–Bonferroni corrected p-values in `audit/results/per_feature_anova.csv`.)

## 5. Fidelity to real students (H2/H3) — discriminator AUROC

![Fidelity AUROC by source](audit/results/fidelity_auc_chart.png)

| source                     |   n |   AUROC_vs_real |   AUROC_sd |   energy_dist_std |
|:---------------------------|----:|----------------:|-----------:|------------------:|
| gemini25pro                | 299 |           0.779 |      0.041 |             0.403 |
| opus47                     | 299 |           0.79  |      0.028 |             0.388 |
| dpmodel_reasoning_gpt5mini | 300 |           0.821 |      0.037 |             0.36  |
| sonnet46                   | 300 |           0.852 |      0.027 |             0.674 |
| llama33_70b                | 299 |           0.942 |      0.023 |             2.048 |
| gpt5                       | 300 |           0.959 |      0.007 |             1.387 |
| deepseek_v3                | 287 |           0.959 |      0.007 |             1.289 |

**Top-3 features distinguishing each source from real:**

| source                     | top3_features                                                            |
|:---------------------------|:-------------------------------------------------------------------------|
| opus47                     | n_tokens (KS=0.35); n_chars (KS=0.34); is_question (KS=0.32)             |
| sonnet46                   | n_tokens (KS=0.50); n_chars (KS=0.46); is_question (KS=0.40)             |
| gpt5                       | n_tokens (KS=0.81); n_chars (KS=0.75); present_term_per_100tok (KS=0.48) |
| gemini25pro                | n_tokens (KS=0.36); n_chars (KS=0.32); is_question (KS=0.25)             |
| llama33_70b                | n_tokens (KS=0.81); n_chars (KS=0.79); is_question (KS=0.70)             |
| deepseek_v3                | n_tokens (KS=0.82); n_chars (KS=0.81); present_term_per_100tok (KS=0.58) |
| dpmodel_reasoning_gpt5mini | n_tokens (KS=0.32); lowercase_first_char (KS=0.29); n_chars (KS=0.27)    |

## 6. What this result does NOT show

This audit is the **linguistic-channel baseline**, not the cardinality / channel-dissociation test. It does not measure cognition. It measures whether linguistic feature distributions of LLM-generated student turns match those of real Eedi student turns. The cardinality claim — that the dialogue channel is blind to cognition the behavioral channel captures — is reserved for step 2.

## 7. Limitations

- **DP Model is a prompting stand-in, not the paper's strongest method.** The paper's best result (DPO on Llama-3.1-8B) requires GPU training out of scope here. We use the strongest *prompting* baseline (Reasoning + GPT-5-Mini). A faithful reproduction of the SFT/DPO model would likely score better on linguistic fidelity than our DP stand-in.
- **Deterministic features are a thin slice of "language".** They miss pragmatics, coherence, and dialogue-act competence. The paper's full pipeline measures those via trained classifiers; we skip them by design (no LLM judge in step 1).
- **Eedi-only.** No MathDial; only middle-school math chat. Other populations may differ.
- **One generation per context (temperature=0).** No within-source variance estimate.
- **OpenRouter routing may differ subtly from direct provider calls.** Baseline-gate ROUGE-L matched within tolerance, which bounds this risk.

## 8. Deviations from pre-registration

None for the locked features, comparisons, or models. The only documented framing decision (made before generation) is that the "Digital Promise Model" is operationalized as the Reasoning prompting baseline rather than the paper's SFT/DPO model (which would require local GPU training out of scope for step 1). This is documented in PREDICTIONS.md section 1 / MATERIALS.md section 1.
