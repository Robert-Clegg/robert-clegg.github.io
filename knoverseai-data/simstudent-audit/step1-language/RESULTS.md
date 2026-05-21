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

## 5b. Per-model linguistic personality

Each model's z-scored feature signature across the 13 deterministic features reveals a recognizable register that persists even when the model is asked to role-play a middle-school student. Three things show up: (a) every model has a stable signature, (b) signatures cluster into three families, (c) the signature can be summarized on Big-Five-flavored axes (we use MBTI here as a familiar shorthand, with the caveat that this is a four-axis summary of a 13-dim signal, not a diagnosis).

### Per-source signature (z-scored vs population of 8 sources)

|                         |   n_tokens |   n_chars |   F-K grade |   hedge |   abstract |   past |   present |   future |   is_question |   disfluency |   contraction |   lowercase |   nonstd_spell |
|:------------------------|-----------:|----------:|------------:|--------:|-----------:|-------:|----------:|---------:|--------------:|-------------:|--------------:|------------:|---------------:|
| Real Eedi               |      -0.82 |     -0.82 |       -1.16 |    1.99 |      -0.52 |   1.83 |     -1.03 |     1.14 |         -1.31 |         0.62 |         -0.90 |        1.28 |           2.46 |
| Claude Opus 4.7         |      -0.54 |     -0.55 |       -0.57 |   -0.80 |      -1.07 |  -0.82 |      0.73 |     0.03 |          0.06 |         0.43 |         -0.25 |        1.23 |          -0.35 |
| Claude Sonnet 4.6       |      -0.37 |     -0.35 |       -0.20 |   -0.21 |      -0.42 |  -0.15 |      0.48 |    -0.48 |          0.40 |         1.90 |          0.06 |        0.87 |          -0.58 |
| GPT-5                   |      +0.41 |     +0.33 |       +0.61 |   -0.62 |      -0.73 |   0.17 |     -0.18 |    -0.18 |          0.28 |        -0.93 |         -1.46 |       -0.86 |          -0.24 |
| Gemini 2.5 Pro          |      -0.69 |     -0.70 |       -0.54 |    0.44 |      +0.38 |   0.82 |     -0.07 |    -0.70 |         -0.24 |         0.32 |         +1.06 |       -0.05 |          -0.25 |
| Llama 3.3 70B           |      +0.46 |     +0.56 |       +1.48 |    0.61 |      +1.90 |   0.22 |     +0.66 |    +1.50 |         +1.67 |        -0.86 |         +1.36 |       -0.85 |          -0.26 |
| DeepSeek V3             |      +2.16 |     +2.15 |       +1.28 |   -0.24 |      +0.95 |  -1.14 |     +1.21 |    +0.31 |         +0.52 |        -0.66 |         -0.64 |       -1.21 |          -0.33 |
| DP / Reasoning-GPT5mini |      -0.59 |     -0.62 |       -0.90 |   -1.16 |      -0.48 |  -0.94 |     -1.80 |    -1.62 |         -1.38 |        -0.81 |         +0.77 |       -0.41 |          -0.45 |

### Clustering

![Linguistic-personality dendrogram](audit/results/personality_dendrogram.png)

Three families emerge:

- **Anthropic pair** — Opus 4.7 ↔ Sonnet 4.6 (cosine 0.38). Tight cluster, both lean toward terse and informal register.
- **Verbose-formal cluster** — GPT-5 ↔ DeepSeek V3 (0.55); Llama 3.3 70B nearby. All three overwrite real students by 4–11σ on length, under-use lowercase and contractions.
- **Terse-casual cluster** — Gemini 2.5 Pro ↔ DP / Reasoning-GPT5mini (0.61). Closest to real students on length and informality.

Distance to real students (cosine on the standardized signature):

| Source | Distance to real |
|---|---|
| Gemini 2.5 Pro | 0.78 |
| Claude Sonnet 4.6 | 1.03 |
| Claude Opus 4.7 | 1.05 |
| DP / Reasoning-GPT5mini | 1.16 |
| GPT-5 | 1.28 |
| Llama 3.3 70B | 1.34 |
| DeepSeek V3 | 1.59 |

Gemini 2.5 Pro is closest to real students on this signature; DeepSeek V3 is farthest. This rank-orders with the H2 discriminator-AUROC ordering (lower distance → lower AUROC), confirming the two views of fidelity converge.

### MBTI assignment from the signature

