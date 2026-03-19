# KnoverseAI — External Overlay Architecture
**Fast-Iteration Pattern for UI Layers Decoupled from Game Engine**
*March 19, 2026*

---

## Problem This Solves

The cognitive telemetry overlay (`CognitiveMechanicsOverlay`) was bundled inside the main game build. Every UI change required:

1. TypeScript compile (tsc)
2. Vite bundle (full tree-shake + minify)
3. GitHub Actions deploy (~60–90 seconds)
4. Hard-refresh to bust cache

This is a 2–3 minute iteration loop for what is essentially a CSS/HTML/canvas UI layer that has no dependency on Three.js or the game engine.

**Solution:** Load the overlay as a standalone IIFE script from the GitHub Pages repo. Updates to the overlay = push one 62KB file = live in ~10 seconds. No Actions. No rebuild.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  robert-clegg.github.io (GitHub Pages repo)                 │
│                                                             │
│  petro-overlay.js  ← built by: npm run build:overlay (12ms)│
│  index.html        ← Seismika dashboard                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ <script src="...">
                        │ exposes window.PetroOverlay
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  robert-clegg.github.io/petro-active/ (GitHub Actions)      │
│                                                             │
│  index.html loads:                                          │
│    1. https://robert-clegg.github.io/petro-overlay.js      │
│    2. /assets/main-[hash].js  (Three.js game engine)        │
│                                                             │
│  main.js uses: window.PetroOverlay.CognitiveMechanicsOverlay│
└─────────────────────────────────────────────────────────────┘
```

---

## File Locations

| File | Repo | Purpose |
|------|------|---------|
| `src/telemetry/CognitiveMechanicsOverlay.ts` | `petro-active` | Source of truth — edit this |
| `dist-overlay/petro-overlay.js` | `petro-active` (gitignored from main bundle) | Build output, 62KB IIFE |
| `petro-overlay.js` | `robert-clegg.github.io` | Served at CDN URL, loaded by game |

---

## How the Decoupling Works

### In `petro-active/src/main.ts`

```typescript
// Type-only import — stripped at compile time, zero runtime cost
import type { TelemetryFrame } from './telemetry/CognitiveMechanicsOverlay';

// Runtime: grab from window (populated by the external script)
let cmOverlay: any = null;

const OverlayClass = (window as any).PetroOverlay?.CognitiveMechanicsOverlay;
if (OverlayClass) {
  cmOverlay = new OverlayClass();
} else {
  console.warn('[PetroActive] petro-overlay.js not loaded — telemetry overlay disabled');
}
```

### In `petro-active/index.html`

```html
<!-- Load overlay BEFORE the main module -->
<script src="https://robert-clegg.github.io/petro-overlay.js"></script>
<script type="module" src="/src/main.ts"></script>
```

### Build script in `petro-active/package.json`

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:overlay": "esbuild src/telemetry/CognitiveMechanicsOverlay.ts --bundle --format=iife --global-name=PetroOverlay --platform=browser --target=es2020 --outfile=dist-overlay/petro-overlay.js --minify"
  }
}
```

- `--format=iife` — self-executing, no module system needed
- `--global-name=PetroOverlay` — exposes `window.PetroOverlay`
- `--bundle` — inlines all imports (currently zero — overlay is self-contained)
- Build time: **12ms**

---

## Iteration Workflow

### Overlay-only change (fast path — ~10 seconds to live)

```powershell
# 1. Edit src/telemetry/CognitiveMechanicsOverlay.ts

# 2. Build overlay only (12ms)
cd C:\Users\rcleg\petro-active-web
npm run build:overlay

# 3. Push to pages repo
copy dist-overlay\petro-overlay.js ..\robert-clegg.github.io\
cd ..\robert-clegg.github.io
git add petro-overlay.js
git commit -m "overlay: <describe change>"
git push origin main
# Pages repo deploys immediately — no Actions queue, ~10 seconds

# 4. Hard-refresh the game page (Ctrl+Shift+R)
```

### Full game rebuild (when needed — ~60–90 seconds via Actions)

Required when changing:
- `src/main.ts` (game engine, Three.js, input, physics)
- `index.html`
- Any file other than `CognitiveMechanicsOverlay.ts`

```powershell
cd C:\Users\rcleg\petro-active-web
npm run build
git add -A
git commit -m "game: <describe change>"
git push origin main
# GitHub Actions triggers, ~60 seconds to live
```

---

## Applying This Pattern to Other Projects

### Prerequisites

The component being externalized must be:
- **Self-contained** — no imports from the game engine (Three.js, game state, etc.)
- **Communication via contract** — a typed `interface` (like `TelemetryFrame`) that both sides agree on
- **DOM-only** — creates HTML/CSS/Canvas elements, not Three.js objects

