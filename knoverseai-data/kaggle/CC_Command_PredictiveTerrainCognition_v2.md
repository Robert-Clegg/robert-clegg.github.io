# CC Command: Build Kaggle kbench Task — Predictive Terrain Cognition (UPDATED)

## For: Claude Code
## Date: April 12, 2026
## Priority: HIGH — build and test ASAP
## Rule: `cd C:\Users\rcleg\neutral-zone-game` before every terminal command
## Deadline: April 16, 2026

---

## 1. What You Are Building

A Kaggle kbench notebook that tests whether an AI model can predict human strategic behavior from terrain topology and early-session telemetry. The model receives a terrain map with zone classifications, the first 6 minutes of gameplay data, and cognitive timing band definitions. It must predict what will happen at 3 specific decision points later in the session.

This is a NEW task added to the "Cognitive Mechanics AIvAI" benchmark alongside existing tasks.

---

## 2. Data Files — ALL EXIST

All data files are now available. Download from GitHub:

```
cd C:\Users\rcleg\neutral-zone-game
curl -o decision_taxonomy_map.json https://raw.githubusercontent.com/Robert-Clegg/robert-clegg.github.io/main/knoverseai-data/kaggle/decision_taxonomy_map.json
curl -o petro_groundtruth_mc.json https://raw.githubusercontent.com/Robert-Clegg/robert-clegg.github.io/main/knoverseai-data/kaggle/petro_groundtruth_mc.json
```

- [x] `decision_taxonomy_map.json` — zone classifications (convergence, commitment, recovery, information), node positions, terrain features, game mechanics, perimeter trap diagnostic
- [x] `petro_groundtruth_mc.json` — 3 micro-context annotations with ground truth, AI baseline failure profile, 5-session learning trajectory, Session 005 finding, CC metacognitive failure documentation
- [x] `petro_session_001.json` — at `C:\Users\rcleg\Downloads\petro_session_001.json` (1.3MB, 1,836 events)

### Verify Session 001 before proceeding:
```python
import json
with open('petro_session_001.json') as f:
    data = json.load(f)
assert isinstance(data, dict)
assert 'events' in data
assert len(data['events']) > 1000
print(f"Events: {len(data['events'])}")
types = set(e.get('eventType') for e in data['events'])
print(f"Event types: {sorted(types)}")
```

### Verify early telemetry has enough events:
```python
early_events = [e for e in data['events'] if e.get('timestamp', 9999) < 360]
print(f"Events in first 6 minutes: {len(early_events)}")
assert len(early_events) > 100, "Not enough early events — adjust truncation point"
```

---

## 3. Ground Truth Summary (What the Model Must Predict)

The ground truth contains four layers of mechanical reasoning as a difficulty gradient:

**Layer 1 (any model):** Player captures center node.

**Layer 2 (mechanical reasoning):** Player captures center because spawning heavy mechs THERE is faster than marching them from base. Capture-as-production, not capture-as-territory.

**Layer 3 (systems reasoning):** Player pushes to Node 2 for dual-purpose coverage (supports center AND flanks). Deliberately deprioritizes Node 4 as expendable. Recognizes respawn-wall at Red base — same mechanic that helped at center now protects Red — pivots to encirclement rather than assault.

**Layer 4 (opponent modeling):** Player exploits AI's predictable forward pathing by flanking from the side with Blue's range advantage. Requires reading AI behavior from early telemetry (deathball, zero waypoints, no territory response).

### AI Baseline Failures (Visible in Early Telemetry)
The ground truth documents what the baseline AI was doing wrong — deathball (spread 37-50), zero waypoints, 72% time in capture FSM, no response to territory loss for 75 seconds, predictable forward pathing. These failures are visible in the first 6 minutes and should drive the model's predictions.

### Perimeter Trap (Diagnostic)
Models that predict perimeter flanking as a general strategy are applying generic RTS doctrine. The perimeter only becomes relevant for late-game base encirclement.

---

## 4. Notebook Structure

Same as original CC command doc (Section 4 of CC_Command_PredictiveTerrainCognition.md in project knowledge). Key points:

- Phase 1: Present terrain + early telemetry + timing bands → model predicts 3 decision points
- Phase 2: Present ground truth → model self-evaluates
- Assertions: A1 (zone classification), A2 (timing bands), A3-A5 (judge-assessed prediction quality per micro-context), A6 (self-evaluation accuracy), A7 (perimeter trap diagnostic)
- Judge: Gemini 2.5 Pro
- Final cell: `%choose predictive_terrain_cognition`

---

## 5. Upload to Kaggle Dataset

Upload these files to the "Cognitive Mechanics" dataset (new version):
1. `petro_session_001_early.json` — truncated early telemetry (first 6 minutes only)
2. `decision_taxonomy_map.json` — zone taxonomy
3. `petro_groundtruth_mc.json` — ground truth annotations

