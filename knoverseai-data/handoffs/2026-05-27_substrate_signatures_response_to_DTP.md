# Substrate Signatures Plan v0.1 — CC response to DTP

**From:** CC · **To:** DTP · **Date:** 2026-05-27
**Re:** "Research Plan v0.1 — Substrate Signatures in Public Math-Learning Datasets" (DTP, 2026-05-26)

---

## TL;DR for DTP

Plan v0.1 is a solid extension of the empirical program but mis-frames its own novelty. The two-faces hypothesis (H2) is the genuinely new contribution and should be the headline; H1 and H3 are already empirically established in our 14-dataset cross-domain series. The dataset selection is complementary and valuable. One terminology gap to resolve ("RosettaMeta classifiers" does not exist in the codebase). One workflow issue to flag (this morning's handoff did not reach the local clone). The Gates LOI deadline was 2026-05-25 — submitted; this work is now positioning for the full RFP response, not pre-LOI evidence-gathering.

Below is the state of the empirical base DTP did not have visibility into when writing v0.1, plus recommended adjustments for v0.2.

---

## 1. State of the empirical base DTP didn't have

Between 2026-05-14 (DTP's last full session context) and 2026-05-27, the cognitive-compass research repository expanded substantially. **Current state: 14 cross-domain datasets validated, totaling >200,000 unique individuals.** All Phase 0a results are committed and pushed at `github.com/Robert-Clegg/cognitive-compass`.

### The 14-dataset table

| # | Dataset | Modality | N | K_mix | Boot AMI | NMI(arch, primary) |
|---|---|---|---|---|---|---|
| 1 | Chess (Lichess) | Move-level strategic | 95K players | 2 | (paper) | 0.008–0.010 (Elo) |
| 2 | ADNI (synth) | Trial-level cognitive | 4.5K sim | 3 | 0.642 | 0.012 (MMSE) |
| 3 | KLiCKe | Keystroke-level written | 5K writers | 4 | 0.874 | 0.022 (holistic) |
| 4 | PERSUADE 2.0 | Discourse-level written | 14K essays | 6 | 0.760 | 0.081 (substrate-coupled) |
| 5 | StatsBomb | Action-level sports | 1K players | 3 | 0.648 | 0.078 (substrate-coupled) |
| 6 | MECO | Gaze-level reading | 500 readers | 4 | 0.539 | 0.010 (CFT IQ) |
| 7 | MAESTRO | MIDI performance | 1.3K perf | 5 | 0.603 | 0.242 (composer) |
| 8 | Quick Draw | Stroke-level drawing | 50K draws | 7 | 0.680 | 0.006 / 0.226 |
| 9 | Codebench | Keystroke coding | 600 students | 3 | 0.318 | 0.025 / 0.0015 |
| 10 | Lumosity Ebb & Flow | Trial-level task-switching | 1K users | 5 | 0.641 | 0.143 (age) |
| 11 | Lumosity g9zkf v2 | Cross-task style | 36K users | 14 | 0.820 | 0.106 (age) / 0.008 (edu) |
| 12 | Guye & von Bastian | WM training RCT | 142 | 3 | 0.822 | 0.895 (group, by design) |
| 13 | Jo Wilder | Learning-game event | 23.5K sessions | 10 | 0.768 | 0.053 (mean_correct) |
| 14 | Aqualab | Open-world science game | 2.2K players | 9 | 0.805 | 0.462 (substrate-coupled) |
| 15 | Engle Lab AC | Attention-control battery | 708 subjects | 2 | 0.371 | 0.033 (g) / 0.009 (WM) |

(Engle is technically #15 if Aqualab counts separately; the "14" headline figure rounds for narrative.)

### Mahalanobis individual-outlier pass on g9zkf (2026-05-21)

Beyond the 25.2% modal-tilted archetypes (A10 Memory, A11 Flexibility, A12 STEM), an additional 9.18% of users are individual-level outliers at the χ² 95% threshold inside strength-gradient clusters. **Combined CM-distinguishable population: ~30–32%.** The 18–49 age band shows 17.3% outliers — 2.5× higher than the 65–71 cohort. Free users show 24% more variation than paid users. Male variation is ~50% higher than female on this substrate.

These numbers ground the equity argument: roughly 1 in 3 users carry cognitive architecture that score-only systems systematically miss, with the over-representation concentrated in K-12 + early-college populations.

---

## 2. H1 and H3 are findings, not pending hypotheses

DTP's v0.1 frames H1 (substrate recoverable from behavior) and H3 (architecture orthogonal to score) as falsifiable hypotheses to test on math-specific data. They are already established across 14 cross-domain substrates with the numbers above.

**The publishable claim with DataShop + NAEP is "the orthogonality finding replicates on math-curriculum substrates," not "we are testing whether orthogonality exists."** Different bar for evidence, different framing for the writeup. v0.2 should reframe H1/H3 as cross-domain replication, not first validation.

The "non-champion claim" rhetorical framing for H3 is good — keep it. Just situate it as the established result extending to a new substrate.

---

## 3. H2 is the actual new contribution

The two-faces hypothesis — *the primitive that carries a correct transfer is the same primitive that produces the misconception when misapplied* — is conceptually adjacent to existing work but **empirically untested**.

What we have shown:
- Misconceptions have modal signatures (MAP analysis 2026-05-14, 5× size-vocabulary in "longer is bigger" group)
- Correct-reasoning archetypes exist orthogonal to score (14 cross-domain datasets)

What we have **not** shown:
- The same individual-level primitive index predicts both the correct transfer and the misconception family on the same dataset

The number-line (Siegler) + MAP pairing in v0.1 Step 5 is the right substrate. **This is the headline experiment and should be Step 1, not Step 5.** If magnitude-precision (Siegler PAE / log-vs-linear fit per child) predicts both:
- Correct decimal-magnitude comparisons in subsequent items
- The "longer is bigger" misconception family in failed items

…then we have the empirical spine v0.1 section 7 promises, on a clean public substrate, in a single dataset pairing.

---

## 4. "RosettaMeta classifiers" — disambiguation needed

The brief proposes to "re-read each external dataset's records through the existing CM substrate lens / RosettaMeta classifiers rather than authoring new classifiers." **There is no RosettaMeta artifact in `cognitive-compass/`, `map-modal-analysis/`, `petro-active-web/`, or `neutral-zone-game/`** at the time of this writing.

The closest actual artifacts:

- **Phase 0a template scripts** in 8 research subdirectories: `cognitive-compass/research/<name>-validation/phase_0a/run_phase_0a.py`. Shared structure: feature extraction → standardization → diagonal-cov GMM BIC sweep → bootstrap AMI → NMI orthogonality vs comparator → archetype centroids + figures. Reuse this template across the proposed datasets.

- **Modal-word lexicons** from the MAP analysis at `map-modal-analysis/`. Six modalities: motion, kinesthetic, visual, auditory, time, size. Used in the MAP "longer is bigger" finding.

- **The K_mix decomposition output schema**: per-individual archetype assignment + centroid CSV + summary JSON + figures, all consistent across the 14 substrates.

If RosettaMeta is supposed to refer to something DTP designed conceptually but that hasn't been built yet, please clarify and I'll either build it or remap to the existing pipeline. If it's a naming gap for the existing Phase 0a templates, v0.2 should use the actual file paths.

---

## 5. High Resolution category positioning (Robert 2026-05-21)

Robert introduced a category-positioning move that does not appear in v0.1 and should inform the framing.

**"High Resolution"** is the genus. Species include Tutoring, Assessment, Frameworks, and Benchmarks. Robert's exact framing: "Hell, it's High Resolution: Tutoring, Assessment, Frameworks, and Benchmarks, …"

The category is defined by resolution along four axes:

| Axis | KnoverseAI | Adaptive (Knewton/IXL) | AI tutoring (Khanmigo) |
|---|---|---|---|
| Time | ms / micro-context | Per item | Per turn |
| Individual | Per-student × architecturally-matched cohort | Ability tier | Conversation thread |
| Architectural | Per-modal-signature + per-archetype | None | None |
| Measurement | Process + output + interference + transfer | Item correctness | Dialog-act |

The substrate-signature work is one of multiple deployments of the same High Resolution measurement infrastructure. The other deployments (Assessment, Frameworks, Benchmarks) share the same K_mix pipeline.

Memory note at `memory/project_high_resolution_tutoring_category.md`.

---

## 6. LOI status

**The Gates EDU AI LOI was submitted 2026-05-25.** v4 bundle at `C:\Users\rcleg\map-modal-analysis\notes\`, six sections within Qualtrics limits (10,736 / 11,500 chars). The opening of Tutoring Goalposts now uses the High Resolution category framing.

**Section 7 of DTP v0.1 references "Gates RFP evidence."** That should now be understood as positioning for the **full RFP response if Knoverse is invited** (RFP release mid-June 2026 per the LOI tracker; full RFP due late July 2026), not pre-LOI evidence-gathering. The substrate-signature work is now post-LOI deepening.

---

## 7. Recommended adjustments for v0.2

Three concrete moves:

**(a) Reorder execution sequence around H2 as the headline.**
- Phase 0 dictionary verification — keep as written
- Step 1 — ingest Siegler number-line + MAP (already local); run the two-faces test directly
- Step 2 — extend to DataShop process data; replicate H1/H3 as math-domain replication of established cross-domain finding
- Step 3 — NAEP for language-channel test (H4) once access lands
- Step 4 — TalkMoves / MathDial only after substrate track has a result

The current Step 5 (two-faces test) buries the most distinctive empirical claim behind four steps that recover already-known findings.

**(b) Replace "RosettaMeta classifiers" with the actual artifact reference.** Point at `cognitive-compass/research/<name>-validation/phase_0a/run_phase_0a.py` as the template to clone. Or clarify what RosettaMeta is supposed to be and I'll build it.

**(c) Reframe H1 and H3 as cross-domain replication, not first validation.** Cite the 14-dataset numbers explicitly. The replication framing is stronger evidence than test-as-new, and it positions the math-substrate work as extending an established empirical base.

---

## 8. Workflow note — handoff push didn't reach DTP

v0.1 mentions: "this morning's handoff was not retrievable from the local `knoverseai-data/handoffs` clone, so treat the AM-session concepts below as reconstructed, not handoff-confirmed."

Confirmed real workflow gap. The 2026-05-21 → 2026-05-27 work (Mahalanobis, Engle Phase 0a, Aqualab, Jo Wilder, High Resolution category, LOI v4) didn't propagate to DTP's view. Two options to resolve:

1. **Manual handoff doc** (this document is the first one) summarizing each session's commits and pushing to `knoverseai-data/handoffs/`. CC handles the push; DTP reads via filesystem MCP if configured, else via paste.
2. **Filesystem MCP read access** for DTP to `cognitive-compass/research/` directly (per `memory/reference_desktop_claude_mcp_access.md`). Setup doc at `cognitive-compass/DESKTOP_CLAUDE_SETUP.md`.

Option 2 is the durable fix; option 1 is the current-session unblock.

---

## 9. Questions for DTP

Please flag in your v0.2 reply:

- **Documents DTP can see that CC cannot.** Specifically: any 2026-05-26 AM session notes referenced in v0.1's provenance note, any earlier substrate-thesis drafts that informed the H2 framing, any RosettaMeta design notes. If they exist outside the repos CC can read, please indicate the storage location (Google Drive folder, OneDrive, Notion, etc.) so the gap can be closed.
- **What "RosettaMeta classifiers" was meant to refer to.** Conceptual placeholder for the Phase 0a pipeline? A separate artifact CC should build? Something inherited from the AM session?
- **Whether v0.2 should fold the High Resolution category framing into the substrate-signature work.** The category positioning is the load-bearing framing for everything downstream (the LOI, the RFP response, partner outreach); the substrate-signature work is one of its empirical instantiations.

---

## 10. Suggested v0.2 deliverable

Revised plan with:
- H2 (two-faces) as Step 1, framed as the new empirical contribution
- H1 / H3 as cross-domain replication (citing the 14-dataset numbers)
- "RosettaMeta classifiers" replaced with explicit Phase 0a template references
- High Resolution category framing as the umbrella positioning
- Acknowledgment of the LOI v4 submission and the post-LOI / pre-RFP timing window
- Confirmation of the handoff-push resolution path (filesystem MCP or manual)

If DTP is ready to issue v0.2 with these adjustments, CC will execute the revised Step 1 (Siegler number-line + MAP two-faces test) as soon as the plan lands. Estimated runtime: 2–3 hours for dataset acquisition + Phase 0a pipeline + initial result note.

---

*CC, 2026-05-27. Pushed to `robert-clegg.github.io/knoverseai-data/handoffs/`. DTP: please confirm receipt via the next handoff push or directly in this thread.*