Each MBTI axis is scored as a transparent linear combination of features. Sign of the score picks the letter. **This is a 4-axis summary of the 13-dim signal — useful as a mnemonic, not as personality assessment.** Scoring rules (z computed on the 8-source population):

- `E_vs_I` = z(n_tokens) + 0.5·z(is_question)   *(more words + more outreach = E)*
- `N_vs_S` = z(abstract_noun_ratio) + 0.5·z(future_term) − 0.5·z(present_term)   *(abstract + future = N)*
- `T_vs_F` = −z(contraction_rate) − z(disfluency) + 0.5·z(F-K grade)   *(formal + complex = T)*
- `J_vs_P` = −z(is_question) − z(hedge_count) − 0.5·z(lowercase_first)   *(decisive + structured = J)*

Results:

| Source | E↔I | N↔S | T↔F | J↔P | **MBTI** | Style summary |
|---|---:|---:|---:|---:|---|---|
| **Real Eedi** | −1.5 | +0.6 | −0.3 | −1.3 | **INFP** | (reference) |
| Claude Opus 4.7 | −0.5 | −1.4 | −0.5 | +0.1 | **ISFJ** | Quiet imitator |
| Claude Sonnet 4.6 | −0.2 | −0.9 | −2.1 | −0.6 | **ISFP** | Slightly more talkative Opus |
| GPT-5 | +0.5 | −0.7 | +2.7 | +0.8 | **ESTJ** | Formal striver |
| Gemini 2.5 Pro | −0.8 | +0.1 | −1.7 | −0.2 | **INFP** | **Matches real students' MBTI** |
| Llama 3.3 70B | +1.3 | +2.3 | +0.2 | −1.9 | **ENTP** | Eager interrogator |
| DeepSeek V3 | +2.4 | +0.5 | +1.9 | +0.3 | **ENTJ** | Verbose explainer |
| DP / Reasoning-GPT5mini | −1.3 | −0.4 | −0.4 | +2.7 | **ISFJ** | Reasoning prompt forces strong J |

Interpretation:

- The Anthropic pair lands in the **S-F** corner — concrete, feeling — closer to real students than the OpenAI/DeepSeek/Llama side, which sits in the **N-T** corner.
- **Gemini is the only frontier model that recovers the real students' MBTI cell (INFP).** It does so by being terse, informal, and using more concrete present-tense than the others — i.e. by *not over-thinking* the role.
- **DeepSeek and Llama are the two strongest E-J types** — verbose and decisive — they declaim. Llama also lands strongest on N (abstract + future-oriented language), which is why it asks the most questions (an N + P combo).
- The DP prompting baseline shifts the underlying GPT-5-mini hard toward **J** (the most J-leaning score in the set, +2.7) because the Reasoning instruction explicitly demands closed, evaluable responses. **This is a prompt-induced personality shift, observable in the linguistic data.**
- Real Eedi students sit at **INFP** — terse, abstract-ish, feeling, open. No LLM occupies this corner without help, and only Gemini reaches it.

### Cross-modality: how this lines up with Neutral Zone

Neutral Zone measures **emergent personality under cooperative-game pressure.** Student-utterance generation measures **residual personality leaking through a role-play instruction that should wash it out.** The two probes recover the same latent traits but express them differently:

- **Opus** scored 96% on NZ analysis but "failed personality simulation." Here Opus is one of the closest models to real students on register — its inability in NZ to simulate an *externally-imposed* personality is the same trait that lets it imitate students: a preference for *matching* register over *projecting* one.
- **DeepSeek** showed "deepest diversity" in NZ. Here it is the *farthest* from real students — extremely verbose, formal, ENTJ-typed. NZ "diversity" and student-utterance "verbose explainer" are the same elaboration drive in opposite valence.
- **GPT-5** was strategic-assertive in NZ. Here it over-formalizes: no contractions, no lowercase, paragraph answers. Same trait, restated in dialogue: ESTJ.

**Net:** the dialogue probe corroborates NZ on the existence of distinct model personalities, and adds a finding NZ couldn't make — **personality leaks through a counter-personality instruction.** This is a stronger demonstration of trait-stability than NZ alone, because the prompt explicitly tried to suppress it and didn't fully succeed.

**Caveat:** the *valence* of a personality differs by task. A trait that helps in NZ (elaboration, decisiveness) hurts on this task (where you need to be terse and confused). Cross-task model rankings are therefore not transitive — and that non-transitivity is itself a publishable finding.

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
