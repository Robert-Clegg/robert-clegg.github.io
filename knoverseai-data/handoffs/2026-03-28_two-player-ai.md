# Two-Player AI Opponent — Handoff Doc
**Date:** 2026-03-27 (built), 2026-03-28 (documented)
**Branch:** `two-player` on Robert-Clegg/pathogenika

## What Was Built

### Scripts Created
- **`Assets/Scripts/AIPlayerController.cs`** (435 lines) — Singleton MonoBehaviour. Rule-based AI opponent that controls Team 2 (Immune). Runs a 5-priority decision loop at 2 decisions/sec, rate-limited to 2 actions/sec.

### Scripts Modified
- **`Assets/Scripts/BehavioralTelemetryRecorder.cs`** — Added `playerType` field ("human"|"ai") to `TelemetryEvent` class. Added `AIDecisionEventData` class and `RecordAIDecision()` method. Modified `AddEvent()` to accept optional playerType parameter (defaults to "human" for backward compatibility).
- **`Assets/Scripts/InitScene.cs`** — Added AIPlayerController spawn in `Start()`. AI plays opposite team from human.

## Actual Function Names Found (Step 0 Codebase Read)

| Action | Placeholder | Real Function |
|--------|-------------|---------------|
| Switch cells | `SwitchToCell()` | No single function — handled by `PlayerControls.myActivePlayer` flag + camera retarget. AI uses `RecordSwitch()` for telemetry. |
| Set waypoint | `SetWaypoint()` | `MovementController.SetWaypoint(Vector3)` — also `MovementController.SetDockWaypoint()` for virus docking |
| Use ability (replicate) | `UseAbility()` | `PlayerControls.TryReplicate(string triggerMethod)` |
| Use ability (emit toxin) | `UseAbility()` | `PlayerControls.TryEmit(string triggerMethod)` |
| Move forward | N/A | `MovementController.QueueMoveForward()` |
| Aim at position | N/A | `MovementController.ProcessAim(Vector3 screenPos, bool isFollow)` |
| Process waypoint click | N/A | `WaypointSystem.ProcessWaypointClick(Vector3 screenPos)` |
| Control state change | N/A | `InputStateManager.Instance.SetState()` / `NotifyWaypointSet()` |
| Lock/unlock controls | N/A | `PlayerControls.LockGameControls` / `SetLockWithTrigger()` |
| Apply movement | N/A | `MovementController.ApplyMovement()` |

## Architecture Decisions

1. **AI controls cells by direct reference, not through InputStateManager.** The human's input goes through InputStateManager → PlayerControls → MovementController. The AI skips InputStateManager (which is keyboard/mouse-specific) and calls MovementController directly. This is simpler and avoids conflicting with human input.

2. **AI "switches" cells by changing its internal `controlledCell` reference.** It doesn't call the camera system (the camera stays on the human's cell). The AI operates headless.

3. **Branch from local main, not remote main.** Remote main had 178 diverged commits with merge conflicts in Dashboard files. Branched from local main (which matches the working Unity project state) to avoid breaking the build.

4. **Stashed local changes.** The working directory had uncommitted .meta files and TestResults — stashed to create a clean branch.

5. **AI uses existing per-cell AI behavior.** The game already has `AIControls` on every cell for autonomous behavior (attack, defend, patrol). The AIPlayerController sits ABOVE this — it picks which cell to "control" and issues strategic commands, while the cell's AIControls handles tactical movement/combat.

## What Works
- AIPlayerController compiles (no Unity editor to verify runtime)
- Telemetry pipeline extended with playerType — all existing events get "human" by default
- AIDecisionEvent captures priority, action, alternatives, game state snapshot
- Both human and AI events write to the same session JSON
- AI spawns on game start and plays opposite team

## What Needs Runtime Testing
- [ ] AI finds and controls cells correctly after spawn
- [ ] AI waypoint setting actually moves cells (MovementController.SetWaypoint)
- [ ] AI ability use (TryEmit via PlayerControls reference) works on non-active-player cells
- [ ] AI cell switching doesn't interfere with human camera
- [ ] AIDecisionEvent appears in exported JSON with correct fields
- [ ] playerType field appears on all events in exported JSON
- [ ] AI doesn't crash when controlled cell dies mid-decision

## Known Issues / Limitations

1. **TryEmit/TryReplicate may not work on AI-controlled cells.** These methods check `myActivePlayer` — if the cell isn't the human's active player, abilities might be blocked. May need to add an override path or call `PerformEmission()` directly.

2. **AI has no fog of war.** It reads all cell positions and node states directly. The human can see all cells too (no fog of war in the current game), so information parity holds — but this is noted as a future design question.

3. **No UI indicator for "AI: Active".** Skipped for v1 — would need HUD modification. AI status is logged to console.

4. **AI doesn't use map mode or zoom.** It reads game state directly, so ViewEvents won't be emitted for the AI. This is a structural difference from human telemetry — the AI doesn't need visual information.

5. **Cell switching is simplified.** The AI picks cells by health/type but doesn't trigger the full switch animation or camera transition that humans see.

## Git Commits (on `two-player` branch)
- `7a324ae` — AIPlayerController with decision loop
- `b4de153` — shared telemetry pipeline with playerType field
- `2d7a57f` — AI opponent spawned on game start

## What's Next
1. **Runtime testing** — open in Unity, play a match, verify AI moves and telemetry exports
2. **Fix TryEmit/TryReplicate** if myActivePlayer check blocks AI abilities
3. **AI ViewEvent emission** — fake periodic "view" events to match human telemetry structure
4. **Difficulty tuning** — adjust decision interval, thresholds, priority weights
5. **Fog of war** (future) — limit AI to information within camera range
6. **API integration** (future) — replace rule-based decisions with Claude API calls
7. **Cross-session learning** (future) — AI adapts based on previous match telemetry

## Information Constraint Analysis
**Does the AI have access to info the human doesn't?**

Currently: **No, with caveats.** Both human and AI can see all cells and nodes — the game has no fog of war. The AI reads game state programmatically (positions, health, node ownership), which is the same information visible on the human's screen and minimap.

However, the AI accesses this information **instantly** (one function call) while the human must visually scan, zoom, or open the map. This is an inherent advantage of programmatic state access. Future work should add either:
- Fog of war (limit AI to cells within a simulated "view range")
- Information delay (AI only sees state updated every N seconds)
- Attention cost (AI must "look" at a region before reading it, consuming a decision tick)