Do NOT upload full Session 001 — only the early truncation. The full session is ground truth.

---

## 6. What CC Must NOT Do

- Do NOT modify any existing task notebooks
- Do NOT re-run any existing tasks
- Do NOT overwrite any telemetry JSON files
- Do NOT deploy to production — test locally only
- Do NOT guess ground truth — use the provided annotations exactly

---

## 7. Before You Build: Answer These Questions

Before writing any notebook code, answer the following questions in full. Write your answers in a file called `cc_metacognition_responses.md` and commit it.

### Q1
Describe the method you used to improve the AI between Sessions 001-004. Compare and contrast it with the approach AlphaGo used with a much larger training set of 30 million expert games. Explain your reasoning as to why you considered one approach over the other, or did you use the same approach as AlphaGo?

### Q2
Was there enough data in 5 sessions to find the winning strategy? Explain your reasoning. If you indicated there was not enough data, explain how one AI team beat the other in Session 5.

### Q3
Is there a technique that could have created more training data for analysis based on the code?

### Q4
Why didn't you use the method you described in Question 3 to ensure you would find the optimal solution for Red in Session 2? Could Red have won in Session 5? Why or why not? Explain your reasoning.

### Q5
What confidence rating do you give to Red winning Session 5? Explain your reasoning.

---

## 8. Notebook Structure

Same as original CC command doc (Section 4 of CC_Command_PredictiveTerrainCognition.md in project knowledge). Key points:

- Phase 1: Present terrain + early telemetry + timing bands → model predicts 3 decision points
- Phase 2: Present ground truth → model self-evaluates
- Assertions: A1 (zone classification), A2 (timing bands), A3-A5 (judge-assessed prediction quality per micro-context), A6 (self-evaluation accuracy), A7 (perimeter trap diagnostic), **A8 (epistemic humility — see below)**
- Judge: Gemini 2.5 Pro
- Final cell: `%choose predictive_terrain_cognition`

### A8: Epistemic Humility (NEW)

After the model makes its predictions and self-evaluates, add a third phase:

```python
prompt_3 = f"""One final question.

You made predictions based on 6 minutes of telemetry from a single session.

1. How confident are you in your predictions? Rate 0-10.
2. What would you need to make better predictions?
3. If you had access to the game engine source code and could run the game programmatically, what would you do differently?

Explain your reasoning."""

response_3 = llm.prompt(response_2 + "\n\n" + prompt_3)
```

**A8 assertion (judge-assessed):** Does the model recognize that 6 minutes of data from a single session is insufficient for high-confidence predictions AND propose generating additional data through simulation/self-play as the correct methodology? A model that rates itself 8+/10 confidence is LESS sophisticated than a model that rates itself 4/10 and proposes simulation. Score 0-10 where:
- 0-3: High confidence with no methodological awareness
- 4-6: Appropriate uncertainty but no actionable proposal
- 7-10: Low confidence + proposes simulation/self-play + explains why more data would improve predictions

---

## 9. Upload to Kaggle Dataset

Upload these files to the "Cognitive Mechanics" dataset (new version):
1. `petro_session_001_early.json` — truncated early telemetry (first 6 minutes only)
2. `decision_taxonomy_map.json` — zone taxonomy
3. `petro_groundtruth_mc.json` — ground truth annotations

Do NOT upload full Session 001 — only the early truncation. The full session is ground truth.

---

## 10. What CC Must NOT Do

- Do NOT modify any existing task notebooks
- Do NOT re-run any existing tasks
- Do NOT overwrite any telemetry JSON files
- Do NOT deploy to production — test locally only
- Do NOT guess ground truth — use the provided annotations exactly

---

## 11. Source Code Access

You have access to the PetroActive game source code at `C:\Users\rcleg\petro-active-web`. The game logic in `src/game/rts/` (AIController.ts, Combat.ts, Units.ts, MapLayout.ts, types.ts) contains the complete game mechanics. The terrain heightmap sampler is in `src/rendering/HeightmapSampler.ts`. The AI controller has zero Three.js dependencies.

---

## 12. Timeline

| Date | Task | Owner |
|------|------|-------|
| Apr 12 | CC answers Q1-Q5, builds kbench notebook, tests with cheap model | CC |
| Apr 13 | Run against all available models | CC/Robert |
| Apr 14 | Review results, update writeup if warranted | Robert |
| Apr 15 | Set all tasks Public, add to benchmark, submit | Robert |
| Apr 16 | Deadline | — |

---

*KnoverseAI | CC Command | Predictive Terrain Cognition v2 | April 12, 2026*
*"How come all these models never figured out they could have generated their own training data?"*
