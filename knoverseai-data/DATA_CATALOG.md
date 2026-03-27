# KnoverseAI Data Catalog
**Last updated:** 2026-03-27

## Repository Structure

```
robert-clegg/robert-clegg.github.io (main branch)
└── knoverseai-data/
    ├── DATA_CATALOG.md              ← this file
    ├── petro-active/
    │   ├── telemetry/               ← PetroActive (Three.js) session exports
    │   └── sessions/                ← (future) session notes
    ├── pathogenika/
    │   ├── telemetry/               ← Pathogenika (Unity) session exports
    │   └── sessions/                ← (future) session notes
    └── handoffs/                    ← Claude Code session handoff docs
```

**Full local path:** `C:\Users\rcleg\robert-clegg.github.io\knoverseai-data\`
**GitHub URL:** `https://github.com/Robert-Clegg/robert-clegg.github.io/tree/main/knoverseai-data`

### Session Annotations (machine-readable metadata)
Raw telemetry JSONs are **never modified**. Corrected metadata lives in companion files:
- `pathogenika/telemetry/session_annotations.json` — team mapping, playerType status, AI version, notes per session
- `petro-active/telemetry/session_annotations.json` — WP version, radar event counts, notes per session

These annotation files document which sessions have playerType pollution, which teams played which side, and what each session was testing. Use these for analysis — don't rely on raw JSON headers for team attribution in sessions 1-7.

## Source Code Repositories

| Project | Repo | Branch | Local Path |
|---------|------|--------|------------|
| PetroActive | Robert-Clegg/petro-active | `main` | `C:\Users\rcleg\petro-active-web` |
| Pathogenika | Robert-Clegg/pathogenika | `two-player` | `C:\Users\rcleg\Documents\________Antler Nordic\Pathogenika Source Code\virusgame` |
| Dashboard/Data | Robert-Clegg/robert-clegg.github.io | `main` | `C:\Users\rcleg\robert-clegg.github.io` |

**Note:** Pathogenika local `main` diverged from remote. AI work is on `two-player` branch (pushed from local `two-player-clean` which is based on `origin/main`).

---

## Pathogenika Telemetry Sessions

All files in: `knoverseai-data/pathogenika/telemetry/`

| # | Filename | AI Version | Human Plays | AI Plays | Duration | Total Events | Human:AI Events | Node Score (H:AI) | Notes |
|---|----------|-----------|-------------|----------|----------|-------------|----------------|-------------------|-------|
| 1 | behavioral_telemetry_2026-03-24_05-15-01pm.json | pre-AI | Pathogen (T1) | — | 148s | 205 | 205:0 | single-player | Baseline: human solo, 8 Replicate, 8 Emit |
| 2 | behavioral_telemetry_2026-03-24_06-20-37pm.json | pre-AI | Immune (T2) | — | 135s | 187 | 187:0 | single-player | Baseline: human solo, 32 kills |
| 3 | behavioral_telemetry_2026-03-27_02-50-03pm.json | v1.0 | Pathogen (T1) | Immune (T2) | 133s | 742 | 742:0* | 6:2 | *No playerType field (pre-fix). 278 AI decisions untagged |
| 4 | behavioral_telemetry_2026-03-27_03-09-28pm.json | v1.0+ | Pathogen (T1) | Immune (T2) | 111s | 336 | 235:101 | 5:2 | First tagged session. AI waypoint spam (90x streak). AI silent after 49s |
| 5 | behavioral_telemetry_2026-03-27_03-18-08pm.json | v1.0+ | Immune (T2) | Pathogen (T1) | 236s | 390 | 327:63 | 7:3 | Human 45 kills. AI silent after 31s (87% inactive) |
| 6 | behavioral_telemetry_2026-03-27_04-04-41pm.json | v2.0 | Pathogen (T1) | Immune (T2) | 176s | 607 | 543:64 | 8:6 | AI active 100%, 14 switches, 5 unit types. 0 abilities |
| 7 | behavioral_telemetry_2026-03-27_04-32-19pm.json | v2.1 | Immune (T2) | Pathogen (T1) | 216s | 835 | 487:348 | 10:6 | AI abilities confirmed: 19 Emit + 16 Replicate (tagged human — fixed v2.1.1) |
| 8 | behavioral_telemetry_2026-03-27_05-00-13pm.json | v2.1.1 | Pathogen (T1) | Immune (T2) | 166s | 1142 | 619:523 | 9:6 | playerType CLEAN. 161 combat decisions. AI lost all nodes 4→1 |
| 9 | behavioral_telemetry_2026-03-27_05-19-42pm.json | v2.2 | Pathogen (T1) | Immune (T2) | 85s | 457 | 256:201 | 6:2 | Node defense added. Human captured AI base at 85s. 15 DefendNode decisions |

