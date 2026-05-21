# Max Account Testing Plan — Claude Code

## Problem
The CM Theory Validation v2 benchmark (`cm_theory_validation_v2`) has 21 questions x 12 models. Kaggle's AI quota ($50/day, resets 8:30 AM CDT) causes expensive models to fail mid-run with `403 PermissionDeniedError` when quota is exceeded. 7 of 12 models errored on the initial Apr 6 run for this reason.

## Strategy: Use Claude Code as the Model

Instead of running through Kaggle's kbench infrastructure (which burns AI quota), run the benchmark questions directly through Claude Code conversations. Claude Code *is* Claude Opus — it can answer the same 21 questions using the same telemetry data, with no API key or quota required.

### How It Works

1. **Load telemetry data** — Read the JSON session files from `knoverseai-data/pathogenika/telemetry/` and `knoverseai-data/petro-active/telemetry/`
2. **Build the telemetry summary** — Same format the notebook uses (session summaries, event types, timing data)
3. **Ask all 21 questions sequentially** — Each question builds on prior context, same as kbench does via `llm.prompt()` with conversation history
4. **Run assertion logic** — Evaluate the same 27 keyword+grounding assertions + 6 judge assertions against responses
5. **Save results to JSON** — Responses, assertion pass/fail, and scores for analysis

### Advantages
- **No quota limits** — Claude Code conversations have no per-dollar cost cap
- **Iterative exploration** — Can re-ask individual questions, probe interesting responses, adjust prompts
- **Faster feedback** — Results in minutes, not hours of Kaggle queue time
- **Cross-reference** — Compare Claude Code (Opus) responses against Kaggle benchmark results from other models
- **Preserve Kaggle quota** — Save the $50/day for targeted runs on models only available through kbench (Gemini, Qwen, etc.)

### Limitations
- Only tests Claude models (Opus via Claude Code). Other models (Gemini, Qwen) still need Kaggle.
- Results won't appear on the Kaggle benchmark leaderboard
- Conversation context works differently than kbench's `llm.prompt()` — need to verify the prompt format matches

### Workflow

**Phase 1: Explore (Claude Code)**
- Run all 21 questions through Claude Code with full telemetry context
- Identify which questions produce the most interesting signal/differentiation
- Test assertion sensitivity — which assertions are too easy, too hard, or broken
- Iterate on question wording or assertion thresholds if needed

**Phase 2: Targeted Kaggle Runs**
- Use findings from Phase 1 to decide if any notebook changes are needed
- Re-run failed models on Kaggle, cheapest first to maximize coverage within quota
- Run expensive models (Opus, Gemini Pro) only when confident the assertions are well-calibrated
- Order: Opus > Gemini Pro > Sonnet > Qwen > Haiku (best results first)

**Phase 3: Analysis & Writeup**
- Compare Claude Code (Opus) responses vs Kaggle kbench (Opus) responses
- Cross-model comparison from Kaggle results
- Incorporate into competition writeup (deadline: Apr 16)

### Data Locations
- Telemetry: `knoverseai-data/pathogenika/telemetry/` and `knoverseai-data/petro-active/telemetry/`
- Kaggle dataset: `knoverseai-data/kaggle/dataset/`
- Notebook: `knoverseai-data/kaggle/knoverseai-cognitive-benchmark.ipynb`
- Downloaded notebook: `~/Downloads/cm-theory-final (1).ipynb`

### Kaggle Quota Management
- Daily: $50 (resets 8:30 AM CDT)
- Monthly: $500
- Estimated cost per model run (21 questions): $1-2 (Haiku) to $5-10 (Opus)
- Non-Claude models (Gemini, Qwen) must run through Kaggle — no alternative
- Run order when quota-constrained: prioritize best models first (Opus > Gemini > Sonnet > Qwen > Haiku)
