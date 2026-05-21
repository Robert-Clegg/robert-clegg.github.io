# Materials & data provenance

**Audit:** Language-fidelity characterization of the linguistic channel (step 1 of the simulated-student vs CM comparison).
**Date created:** 2026-05-21.
**Working dir:** `C:\Users\rcleg\simstudent-audit\`
**Publication target dir:** `C:\Users\rcleg\robert-clegg.github.io\knoverseai-data\simstudent-audit\step1-language\`

---

## 1. Source paper and framework (the "Digital Promise Model")

- **Paper:** Scarlatos, Lee, Woodhead, Lan. *Simulated Students in Tutoring Dialogues: Substance or Illusion?* ACL 2026. arXiv: 2601.04025.
- **Code:** https://github.com/umass-ml4ed/sim-student-eval
  - Cloned to: `simstudent-audit/sim-student-eval/`
  - Commit: `9ec3f7d0679382403488ca5fd43f6ae44d118f8c` (latest as of 2026-05-21)
- **License:** Apache 2.0 (code); annotations on Eedi data released under CC-BY-NC-SA-4.0 matching upstream.
- **DP Model operationalization (for this audit):** The strongest *prompting-only* baseline from the paper, which the spec accepts as the "Digital Promise Model" stand-in absent a more specific artifact. Specifically: the **Reasoning** prompting method on a frontier model, optionally compared with **Oracle** (information-leaking variant; informational ceiling for prompting). The paper's strongest method is DPO on Llama-3.1-8B; reproducing that requires a GPU + days of training and is out of scope for step 1. This deviation is documented and flagged in RESULTS.md.

## 2. Real-student anchor

- **Dataset:** Eedi Question-Anchored Tutoring Dialogues 2k.
  - HuggingFace: `Eedi/Question-Anchored-Tutoring-Dialogues-2k`
  - License: CC-BY-NC-SA-4.0 (non-commercial research only — this audit is research-only).
- **Why Eedi only (not MathDial):** MathDial uses GPT-3.5-simulated "confused students" alongside real teachers. It is not a real-student dataset. Using it as a "real-student anchor" would confound the fidelity comparison. The spec's "MathDial and/or Eedi" wording is resolved here as **Eedi only**, deliberately. This is the same choice the paper makes.
- **Annotated copy used:** `sim-student-eval/data/annotated/eedi/test_gpt-4.1.csv` (382 dialogues). The repo ships LLM-annotated turns with `acts`, `correctness`, `eedi_kcs`, `ocean_persona`, `freeform_persona`. We use this exact file unmodified.

## 3. Frontier models (via OpenRouter)

Version-locked, recorded with access date in `PREDICTIONS.md`. Target set (subject to OpenRouter availability check at run time):

- anthropic/claude-opus-4.7
- anthropic/claude-sonnet-4.6
- openai/gpt-5 (or current GPT-4o successor)
- google/gemini-2.5-pro
- meta-llama/llama-3.3-70b-instruct
- deepseek/deepseek-chat-v3

If any model is unavailable on OpenRouter at run time, the substitution is logged in `PREDICTIONS.md` with the access date.

## 4. License compliance summary

- Eedi QATD-2k: CC-BY-NC-SA-4.0 — non-commercial only. This audit is non-commercial research. Outputs derived from Eedi data inherit ShareAlike (CC-BY-NC-SA-4.0).
- sim-student-eval annotations: CC-BY-NC-SA-4.0 (same).
- Generated turns from frontier models: derivative of Eedi context → released CC-BY-NC-SA-4.0.
- Aggregate statistics and figures: CC-BY-4.0 (no underlying licensed text).

## 5. What we do NOT use here

- MathDial — not real students.
- The paper's metric pipeline that depends on trained classifiers (acts, correctness, errors, knowledge acquisition, tutor response induction) — these require GPU training of 8B-param models and are out of scope. Step 1 uses only deterministic linguistic features. Step 2 may revisit.
