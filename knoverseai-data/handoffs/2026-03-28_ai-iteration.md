# AI Iteration Handoff — 2026-03-28
**Version:** AI-v2.0
**Branch:** `two-player` on Robert-Clegg/pathogenika
**Commit:** `22ccf23`

## What the Telemetry Told Me

Analyzed all 5 Pathogenika sessions in `knoverseai-data/pathogenika/telemetry/`:

### Human Behavioral Baseline (from 2 pre-AI + 3 two-player sessions)
| Metric | Human Average | Range |
|--------|--------------|-------|
| Switches per match | 13 | 11-15 |
| Unit types used | 4 | 3-5 (Neutrophil, NKCell, TCell, Macrophage, Virus, Mycobacterium) |
| Kills per match | 26 | 2-45 |
| Deaths per match | 3 | 1-4 |
| Waypoints set | 5 | 3-6, each to DIFFERENT target |
| Control state changes | 10 | 7-16 |
| Active for | 100% | Full match duration |

### AI Behavioral Profile (AI-v1.0 through v1.3)
| Metric | AI Actual | Problem |
|--------|----------|---------|
| Switches | 1 total | Should be ~13 |
| Unit types | 1-2 | Should be 3-5 |
| Kills | 0 | Should be >0 |
| Ability uses | 0 | Emit/Replicate never fired |
| Unique waypoint targets | 1-2 | Spammed same target 60-90x |
| Active duration | 30-49s | Silent 56-87% of match |
| Decision variety | 96% SetWaypoint | Human has switches, waypoints, abilities, control changes |

### Five Root Causes Identified

**BUG 1: Silent majority of match.** AI's controlled cell dies and `FindInitialCell` is only called once. The `Update()` loop checks `controlledCell == null` and returns early, but Unity's destroyed-object null check (`== null` is true) wasn't triggering because `health <= 0` check happened first and the object was already destroyed.

**BUG 2: Waypoint spam.** `SetWaypointToTarget` was called every 0.5s with the same coordinates because `TryPriority2_CaptureNode` and `TryPriority4_SeekNode` have no memory of the current waypoint. The v1.1 `HasWaypoint` check was inverted — it returned `false` when `distToNew > 5f`, meaning "already moving, don't re-issue" was backwards for distant targets.

**BUG 3: No switching.** `TryPriority1_LowHealthSwitch` requires health < 30% AND enemies nearby. Most AI cells die before reaching 30% (instant kill from melee), so the switch condition never triggers. No proactive switching existed.

**BUG 4: Zero abilities.** `TryEmit` and `TryReplicate` are called via `PlayerControls.pc` reference, but the combat priority (P3) was below node capture (P2) in v1.0, and after v1.3 moved it up, the waypoint spam meant the AI was always "busy" navigating and never entered combat range. The `combatRange` of 25m was too tight — cells rarely got that close.

**BUG 5: No unit diversity.** `FindInitialCell` picked the healthiest cell and stuck with it. No mechanism to try different cell types.

## What I Changed (AI-v2.0)

| Fix | What | Why |
|-----|------|-----|
| Death recovery loop | `Update()` checks `IsAlive()` every frame, retries `FindInitialCell` every 1s | AI was silent 87% of match |
| Waypoint state tracking | `hasActiveWaypoint` flag + `lastWaypointTarget` + auto-clear after estimated travel time | 60-90 duplicate waypoints |
| Proactive switching | Every 15s, switch to a cell of an unused type or near an enemy node | Human switches 13x/match, AI switched 1x |
| Wider combat range | 40m (was 25m), `nearbyEnemyRange` 60m (was 40m) | Enemies were never "nearby" |
| Add TryReplicate | 60% replicate / 40% emit when enemies in combat range | AI never used Replicate |
| Unit diversity tracking | `usedUnitTypes` HashSet, prefer new types when switching | AI used 1-2 types vs human's 3-5 |
| Alive checks on queries | `FindNearbyEnemies` and `FindTeamCells` filter dead cells | Was returning destroyed objects |

## What Needs Runtime Testing
- [ ] AI stays active for full match duration (was 13-44% before)
- [ ] AI switches cells multiple times (target: 5+ per match)
- [ ] AI uses Emit and/or Replicate (any AbilityEvent with triggerMethod="AIDecision")
- [ ] AI sets waypoints to different targets (unique target count > 3)
- [ ] AI's team cell count doesn't collapse to 0 early
- [ ] No console errors from null references

## Metrics to Compare (new session vs old)

**Key question: Does AI-v2.0's telemetry trace look more like a human's?**

| Metric | AI-v1.x | Target (human) | AI-v2.0 (pending) |
|--------|---------|----------------|-------------------|
| Active duration | 30-49s | Full match | ? |
| Switches | 1 | 11-15 | ? |
| Unit types | 1-2 | 3-5 | ? |
| Unique waypoint targets | 1-2 | 3-6 | ? |
| Kills | 0 | 2-45 | ? |
| Ability uses | 0 | 4-23 | ? |
| Decision diversity | 96% waypoint | Mixed | ? |

## AI-v2.0 Results (Session: 2026-03-27_04-04-41pm)

Match: Team 1 (Pathogen=human), 176s, 607 events (543 human, 64 ai)