### Step-by-Step for a New Project

**1. Identify the boundary.** What is "UI layer" vs "engine"? The UI layer reads data; the engine writes data. Define the data contract as a TypeScript `interface` in the UI file.

**2. Make the component self-contained.** Move all `import` statements out. The component should start with zero `import` lines (or only import from other UI files being co-bundled).

**3. Add `build:overlay` script to `package.json`:**
```json
"build:overlay": "esbuild src/[YourComponent].ts --bundle --format=iife --global-name=[GlobalName] --platform=browser --target=es2020 --outfile=dist-overlay/[output].js --minify"
```

**4. Change main.ts import to type-only:**
```typescript
import type { YourDataContract } from './YourComponent';
```

**5. Replace `new YourComponent()` with:**
```typescript
const Cls = (window as any).[GlobalName]?.YourComponent;
if (Cls) myComponent = new Cls();
```

**6. Add `<script src="...">` to `index.html` before the main module.**

**7. Push the built `.js` file to the Pages repo for CDN hosting.**

---

## Current KnoverseAI Projects — Status

| Project | Overlay File | Global Name | CDN URL | Status |
|---------|-------------|-------------|---------|--------|
| Petro Active | `CognitiveMechanicsOverlay.ts` | `PetroOverlay` | `robert-clegg.github.io/petro-overlay.js` | ✅ Live |
| Seismika Dashboard | `temporal-replay.jsx` | — | Seismika is pure overlay (no game engine) — entire app is the overlay | N/A |
| MechDiagnosticTerrain | — | — | Apply this pattern when overlay is added | Pending |

---

## Candidate Components for Externalization

Components that are good candidates across all three projects:

| Component | Why Good Candidate |
|-----------|-------------------|
| `CognitiveMechanicsOverlay` | ✅ Done — pure DOM, data contract via `TelemetryFrame` |
| Career softmax bars | No Three.js dependency, pure canvas/HTML |
| COMMS panel (Dr. Kira Tanaka) | DOM-only, Claude API calls |
| Mission briefing UI | Static HTML, no engine coupling |
| Radar renderer | Canvas-only, receives `(mx, mz, heading)` — clean contract |
| Oscilloscope renderer | Canvas-only, receives waveform arrays |

---

## Key Technical Notes

### `window.PetroOverlay` structure

After loading `petro-overlay.js`, the global exposes:
```javascript
window.PetroOverlay = {
  CognitiveMechanicsOverlay: class { ... },
  // Any other exported classes/interfaces from the file
}
```
`interface` exports (TypeScript types) are erased at compile time and do not appear in the IIFE output.

### Cache busting

The Pages repo serves `petro-overlay.js` at a fixed URL. Browser cache can hold stale versions. Options:
- **Hard refresh** (Ctrl+Shift+R) — always works for development
- **Versioned URL** — append `?v=Mar19` to the script src for production deployments
- **Hash in filename** — `petro-overlay-[hash].js` — requires updating `index.html` each deploy (not worth it until the overlay is stable)

For the current dev phase, hard refresh is sufficient.

### TypeScript type safety across the boundary

`TelemetryFrame` is imported as `type` — the TypeScript compiler uses it for editor autocomplete and type checking in `main.ts`, but it emits zero bytes at runtime. This means:
- ✅ Full editor intellisense for `TelemetryFrame` fields in `main.ts`
- ✅ Compile-time errors if you pass wrong data to the overlay
- ✅ No circular dependency at runtime

If you need to call overlay methods with type safety, declare a local interface:
```typescript
interface OverlayInstance {
  update(frame: TelemetryFrame): void;
  cycleStage(): void;
  isVisible(): boolean;
}
let cmOverlay: OverlayInstance | null = null;
```

---

## Handoff Checklist for New Sessions

When starting an overlay-focused session on Petro Active:

- [ ] Clone `petro-active` (PAT required)
- [ ] Clone `robert-clegg.github.io` (PAT required)  
- [ ] Confirm: `npm run build:overlay` produces clean output in `dist-overlay/`
- [ ] Edit `src/telemetry/CognitiveMechanicsOverlay.ts`
- [ ] `npm run build:overlay` after each change group
- [ ] Copy to `robert-clegg.github.io/petro-overlay.js` and push
- [ ] Verify live at `https://robert-clegg.github.io/petro-active/` with hard refresh

**Do NOT run `npm run build` for overlay-only changes.** It takes 5 seconds and triggers a 60-second Actions deploy unnecessarily.

---

*KnoverseAI — Architecture Document — March 19, 2026*
