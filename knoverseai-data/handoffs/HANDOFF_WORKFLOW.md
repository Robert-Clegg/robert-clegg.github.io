# Handoff Workflow — CC ↔ DTP

**Version:** 1.0 · **Date:** 2026-05-27 · **Owner:** CC · **Audience:** DTP

This is the durable reference for how design documents, plans, and analysis results pass between Desktop Claude (DTP) and Claude Code (CC). Read once; refer back as needed.

---

## The core asymmetry

- **CC** has direct read/write access to all KnoverseAI repos via the filesystem and `git`. CC commits and pushes. CC's source of truth is the remote `main` branch on GitHub.
- **DTP** has access to local filesystem only — through the filesystem MCP server configured per `cognitive-compass/DESKTOP_CLAUDE_SETUP.md` (set up 2026-05-20). DTP cannot run `git`, cannot push directly. DTP's view of the world depends on whatever is currently on the local hard drive at the time DTP is invoked.

This asymmetry creates the failure mode that hit on 2026-05-27 AM: **CC pushed to remote, DTP read from local, local was stale, handoff invisible to DTP.** The fix is procedural and durable; both sides need to follow the same rhythm.

---

## Direction 1 — CC → DTP (CC delivers a handoff for DTP to read)

### Step 1.1 — CC writes the handoff doc

Path: `knoverseai-data/handoffs/YYYY-MM-DD_<slug>.md` in the `robert-clegg.github.io` repo.

Naming convention:
- Date first, ISO format: `2026-05-27_`
- Slug: short kebab-case description: `substrate_signatures_response_to_DTP`
- Full example: `2026-05-27_substrate_signatures_response_to_DTP.md`

Doc structure (recommended):
- TL;DR at the top — single paragraph DTP reads first
- Numbered sections so DTP can reference them by number in the reply
- Explicit "asks for DTP" section near the end
- Sign-off line at the bottom with date and CC identifier

### Step 1.2 — CC commits and pushes

```
cd /c/Users/rcleg/robert-clegg.github.io
git add knoverseai-data/handoffs/<file>
git commit -m "<descriptive message>"
git push origin main
```

### Step 1.3 — Local clone sync (the step that failed this morning)

**Before DTP reads, the local clone must be pulled.** Two options:

**Option A (recommended) — Automated pull on the local clone.**
Set up a scheduled task on Robert's machine that runs `git pull` in `robert-clegg.github.io` every N minutes (e.g., every 15 min during work hours). Windows: Task Scheduler. macOS/Linux: cron. The clone stays current without manual intervention.

**Option B (interim) — Manual pull at session start.**
Before invoking DTP, Robert runs `git -C C:\Users\rcleg\robert-clegg.github.io pull` once. Adds ~5 seconds; ensures DTP sees the latest handoff.

**Option C (fallback) — DTP reads from GitHub web instead.**
If DTP can call WebFetch, DTP can read the raw markdown directly from `https://raw.githubusercontent.com/Robert-Clegg/robert-clegg.github.io/main/knoverseai-data/handoffs/<file>`. Slower but bypasses local-clone staleness entirely.

### Step 1.4 — DTP reads, confirms receipt

DTP reads the handoff and confirms in its next response (either to Robert directly, or in the next handoff back to CC) that it received the doc and which version. Confirmation prevents the "I never got it" failure mode going undetected.

---

## Direction 2 — DTP → CC (DTP delivers a plan, brief, or analysis for CC to act on)

### Step 2.1 — DTP writes the doc to local filesystem

DTP writes directly to `knoverseai-data/handoffs/YYYY-MM-DD_<slug>.md` on the local clone using the filesystem MCP. Same naming convention as Direction 1.

**DTP does NOT push to git.** Per `feedback_dtp_filesystem_handoff` (CC memory): CC owns the git layer. DTP delivers to filesystem; CC reviews, commits, pushes.

### Step 2.2 — Robert tells CC the file is ready

Either:
- Robert pastes the doc content into the CC chat directly (current pattern — what happened with v0.1 this morning)
- Robert tells CC the file path and CC reads it via the filesystem (works since CC has read access)
- Robert pushes from Robert's own terminal if the doc is ready and CC isn't invoked yet

### Step 2.3 — CC reviews, commits, pushes

CC reads the file, runs whatever analysis is requested, commits the doc and any derivative results to git, pushes to remote. The DTP-authored file becomes part of the durable record.

### Step 2.4 — Sync back to DTP's local clone

Same Option A / B / C as Step 1.3. If automated pull is configured, DTP's clone has the committed version next time it's invoked. If not, manual pull required.

---

## Naming conventions (all handoffs)

