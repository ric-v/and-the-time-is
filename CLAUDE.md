# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm run prod     # Static export (next export)
```

## Project Overview

**And The Time Is** is a timezone dashboard that shows world time on a 3D observatory — a rotating ring with zone orbs representing pinned timezones, a wireframe globe, and a sky palette that shifts by local hour. Live at http://timeis.astrx.dev.

The codebase is in active migration from a legacy card-grid UI to the **Horizon** 3D system. The Horizon system is the primary focus; legacy components are deprecated but still present.

## Architecture

### State Management (Redux Toolkit)

Five slices in `store/`:

| Slice | Persisted | Purpose |
|---|---|---|
| `orbs` | yes | User-pinned timezone list (`Orb[]`) |
| `settings` | yes | Display format, camera, motion preferences |
| `scrub` | no | Time travel offset in signed minutes |
| `session` | no | Ephemeral UI state (open modals, expanded orb) |
| `storedata` | legacy | Old card-grid data — do not extend |

Always use typed hooks from `store/store.tsx`: `useAppDispatch`, `useAppSelector`.

Auto-persistence is wired in `utils/persistenceManager.ts` — it subscribes to Redux and writes `orbs` and `settings` to localStorage under `horizon.*` keys on every change.

### Time Model

**Displayed Time** = `Date.now() + scrubOffset * 60_000`
- Scrub offset = 0 → live (ticks every 1s)
- Scrub offset ≠ 0 → frozen moment

All time math lives in `utils/timeEngine.ts`. Use its functions exclusively — do not reimplement ring angle or UTC offset calculations.

**Ring angle**: `(hour * 60 + minute) / 1440 * 360` where 0° = midnight, 180° = noon.

UTC offsets are **DST-aware** via `Intl.DateTimeFormat` — never use hardcoded offset tables.

### 3D Rendering

Three.js is imported via `utils/three-imports.ts` (tree-shaken barrel — always import from there, not directly from `three`). Scene orchestration lives in `hooks/useSceneOrchestrator.ts`. The canvas is in `components/horizon/SceneContainer.tsx`, which projects 3D orb positions to 2D React overlays on every frame.

### Initialization Sequence

`hooks/useFirstRunSeeding.ts` runs on mount:
1. Run legacy → Horizon migration (`utils/migrationManager.ts`)
2. Load persisted orbs, or parse URL share params (`utils/horizonUrlParams.ts`)
3. Seed defaults for first-time users (Local + UTC + 2 geographically opposite zones)
4. Load persisted settings
5. Subscribe to auto-persistence

### Component Layout

```
components/horizon/   ← Active Horizon UI
  HorizonApp.tsx      ← Root: keyboard handlers, modal orchestration
  SceneContainer.tsx  ← WebGL canvas + React overlay projection
  TopBar / BottomBar  ← Persistent chrome
  Orb*.tsx            ← Orb button, label, detail view
  ScrubControl.tsx    ← Time-travel slider
  CommandPalette / DateJumpDialog / SettingsPanel  ← Modal panels
  HorizonRing.ts / WireframeGlobe.ts / ZoneOrb.ts ← Three.js objects
components/           ← Legacy card UI (deprecated, do not extend)
```

### Key Utilities

| File | Purpose |
|---|---|
| `utils/timeEngine.ts` | All time/ring/offset/format computation |
| `utils/skyPaletteEngine.ts` | Sky color selection (6-state for orbs, 24-state for globe) |
| `utils/persistenceManager.ts` | Safe localStorage wrappers, auto-persistence, cache |
| `utils/migrationManager.ts` | One-time legacy data migration |
| `utils/horizonUrlParams.ts` | Share link encoding/decoding |
| `utils/three-imports.ts` | Tree-shaken Three.js barrel — import Three from here |
| `utils/fonts.ts` | next/font/google config (Inter, JetBrains Mono, Fraunces, IBM Plex Mono) |

### Middleware

`middleware.ts` is an Edge function that 301-redirects `/TimeWas` → `/?jump=open`.

## Conventions

- **Timezone names**: always use canonical IANA names (e.g., `Asia/Kolkata`, not `IST`). Alias mapping is in `utils/timeNow.ts`.
- **Orb identity**: keyed by `id` (UUID), deduplicated by `ianaName`.
- **Local Orb**: always present, cannot be removed.
- **Safe localStorage**: use `safeGetItem`/`safeSetItem` from `persistenceManager.ts` — handles private browsing and quota errors.
- **Accessibility**: new UI components need ARIA labels, keyboard navigation. Use `hooks/useFocusTrap.ts` for modals, `hooks/useAriaAnnouncer.ts` for live announcements. Honor `prefers-reduced-motion` via `hooks/useReducedMotion.ts`.
- **PRD references**: comments like `// Req 3.2` reference `horizon_prd.md` sections — maintain these when modifying related logic.
