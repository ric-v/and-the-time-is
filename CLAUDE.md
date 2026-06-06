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

**And The Time Is** is a timezone dashboard with an Alto-inspired **Pass** theme — parallax mountain layers, landmark pins for pinned timezones, drag-to-scrub time travel, and sky palettes driven by local hour. Live at http://timeis.astrx.dev.

Legacy card-grid UI under `components/` is deprecated; do not extend it.

## Architecture

### State Management (Redux Toolkit)

Five slices in `store/`:

| Slice | Persisted | Purpose |
|---|---|---|
| `orbs` | yes | User-pinned timezone list (`Orb[]`) |
| `settings` | yes | Display format, motion, scrub memory |
| `scrub` | no | Time travel offset in signed minutes |
| `session` | no | Ephemeral UI state (open modals) |
| `storedata` | legacy | Old card-grid data — do not extend |

Always use typed hooks from `store/store.tsx`: `useAppDispatch`, `useAppSelector`.

Auto-persistence is wired in `utils/persistenceManager.ts` — it subscribes to Redux and writes `orbs` and `settings` to localStorage under `horizon.*` keys on every change (keys kept for backward compatibility).

### Time Model

**Displayed Time** = `Date.now() + scrubOffset * 60_000`
- Scrub offset = 0 → live (ticks every 1s)
- Scrub offset ≠ 0 → frozen moment

All time math lives in `utils/timeEngine.ts`. Use its functions exclusively — do not reimplement UTC offset or format calculations.

UTC offsets are **DST-aware** via `Intl.DateTimeFormat` — never use hardcoded offset tables.

### Pass Scene

The main UI is 2D/CSS parallax (no Three.js). Scene orchestration lives in `components/pass/PassScene.tsx`. Landmarks are laid out along the track via `utils/passLayoutEngine.ts` from Redux `orbs`.

### Initialization Sequence

`hooks/useFirstRunSeeding.ts` runs on mount:
1. Run legacy → Pass migration (`utils/migrationManager.ts`)
2. Load persisted orbs, or parse URL share params (`utils/horizonUrlParams.ts`)
3. Seed defaults for first-time users (Local + UTC + 2 geographically opposite zones)
4. Load persisted settings
5. Subscribe to auto-persistence

### Component Layout

```
components/pass/      ← Active Pass UI
  PassApp.tsx         ← Root: keyboard handlers, modal orchestration
  PassScene.tsx       ← Parallax scene + drag scrub
  PassTopBar / PassScrubBar / PassDetailPanel
  CommandPalette / DateJumpDialog / SettingsPanel
public/styles/pass.css
components/           ← Legacy card UI (deprecated, do not extend)
```

### Key Utilities

| File | Purpose |
|---|---|
| `utils/timeEngine.ts` | All time/offset/format computation |
| `utils/skyPaletteEngine.ts` | Sky color selection by local hour |
| `utils/passLayoutEngine.ts` | Landmark positions along the pass |
| `utils/persistenceManager.ts` | Safe localStorage wrappers, auto-persistence, cache |
| `utils/migrationManager.ts` | One-time legacy data migration |
| `utils/horizonUrlParams.ts` | Share link encoding/decoding |
| `utils/fonts.ts` | Nunito + JetBrains Mono via next/font |

### Middleware

`middleware.ts` is an Edge function that 301-redirects `/TimeWas` → `/?jump=open`.

## Conventions

- **Timezone names**: always use canonical IANA names (e.g., `Asia/Kolkata`, not `IST`). Alias mapping is in `utils/timeNow.ts`.
- **Orb identity**: keyed by `id` (UUID), deduplicated by `ianaName`.
- **Local Orb**: always present, cannot be removed.
- **Safe localStorage**: use `safeGetItem`/`safeSetItem` from `persistenceManager.ts` — handles private browsing and quota errors.
- **Accessibility**: new UI components need ARIA labels, keyboard navigation. Use `hooks/useFocusTrap.ts` for modals, `hooks/useAriaAnnouncer.ts` for live announcements. Honor `prefers-reduced-motion` via `hooks/useReducedMotion.ts`.