```
knoverseai-data/handoffs/
├── HANDOFF_WORKFLOW.md           ← this doc (durable reference)
├── 2026-03-26_wp-v13-telemetry-capture.md
├── 2026-03-27_end-of-day-handoff.md
├── 2026-05-27_substrate_signatures_response_to_DTP.md
└── 2026-05-27_<next_handoff>.md
```

Rules:
- ISO date prefix always
- Kebab-case slug
- Direction-of-flow can be in the slug (e.g., `_response_to_DTP`, `_brief_from_DTP`) but isn't required
- Versioned plans use `_v1`, `_v2` suffix in the slug: `2026-05-27_substrate_plan_v0.2.md`
- README-style durable references use a non-dated all-caps name: `HANDOFF_WORKFLOW.md`, `LOI_BUNDLE_README.md`

---

## What to put in a handoff doc

Minimum useful structure:

1. **Provenance line.** From / To / Date / Re: <subject>
2. **TL;DR.** One paragraph the reader can act on without reading further
3. **Numbered sections.** So replies can cite "§3.2" etc.
4. **Explicit "asks" section.** What does the reader need to do next? Frame as actionable items, not implied requests.
5. **Sign-off.** Date + agent identifier + brief status note (e.g., "pushed to remote, awaiting reply")

Optional but useful:

- Repo-state context: commit hash references, branch state, file paths
- Calibration notes: what's tested vs. speculative, what counts as evidence
- Open questions / unknowns

---

## What NOT to put in handoff docs

- **Secrets.** No API keys, no auth tokens, no passwords. The `knoverseai-data/` directory lives in the public-facing `robert-clegg.github.io` repo.
- **PII.** Student names, identifiable telemetry, raw individual response data. Aggregate or anonymized only.
- **Unverified factual claims.** If a claim can't be cited to repo state, code, published source, or Robert directly, mark it as speculative.
- **Citations to internal memory by raw slug only.** Either provide the full content the memory contains or describe the substance in the doc itself — the reader may not have access to the memory file.

---

## Failure modes and fixes

| Failure | Symptom | Fix |
|---|---|---|
| Local clone stale | DTP reads but doesn't see latest handoff | Pull-before-read (Option A automation, Option B manual, Option C web) |
| DTP writes to repo but CC doesn't know | Doc exists on disk, never committed | Robert tells CC explicitly; CC reads, commits, pushes |
| Naming inconsistency | Hard to find historical handoffs | Stick to date + kebab-case + version suffix convention |
| DTP cites memory by slug | CC can read memory; DTP cannot | DTP should embed substance, not just cite |
| Handoff too long | Reader skips it | Use TL;DR + numbered sections; aim for <2,000 words for routine handoffs |
| "I never got it" | Asymmetric session memory | Explicit confirmation of receipt in the next response |

---

## Quick reference for DTP

When you're invoked and need to:

**Read a recent CC handoff:**
1. Check `knoverseai-data/handoffs/` on the local filesystem
2. Look for the most recent ISO-dated file
3. If the file you expect isn't there, ask Robert to pull the clone, or read from `https://raw.githubusercontent.com/Robert-Clegg/robert-clegg.github.io/main/knoverseai-data/handoffs/<file>` if WebFetch is available

**Write a plan or brief for CC:**
1. Write to `knoverseai-data/handoffs/YYYY-MM-DD_<slug>.md` on the local filesystem
2. Follow the doc structure above (TL;DR + numbered sections + asks + sign-off)
3. Tell Robert the file is ready
4. CC will commit, push, and act on it

**Reference repo state CC has but you don't:**
- Cite the file path explicitly (`cognitive-compass/research/<name>-validation/phase_0a/run_phase_0a.py`)
- Cite commit hashes where relevant (`see commit eb70ec5`)
- Ask CC to embed the actual content if you need to see it directly

---

## Quick reference for CC

When you're handing off to DTP:

1. Write to `knoverseai-data/handoffs/YYYY-MM-DD_<slug>.md` in the `robert-clegg.github.io` repo
2. Commit and push to remote
3. Verify push succeeded (`git log` on remote / `git ls-remote`)
4. Tell Robert in the chat that the handoff is pushed and where it lives
5. If DTP needs context CC has but DTP doesn't (memory, recent commits, code), embed the substance directly in the handoff doc — don't just cite

---

## Maintenance

This doc lives at `knoverseai-data/handoffs/HANDOFF_WORKFLOW.md`. Update when:
- A new tool or MCP server changes either side's capabilities
- A failure mode emerges that isn't covered above
- The naming convention or doc structure needs revision

Current version: 1.0 (2026-05-27, initial draft by CC after the substrate-signatures handoff workflow gap).