| Metric | AI-v1.x S1 | AI-v1.x S2 | AI-v2.0 | Human Avg | Status |
|--------|-----------|-----------|---------|-----------|--------|
| Active duration | 43% | 12% | **100%** | 100% | FIXED |
| Switches | 1 | 0 | **14** | 13 | FIXED |
| Unit types | 2 | 1 | **5** | 4 | FIXED |
| Unique WP targets | 2 | 1 | **27** | 5 | FIXED |
| Max WP streak | 90 | 60 | **2** | 1 | FIXED |
| Ability uses | 0 | 0 | **0** | 4-23 | NOT FIXED |
| Decision variety | 96% WP | 95% WP | **52/27/22** | Mixed | FIXED |

### Why Abilities Still Don't Fire
The AI played as Immune (Team 2) in this session. TryEmit/TryReplicate only work on Pathogen cell types (PneumoniaType, MycobacteriumType, TuberculosisType). When AI is Immune, it controls NeutrophilType, NKCellType, etc. — these don't have the ability. Need to either:
1. Add Immune-specific abilities to the AI (if they exist)
2. Test with AI playing Pathogen to confirm Emit/Replicate fire
3. Add generic combat actions (melee engage) that work for all cell types

## AI-v2.1 Iteration (from v2.0 + all prior session data)

### Additional Bugs Found in v2.0 Data
| Bug | Evidence | Fix |
|-----|----------|-----|
| A: playerType pollution | 33-96 AbilityEvents with triggerMethod="AIDecision" tagged as human | Added playerType param to RecordAbility() |
| B: No combat engagement | 0 kills, 0 combat events — AI was Immune, can't Emit/Replicate | All cell types now chase enemies via melee waypoint |
| C: Survey spam | 17/64 decisions (27%) were Survey — human never surveys | surveyInterval 10s → 30s |
| D: No waypoint outcomes | Human had 56 Arrived + 4 Died, AI had 0 | ClearWaypointState + death handler emit outcomes |
| E: No ControlStateEvents | Human had 7-13 control changes, AI had 0 | Deferred to v2.2 |

### v2.1 Changes
- `BehavioralTelemetryRecorder.RecordAbility()` and `RecordWaypointOutcome()` now accept playerType param
- AI passes `"ai"` for all its telemetry calls
- Combat P3 now drives ALL cell types toward enemies (melee engage), overrides waypoint when enemy <15m
- Survey interval tripled (10s → 30s)
- Waypoint arrival/death tracking added

### Commit: `2b785cd` on two-player branch

## AI-v2.1 Results (Session: 2026-03-27_04-32-19pm)

Match: Human=Team2 (Immune), AI=Team1 (Pathogen), 216s, 835 events (487 human, 348 ai)

| Metric | v1.x best | v2.0 | v2.1 | Human | Status |
|--------|-----------|------|------|-------|--------|
| Active duration | 43% | 100% | **98%** | 100% | FIXED |
| Switches | 1 | 14 | **14** | 27 | FIXED |
| Unit types | 2 | 5 | **4** | 3-5 | FIXED |
| Decision count | 101 | 64 | **254** | — | IMPROVED |
| UseAbility decisions | 0 | 0 | **119** | — | FIXED |
| Combat decisions | 0 | 0 | **41** | — | FIXED |
| WP outcomes | 0 | 0 | **21** (11 arr, 10 lost) | 4-60 | FIXED |
| Ability events (tagged ai) | 0 | 0 | **73** (WaypointSet) | — | PARTIAL |
| Emit/Replicate fired | 0 | 0 | **35** (19 Emit, 16 Replicate) | 4-25 | FIRES but tagged human |
| Survey % | 4% | 27% | **3%** | 0% | FIXED |
| playerType polluted | 33-96 | 33 | **35** | 0 | v2.1.1 fix pushed |

### Key Finding: Abilities ARE Firing
The 35 "polluted" human AbilityEvents are actually AI Emit (19) and Replicate (16) — they fire correctly but `PlayerControls.TryEmit/TryReplicate` calls `RecordAbility` without the playerType param. Fixed in v2.1.1 (`b3fa212`).

### AI-v2.1.1 Fix
`PlayerControls.cs`: TryEmit and TryReplicate now pass `playerType="ai"` when `triggerMethod=="AIDecision"`.

### Remaining Gaps
- **AI CombatEvents still 0** — the AI drives cells toward enemies and the per-cell AI fights, but kills aren't attributed to the AIPlayerController. CombatEvents are emitted by `HealthAndDamage.cs` which doesn't know about the AI player.
- **AI ControlStateEvents still 0** — deferred to v2.2
- **AI nodes went from 4 → 0** — the AI lost all nodes despite 254 decisions. Human captured 10 nodes. The AI's strategy isn't effective at holding territory.

## What's Next
1. Verify v2.1.1 fixes playerType pollution (Emit/Replicate tagged "ai")
2. Address AI node loss — AI needs defensive behavior (return to threatened nodes)
3. Add ControlStateEvent emission (BUG E)
4. Consider attributing CombatEvents to AI when the killer cell is AI-controlled
5. AI strategy: currently all offense, no defense — losing all 4 starting nodes