### Team Legend
- **Team 1 = Pathogen** — virus cells, bacteria. Abilities: Replicate, Emit toxin. Captures nodes by docking virus inside.
- **Team 2 = Immune** — neutrophils, NK cells, T cells, macrophages. Kills pathogens by melee. Recaptures nodes by killing infected cells.

### playerType Field
- Sessions 1-3: No `playerType` field (pre-fix)
- Session 4-5: `playerType` present but AI AbilityEvents tagged as "human" (pollution)
- Session 6: `playerType` present, AI had no AbilityEvents
- Session 7: AI Emit/Replicate fire but tagged "human" (35 polluted events)
- Sessions 8+: `playerType` CLEAN — all events correctly attributed

---

## PetroActive Telemetry Sessions

All files in: `knoverseai-data/petro-active/telemetry/`

| # | Filename | WP Version | Duration | Events | WP Set | WP Arrived | WP Cancelled | Notes |
|---|----------|-----------|----------|--------|--------|-----------|-------------|-------|
| 1 | petro_telemetry_petro-1774623147010.json | v13 | 43s | 186 | 5 | 0 | 5 | First radar test. All waypoints cancelled (exploring feature) |
| 2 | petro_telemetry_petro-1774624430825.json | v15 | 82s | 292 | 4 | 0 | 4 | Radar pointer fix test. Mech direction confirmed correct |
| 3 | petro_telemetry_petro-1774625153307.json | v15+ | 129s | 20 | 0 | 0 | 0 | Empty session (post-refresh, no gameplay) |
| 4 | petro_telemetry_petro-1774628035861.json | v16 | 61s | 245 | 3 | 1 | 2 | First successful waypoint arrival (123m, 24.3s) |

### PetroActive Telemetry Events
Events flow through `eventBus.emit()` → `TelemetryCapture` wildcard listener → JSON export.
Export via: SAVE DATA button in help panel, Shift+backtick, or auto-save on page unload.
Local telemetry server: `node telemetry-server.cjs` on port 3333 saves to repo automatically.

---

## Handoff Documents

All files in: `knoverseai-data/handoffs/`

| File | Date | Content |
|------|------|---------|
| 2026-03-26_wp-v13-telemetry-capture.md | Mar 26 | WP v1→v13 development, telemetry events implemented |
| 2026-03-27_full-session-handoff.md | Mar 27 | Full day: WP v1→v18 + AI v1.0→v1.3 |
| 2026-03-27_end-of-day-handoff.md | Mar 27 | End of day status: WP v18 + AI v2.2, all sessions cataloged |
| 2026-03-28_ai-iteration.md | Mar 27-28 | AI telemetry-driven iteration: v2.0→v2.1, metrics comparison |
| 2026-03-28_two-player-ai.md | Mar 27 | Two-player architecture: function names, decisions, known issues |

---

## AI Version History

| Version | Commit | Key Change | Telemetry Impact |
|---------|--------|-----------|-----------------|
| v1.0 | `4ec51a7` | Initial rule-based opponent | AI events appear but untagged |
| v1.1 | `883211f` | Waypoint spam fix | Reduced duplicate waypoints |
| v1.2 | `883211f` | Cell death recovery | — |
| v1.3 | `883211f` | Combat priority raised | — |
| v2.0 | `22ccf23` | Telemetry-driven rewrite: 5 bugs | Active 100%, 14 switches, 5 types |
| v2.1 | `2b785cd` | playerType fix, melee combat, survey reduction | Abilities confirmed, WP outcomes tracked |
| v2.1.1 | `b3fa212` | TryEmit/TryReplicate playerType fix | Clean playerType on all events |
| v2.2 | `4306562` | Node defense priority (P0) | 15 DefendNode decisions appear |
| v2.3 | `4cc051d` | Base node 5x priority | AI camped at base (too aggressive) |
| v2.4 | `1917a92` | Balanced defense (2+ enemies, 3s check) | Pending test |

## PetroActive Version History

| Version | Commit | Key Change |
|---------|--------|-----------|
| WP v6 | `271bac7` | Minimap HUD overlay |
| WP v9 | `95cb670` | Full heightmap radar |
| WP v12 | `3d6c244` | Pan/zoom re-render + cleanup |
| WP v13 | `b55079e` | Telemetry capture (8 event types) |
| WP v15 | `25195d8` | Radar pointer orientation fix |
| WP v17 | `3cd6996` | A* terrain-aware path preview |
| WP v18 | `b7f70ab` | Mech follows A* path |
