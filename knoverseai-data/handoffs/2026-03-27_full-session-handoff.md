# Session Handoff — 2026-03-27 (Full Day)
**For:** Next Claude session (Claude.ai or Claude Code)
**Author:** Claude Opus 4.6 (1M context)

## What Happened Today

### PetroActive (Three.js mech game)
Built a waypoint system from scratch across 18 versions:

| Version | What | Commit |
|---------|------|--------|
| WP v1-v5 | Pointer-lock waypoint approach — abandoned due to UX issues (no cursor, wrong camera raycast, inverted direction) | — |
| WP v6 | Minimap HUD overlay — click radar to set waypoint | `271bac7` |
| WP v7-v8 | Radar restyled: coastline contour, elevation shading, building labels | — |
| WP v9 | Full heightmap render from terrain_main.png (513x513 RG16) | `95cb670` |
| WP v10 | Pan/zoom on radar (scroll + drag, double-click reset) | — |
| WP v11-v12 | Sharp re-render from full-res data at any zoom + code cleanup | `3d6c244` |
| WP v13 | Pathogenika-compatible telemetry capture (8 event types) | `b55079e` |
| WP v14 | SAVE DATA button + auto-save to localStorage on unload | — |
| WP v15 | Radar pointer orientation fix (Math.PI - rotation) | `25195d8` |
| WP v16 | Radar pointer second fix (confirmed via telemetry data) | — |
| WP v17 | A* terrain-aware path preview on radar (green/yellow/red by slope) | `3cd6996` |
| WP v18 | Mech follows A* path (waypoint queue system) | `b7f70ab` |

**Branch:** `main` on Robert-Clegg/petro-active
**Dev server:** localhost:3001 (Vite, port 3000 was in use)

### Pathogenika (Unity virus game)
Built a two-player AI opponent:

| Version | What | Commit |
|---------|------|--------|
| AI-v1.0 | AIPlayerController — rule-based opponent, 5 priorities, 2 actions/sec | `213f0fe` → `4ec51a7` |
| AI-v1.0 | playerType field added to telemetry (human/ai) | `f6d8228` |
| AI-v1.0 | playerType fix — added to StringBuilder JSON export (was missing) | `2dc269d` |
| AI-v1.0 | Overview camera Y-axis inversion fix | `2b8b897` |
| AI-v1.1 | Stop waypoint spam (check HasWaypoint before re-issuing) | `883211f` |
| AI-v1.2 | Cell death recovery (null check + re-acquire) | `883211f` |
| AI-v1.3 | Combat priority raised above node capture | `883211f` |

**Branch:** `two-player` on Robert-Clegg/pathogenika (created from `two-player-clean` to avoid ffmpeg.exe in history)
**Note:** Local `main` diverged from remote (178 commits, merge conflicts in Dashboard). Two-player branch is based on local main, cherry-picked to remote.

## Known Bugs (Unfixed)

1. **AI gets stuck at ~11m from node** — reaches near the target but can't dock/capture. The per-cell AIControls handles last-mile, but the AIPlayerController keeps re-issuing waypoints. AI-v1.1 reduced spam but didn't fix the root cause.

2. **AI never switches cells after first acquisition** — SwitchCell only fires if health < 30% AND enemies nearby. In practice the AI rides one PneumoniaType cell until it dies.

3. **AI doesn't use Replicate** — TryReplicate works (no myActivePlayer block) but the AI's combat priority only calls TryEmit, never TryReplicate. Need to add replication logic.

4. **AI abilities not confirmed firing** — TryEmit is called but no AbilityEvent with triggerMethod="AIDecision" and ability="Emit" appears in telemetry. May be blocked by cooldown or character type check.

## Telemetry Data Collected

### In repo: robert-clegg.github.io/knoverseai-data/

