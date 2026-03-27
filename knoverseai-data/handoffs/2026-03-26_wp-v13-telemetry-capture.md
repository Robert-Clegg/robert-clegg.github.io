# Session Handoff — 2026-03-26

## What was done
- Built waypoint radar HUD for PetroActive (WP v1 → v13)
- Radar: 340x220 panel, full heightmap render, pan/zoom, click-to-set waypoint
- Mech walks autonomously to waypoint, continues during free roam camera
- Implemented Pathogenika-compatible telemetry capture via EventBus
- Code cleanup: removed dead vars, added dirty-flag caching

## Telemetry events implemented
| Event | Description |
|-------|-------------|
| ev_radarOpen | F-key pressed, radar shown — discovery/familiarity metric |
| ev_radarClose | Radar dismissed — dwell time, whether waypoint was set |
| ev_waypointSet | Click on radar — world coords, mech position, distance |
| ev_waypointArrive | Mech reached target — travel time, distance |
| ev_waypointCancel | F during travel — remaining distance, travel time |
| ev_controlState | Every mode change — from/to state, trigger, time in previous |
| ev_wasdDwell | Manual WASD movement — duration, distance, start/end position |
| ev_earlyClick | (Schema ready, not yet wired to specific trigger) |

## Export
- Shift+` downloads petro_telemetry_<sessionId>.json
- Files go to: knoverseai-data/petro-active/telemetry/

## Git save points
- 271bac7 — WP v6 (minimap waypoint system)
- 95cb670 — WP v9 (radar HUD with heightmap)
- 3d6c244 — WP v12 (pan/zoom re-render + cleanup)
- Next commit: WP v13 (telemetry capture)

## Next steps
1. Play PetroActive session, export telemetry JSON
2. Play Pathogenika tutorial, export telemetry JSON
3. Compare behavioral data: 2D vs 3D player patterns
4. Wire ev_earlyClick to detect clicks when radar is closed
