# CM Theory Validation v2 — Benchmark Results

**Task:** `cm_theory_validation_v2`  
**Benchmark:** Can models derive cognitive architecture from behavioral telemetry?  
**Questions:** 20 sequential (15 scored, 6 context)  
**Assertions:** 27 keyword+grounding + 6 judge = 33 total (27 shown in results)  
**Judge Model:** google/gemini-3.1-flash-lite-preview  
**Date:** April 6, 2026  
**Dataset:** CM Theory Data (Pathogenika + PetroActive behavioral telemetry)

---

## Leaderboard

| Rank | Model | Pass/27 | Score | Cost | Time (s) | Input Tokens | Output Tokens |
|------|-------|---------|-------|------|----------|--------------|---------------|
| 1 | **Claude Opus 4.6** | 26/27 | 96.3% | $8.71 | 2,887 | 1,166,601 | 115,937 |
| 2 | Claude Sonnet 4.6 | 24/27 | 88.9% | $5.82 | 2,979 | 1,300,171 | 128,903 |
| 3 | Claude Haiku 4.5 | 24/27 | 88.9% | $2.25 | 1,508 | 1,509,185 | 149,719 |
| 4 | Gemini 3.1 Pro Preview | 24/27 | 88.9% | $1.45 | 929 | 394,704 | 25,209 |
| 5 | GPT-5.4 Nano | 21/27 | 77.8% | $0.04 | 127 | 320,892 | 20,801 |
| 6 | GPT-5.4 | 19/27 | 70.4% | $0.94 | 1,009 | 634,466 | 50,995 |
| 7 | DeepSeek V3.2 | 19/27 | 70.4% | $0.17 | 794 | 444,500 | 32,910 |
| 8 | Gemini 2.5 Flash | 18/27 | 66.7% | $0.28 | 373 | 441,249 | 30,926 |
| 9 | Qwen 3 Next 80B Thinking | 17/27 | 63.0% | $0.15 | 393 | 464,066 | 63,903 |
| 10 | GLM-5 | 15/27 | 55.6% | $0.34 | 936 | 328,850 | 64,566 |
| 11 | GPT-5.4 Mini | 15/27 | 55.6% | $0.15 | 163 | 341,259 | 22,349 |
| 12 | Gemini 3.1 Flash Lite Preview | 9/27 | 33.3% | $0.10 | 104 | 310,462 | 17,409 |

---

## Key Findings

### Gradient Quality
- **Score range:** 9/27 (33%) to 26/27 (96%) — a clean 0–26 gradient across 12 models
- **No model achieved perfect 27/27** — the benchmark has discriminating power even at the top
- **No model scored 0/27** — even the weakest model found some signal in the data
- **All models reported "Fail" as overall kbench result** — the binary pass/fail masks the rich gradient

### Model Tiers
- **Tier 1 (24–26/27):** Opus, Sonnet, Haiku, Gemini Pro — strong data grounding and metacognitive depth
- **Tier 2 (17–21/27):** GPT-5.4 Nano, GPT-5.4, DeepSeek, Gemini Flash, Qwen — moderate grounding, weaker on hard assertions
- **Tier 3 (9–15/27):** GLM-5, GPT-5.4 Mini, Flash Lite — limited data grounding or shallow responses

### Surprising Results
- **GPT-5.4 Nano outperformed GPT-5.4** (21 vs 19) at 1/25th the cost ($0.04 vs $0.94) and 1/8th the time (127s vs 1009s)
- **Claude Haiku matched Sonnet** (both 24/27) at less than half the cost ($2.25 vs $5.82)
- **Gemini Pro matched Claude Sonnet and Haiku** at $1.45 — best cost-performance ratio in Tier 1
- **Opus missed only 1 assertion** — the strongest single-model performance

### Cost Analysis
- **Most expensive:** Claude Opus 4.6 ($8.71) — but highest score
- **Best value (Tier 1):** Gemini 3.1 Pro Preview — 24/27 at $1.45
- **Best value (overall):** GPT-5.4 Nano — 21/27 at $0.04
- **Cheapest:** GPT-5.4 Nano ($0.04) and Gemini Flash Lite ($0.10)

### Token Usage Patterns
- Claude models used significantly more tokens (input 1.1M–1.5M, output 115K–150K) compared to others
- Gemini Pro was notably concise (25K output) while still achieving 24/27
- Qwen Thinking produced 64K output tokens but only scored 17/27 — verbosity didn't help

---

## Assertion Categories

The 27 scored assertions span multiple difficulty levels:

### Easy (A0–A4): Data grounding and basic pattern recognition
- Most models pass these — they test whether the model references specific data values

### Medium (A5–A6, A11–A12, A16–A18): Neurobiological mapping, timing analysis, transfer failure
- Tier 2 models begin failing here — requires connecting data to deeper frameworks

### Hard (A7–A8, A13–A15, A20–A26): Multi-layer cognitive models, Bloom's taxonomy, divergence/error theory
- Only Tier 1 models consistently pass — requires synthesis across multiple questions

### Very Hard (A10, A19, A24–A25): Validation of telemetry as measurement instrument, metacognitive transitions, error as functional
- Even Tier 1 models struggle — Opus's single failure likely falls here

---

## Methodology Notes

- Each model answered 20 sequential questions with accumulated conversation context
- Questions ranged from pattern recognition (Q1) to population-scale cognitive telemetry implications (Q19)
- 15 questions were scored, 6 provided context for later questions
- Assertions used keyword matching + data grounding checks + 6 judge assertions (evaluated by Gemini Flash Lite)
- All models received identical telemetry data and question prompts
- Kaggle AI quota: $50/day, $500/month — 7 models initially failed due to quota exhaustion (403 errors), re-run after quota reset

---

## Competition Context

- **Competition:** Measuring Progress Toward AGI (Kaggle)
- **Track:** Metacognition
- **Benchmark version:** v2 (data-grounded assertions)
- **Previous version (v1g):** Keyword-only assertions gave 27/27 for all models — no gradient. v2 fixed this by requiring data grounding.
- **Deadline:** April 16, 2026