**PetroActive** (`petro-active/telemetry/`):
| File | Version | Duration | Events | Key Finding |
|------|---------|----------|--------|-------------|
| petro-1774623147010 | WP v13 | 43s | 186 | 5 waypoints, all cancelled (testing) |
| petro-1774624430825 | WP v15 | 82s | 292 | 4 waypoints, direction fix confirmed |
| petro-1774625153307 | WP v15+ | 129s | 20 | Nearly empty (post-refresh, no play) |
| petro-1774628035861 | WP v16 | 61s | 245 | First successful arrival (123m, 24s) |

**Pathogenika** (`pathogenika/telemetry/`):
| File | AI Version | Team | Duration | Events | Key Finding |
|------|-----------|------|----------|--------|-------------|
| 2026-03-24_05-15-01pm | pre-AI | — | — | — | Baseline single-player |
| 2026-03-24_06-20-37pm | pre-AI | — | — | — | Baseline single-player |
| 2026-03-27_02-50-03pm | AI-v1.0 | 1 (Pathogen) | 133s | 742 | No playerType field (pre-fix), 278 AI decisions |
| 2026-03-27_03-09-28pm | AI-v1.0+ | 1 (Pathogen) | 111s | 336 | playerType working, human=235 ai=101 |
| 2026-03-27_03-18-08pm | AI-v1.0+ | 2 (Immune) | 236s | 390 | 45 kills 3 deaths, AI stuck at node, waypoint spam |

## Architecture

### PetroActive Telemetry
- Events emit through `eventBus.emit('ev_name', payload)`
- TelemetryCapture listens on wildcard `*`, records everything
- Export: `telemetryCapture.exportJSON()` → SAVE DATA button or Shift+backtick
- Local telemetry server on port 3333 saves to repo (node telemetry-server.cjs)
- Auto-save to localStorage on page unload

### Pathogenika Telemetry
- Direct calls: `BehavioralTelemetryRecorder.Instance.RecordXxx()`
- `AddEvent(type, data, playerType="human")` — playerType defaults to human
- AI calls `AddEvent` with `playerType="ai"` via `RecordAIDecision()`
- Export: auto-save every 30s + on quit to TestResults/ and Desktop/PathogenikaCapture/telemetry/

### Key Files
- **PetroActive:** `src/main.ts` (waypoint/radar), `src/core/events/TelemetryEvent.ts` (event schema), `src/telemetry/TelemetryCapture.ts`
- **Pathogenika:** `Assets/Scripts/AIPlayerController.cs`, `Assets/Scripts/BehavioralTelemetryRecorder.cs`, `Assets/Scripts/InitScene.cs`

## Shared Data Directory
```
C:\Users\rcleg\robert-clegg.github.io\knoverseai-data\
  petro-active/telemetry/    ← 4 PetroActive sessions
  pathogenika/telemetry/     ← 5 Pathogenika sessions
  handoffs/                  ← this doc + previous handoffs
```

## Context: Why This Exists
Kaggle AGI benchmark competition (deadline April 16). Two-player game produces paired human+AI telemetry. The AI's behavioral trace is scored using the same Cognitive Mechanics framework that scores the human's trace. The comparison IS the benchmark.

## What's Next
1. Fix AI bugs (stuck at node, no cell switching, no replication)
2. More play sessions with AI-v1.1+ fixes
3. Cross-game telemetry comparison (PetroActive 3D vs Pathogenika 2D)
4. Analyze decision patterns: human vs AI cognitive signatures
5. Build dashboard visualization for paired telemetry

## Critical Rules
- **Never overwrite telemetry files** — each is an irreplaceable session recording
- **Use eventBus.emit() in PetroActive** — never TelemetryCapture.log() (no public .log method)
- **Bump version numbers** with every change so we know what code generated what data
- **Immune captures nodes by killing** — not by docking. Both teams seek nodes but through different mechanics.
- **Mech speed is intentional** — slow mech = gameplay design, not a bug. Multiple vehicle types coming.
