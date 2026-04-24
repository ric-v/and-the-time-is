# Horizon — Product Requirements Document

**Project:** And The Time Is — Horizon redesign
**Status:** Specification (Pre-implementation)
**Owner:** Richie Varghese
**Document type:** Requirements & functional specification
**Companion document:** `horizon-ui-ux-spec.md` (visual & interaction design)

---

## 1. Introduction

Horizon is a complete redesign of `timeis.astrx.dev` that replaces the current hero-clock-plus-card-grid layout with a single-viewport, three-dimensional time instrument. The user sees a small rotating globe at the center of the screen, encircled by a horizon ring that holds one **Zone Orb** per pinned timezone. Each orb displays its city's current local time and is colored by that city's current sky state. A time scrubber beneath the globe lets the user rotate all orbs through past or future hours in perfect synchrony, collapsing the current app's split between "Time Now" and "Time Was" into a single gesture.

The core insight driving this redesign: a timezone is not a row in a list — it is a position on the Earth's rotation. Horizon makes that rotation literal, interactive, and compact.

---

## 2. Goals & non-goals

### 2.1 Goals

- Reduce the app to a **single non-scrolling viewport** on desktop and a single non-scrolling primary screen on mobile.
- Replace the split Time Now / Time Was modes with **one unified time scrubber** capable of representing any moment from any point in history to any point in the future.
- Give the app a **distinctive, memorable identity** that no other timezone tool currently occupies.
- Make **cross-timezone overlap** (who is awake / asleep / in working hours) visually obvious at a glance, without requiring arithmetic.
- Reuse existing infrastructure where it still earns its place: the Sky Theme Engine (compressed to 6 states for orb fills and full 24 for globe + detail view), the timezone search API, the localStorage persistence layer, and the display format toggle.
- Preserve full keyboard accessibility and a respectful `prefers-reduced-motion` fallback.

### 2.2 Non-goals

- Weather integration. The Open-Meteo overlay system and all associated particle canvases are removed from scope.
- A separate Time Was page. Time travel is absorbed into the main view.
- A separate timezone detail modal. Detail is surfaced via in-place orb expansion.
- The current hero clock, timezone card grid, Comparison Grid, and navbar-based page switching.
- Mobile feature parity with desktop for the hold-to-orbit camera; mobile receives a simplified locked view.

### 2.3 Success criteria

- The primary view fits in a 1280×800 viewport with no vertical scroll and with at least eight orbs visible simultaneously without overlap.
- A user can scrub ±24 hours in under two seconds of continuous drag and see every orb update live.
- A user can add, rename, and remove a timezone orb in under three clicks from the primary view.
- Every feature in the current app's feature list (live local time, pinned timezones, search, format toggle, time-was conversion, localStorage persistence, copy-time, relative offset display) is present in Horizon in some form — or is explicitly documented as cut.
- The app stays above 55 fps on a mid-tier 2022 laptop (Intel Iris Xe, integrated graphics) with twelve orbs on screen.

---

## 3. Glossary

- **Globe** — the low-poly 3D sphere at the center of the viewport. Rotates in real time and is re-lit by the scrubber.
- **Terminator** — the day/night boundary drawn on the globe's surface. The lit hemisphere represents regions currently in daylight; the dark hemisphere represents regions currently in night.
- **Horizon Ring** — the virtual circular band on which Zone Orbs are positioned. Sits in the same plane as the viewer's line of sight, with a slight isometric tilt.
- **Zone Orb** — a small spherical or billboard element representing one pinned timezone. Carries a label, a time readout, and a fill color derived from the local sky state.
- **Local Orb** — the user's own timezone orb, visually distinguished from peer orbs. Always present, cannot be removed.
- **Ring Angle** — an orb's angular position on the horizon ring, measured clockwise from the 12-o'clock position. Determined by the orb's local hour (midnight = 0°, 6 AM = 90°, noon = 180°, 6 PM = 270°).
- **Scrub Offset** — the number of minutes added to real time for display purposes. `0` means "show real time now"; `+120` means "show the state two hours in the future"; `-180` means "show the state three hours ago."
- **Displayed Time** — real time plus the scrub offset. This is the moment every orb and the globe render.
- **Anchor Orb** — the orb currently acting as the reference point for relative offset calculations. Defaults to the Local Orb; the user may temporarily set any other orb as anchor.
- **Sky Palette** — a color pair (zenith + horizon) drawn from the Sky Theme Engine for a given hour.
- **6-state Palette** — the compressed set of six canonical sky moments (Midnight, Dawn, Day, Noon, Dusk, Night) used for orb fills.
- **24-state Palette** — the full hourly palette used for the globe tint and the expanded orb detail view.
- **Detail View** — the in-place expanded orb state triggered by a click, replacing the old timezone modal.
- **Date Jump** — the dialog that lets the user leap the Scrub Offset to any arbitrary past or future date.
- **Orb Drift** — the slow ambient rotation of orbs around the ring as real time advances (one full revolution per 24 hours).

---

## 4. Personas & primary use cases

### 4.1 Personas

- **Remote worker Rhea.** Collaborates with colleagues in three to five timezones. Needs to answer "can I schedule a 4 PM call today without hitting anyone's midnight?" multiple times a week.
- **Globetrotter Gabe.** Tracks eight to fifteen cities — family, friends, business contacts. Wants a pleasant always-open tab that shows him at a glance who's awake.
- **Developer Dev.** Debugging a timestamp bug. Needs to convert a specific Unix timestamp to local time in several zones, quickly.
- **Casual curiosity Cara.** Visited the site once from a link on HN. Will leave in ten seconds if it feels confusing.

### 4.2 Primary use cases

1. **Glance.** Load the app; see the current time in every pinned zone; see who's awake.
2. **Add.** Add a new timezone to the ring.
3. **Schedule.** Scrub forward a few hours to find a moment where three specific zones overlap in working hours.
4. **Convert.** Input a specific historical timestamp; read off what it was (or will be) in each pinned zone.
5. **Curate.** Rename a zone ("HQ Office" instead of "America/New_York"), remove one, reorder the list mentally by their ring positions.
6. **Share.** Copy a specific moment's times across all zones as text to paste into a Slack message.
7. **Deep-dive.** Click a zone to see its IANA name, UTC offset, relative offset from local, abbreviation, current date.

---

## 5. Information architecture

Horizon is a single-page application with one primary screen and four overlays. No page routing; the Time Was URL (`/TimeWas`) is preserved as a redirect to the main screen with the Date Jump dialog auto-opened.

```
/ (root)
├── Primary Screen
│   ├── Top Bar                 ← brand, date readout, settings
│   ├── Scene Canvas             ← globe, ring, orbs
│   ├── Scrub Control            ← fine ±24h scrubber + Now button
│   ├── Bottom Bar               ← [+ add zone], mode chips, share
│   └── Status Pill              ← shows Displayed Time vs. real-time offset
│
├── Overlay: Command Palette    ← Ctrl/⌘+K — add-zone keyboard-first flow
├── Overlay: Date Jump          ← jump Scrub Offset to any date/time
├── Overlay: Orb Detail View    ← expanded orb replacing its ring position
└── Overlay: Settings Panel     ← format, orb drift, reduced motion, about
```

---

## 6. Core feature requirements

Each requirement uses the EARS-style pattern consistent with your existing spec format.

### Requirement 1 — The Scene Canvas

**User story:** As a user, I want a single three-dimensional scene containing my timezones, so that I can understand them spatially without scrolling through a list.

#### Acceptance criteria

1. THE System SHALL render exactly one Scene Canvas occupying the full viewport, layered above the page background and below all UI overlays.
2. THE Scene Canvas SHALL contain: one Globe at the center, one Horizon Ring encircling the Globe, zero or more Zone Orbs positioned on the ring, the Local Orb always present on the ring, and any ambient particles or glow layers required by the UI spec.
3. WHEN the viewport is resized, THE Scene Canvas SHALL re-fit its contents such that the Globe diameter is 18% of the smaller of viewport width or height, and the Horizon Ring radius is 34% of that same dimension.
4. THE Scene Canvas SHALL maintain a minimum of 55 frames per second on mid-tier integrated-graphics hardware with up to twelve orbs on screen.
5. THE Scene Canvas SHALL gracefully degrade to a static isometric 2D rendering when WebGL is unavailable or when `prefers-reduced-motion: reduce` is set; in that fallback all animations SHALL be replaced with instant state changes.
6. THE Scene Canvas SHALL NOT exceed 4 MB of GPU texture memory.

### Requirement 2 — The Globe

**User story:** As a user, I want to see the Earth and its day/night terminator so that I understand where sunlight is falling at the Displayed Time.

#### Acceptance criteria

1. THE Globe SHALL render as a low-polygon sphere with a stylized continent silhouette texture and no city-level detail.
2. THE Globe SHALL rotate continuously on its polar axis such that one full rotation takes 24 real seconds when the Scrub Offset is zero; when the Scrub Offset is non-zero, the Globe SHALL hold a rotation corresponding to the Displayed Time rather than advancing in real time.
3. THE Globe SHALL display a visible Terminator line computed from the Displayed Time, with the lit hemisphere rendered in the current Sky Theme Engine's "Noon" gradient and the dark hemisphere rendered in the "Midnight" gradient.
4. WHEN the Displayed Time crosses an hour boundary during a scrub, THE Globe SHALL crossfade its lit-hemisphere tint from the outgoing hour's color to the incoming hour's color over 200ms.
5. THE Globe SHALL render a subtle atmospheric rim glow in the color of the lit-hemisphere hour.
6. THE Globe SHALL NOT display country borders, political divisions, or labeled geographic features.

### Requirement 3 — The Horizon Ring and Orb positioning

**User story:** As a user, I want my timezones arranged spatially in a way that instantly communicates their time-of-day, so that I can see at a glance who is awake.

#### Acceptance criteria

1. THE Horizon Ring SHALL render as a faint circular guide, barely visible (≤10% opacity) at rest and slightly more visible (≤30% opacity) during hover or scrub interactions.
2. EACH Zone Orb SHALL be positioned at a Ring Angle computed from its local hour at the Displayed Time, using the mapping: 0° = midnight (12 o'clock position), 90° = 06:00 (3 o'clock position), 180° = noon (6 o'clock position), 270° = 18:00 (9 o'clock position).
3. THE Ring Angle for a given orb SHALL be computed including fractional minutes, such that an orb at local time 09:30 sits at 142.5°, not 135°.
4. WHEN two or more orbs occupy Ring Angles within 8° of each other, THE System SHALL apply a cluster-separation algorithm that fans them outward along the ring tangent so that no two orb centers are closer than 8° in angular distance. The cluster's mean angle SHALL remain at the original shared position.
5. WHEN the user hovers the cursor within 48 pixels of a clustered orb group, THE orbs in that cluster SHALL temporarily expand their separation to 16° and lift slightly off the ring until the cursor leaves the area.
6. IF the orb drift setting is ON, THEN each orb's Ring Angle SHALL update continuously as real time passes, producing a slow clockwise drift of one full revolution every 24 hours when the Scrub Offset is zero.
7. IF the orb drift setting is OFF, THEN each orb SHALL update its Ring Angle only when the Displayed Time changes by scrub, date jump, or manual refresh — between such updates the orb SHALL remain visually stationary.
8. WHEN the ring holds more than fifteen orbs, THE System SHALL reduce orb base diameter proportionally to maintain visual separation, down to a minimum diameter of 40% of the default.

### Requirement 4 — Zone Orbs

**User story:** As a user, I want each of my tracked timezones to appear as a small self-contained element that tells me its name and local time at a glance.

#### Acceptance criteria

1. EACH Zone Orb SHALL display: (a) a circular body filled with the orb's active 6-state Sky Palette, (b) the city label below or beside the orb per the UI spec, (c) the orb's local time at the Displayed Time, (d) a small celestial marker (sun icon for day-range states, moon icon for night-range states) inside the orb body.
2. THE orb body fill SHALL be selected from the 6-state Sky Palette based on the orb's local hour at the Displayed Time, using the mapping: 05:00–06:59 = Dawn, 07:00–11:59 = Day, 12:00–13:59 = Noon, 14:00–17:59 = Day, 18:00–19:59 = Dusk, 20:00–22:59 = Night, 23:00–04:59 = Midnight.
3. THE city label SHALL default to the timezone's primary city name as returned by `/api/timezones` and SHALL be editable by the user to any string of 1 to 30 characters.
4. THE orb's time readout SHALL update at most once per second when real-time is live, and instantly when the Scrub Offset changes.
5. THE orb's time readout SHALL honor the global display format setting (HH:MM:SS, 12h AM/PM, ISO 8601, or Unix), with the Unix readout displayed in a slightly smaller monospace face to accommodate its length.
6. THE Local Orb SHALL be visually distinguished from peer orbs via a persistent accent ring, an "you" or "local" tag, or an equivalent affordance specified in the UI spec.
7. THE Local Orb SHALL NOT be removable by the user.
8. EACH orb SHALL be independently focusable via keyboard tab navigation, with an accessible name of the format `"{city label}, {displayed local time}"`.

### Requirement 5 — The Scrub Control

**User story:** As a user, I want to slide time backward or forward and watch every zone update in sync, so that I can understand what a given moment looks like across all my zones.

#### Acceptance criteria

1. THE Scrub Control SHALL render as a horizontal track positioned below the Scene Canvas, with a central "Now" marker, a draggable handle indicating the current Scrub Offset, and minor tick marks every 15 minutes, major ticks every hour.
2. THE Scrub Control SHALL support a range of −24 hours to +24 hours of Scrub Offset without leaving the primary view; values outside this range SHALL be reachable only via the Date Jump dialog.
3. WHEN the user drags the handle, THE System SHALL update the Scrub Offset in real time (at the drag event rate), and THE Globe, every orb's Ring Angle, every orb body fill, and every orb time readout SHALL update in the same frame.
4. THE Scrub Control SHALL snap the handle to the nearest 15-minute tick if the user releases within 3 pixels of that tick; otherwise the handle SHALL hold the exact dragged position.
5. THE Scrub Control SHALL display a live readout of the Displayed Time in the user's local timezone, formatted per the global format setting, directly adjacent to the handle.
6. WHEN the Scrub Offset is non-zero, THE Scrub Control SHALL show a visible "Now" button that returns the Scrub Offset to 0 on click.
7. THE Scrub Control SHALL be operable by keyboard: Tab focus, Left/Right arrows move by 15 minutes, Shift+Left/Right move by 1 hour, Home returns to Now, End jumps to the +24h boundary, PageUp/PageDown moves by 6 hours.
8. WHEN the Scrub Offset is non-zero for more than 30 seconds without user interaction, THE System SHALL NOT automatically return to Now; the user remains in the scrubbed state until they explicitly return.

### Requirement 6 — Date Jump

**User story:** As a user, I want to leap to a specific date and time far outside the ±24h scrub range, so that I can convert arbitrary timestamps or plan distant events.

#### Acceptance criteria

1. THE Date Jump dialog SHALL be accessible from the Scrub Control's overflow button, from a keyboard shortcut (Ctrl/⌘+G), and from the settings panel.
2. THE Date Jump dialog SHALL accept input in any of three formats: (a) a date picker plus time picker, (b) an ISO 8601 string, (c) a Unix timestamp in seconds or milliseconds.
3. WHEN the user submits a valid Date Jump, THE System SHALL set the Scrub Offset to the signed difference in minutes between the submitted moment and real time, triggering all downstream updates.
4. WHEN the user submits a Date Jump whose Scrub Offset falls within ±24h of real time, THE Scrub Control SHALL animate its handle to the corresponding position; WHEN outside that range, THE Scrub Control SHALL display a collapsed "Far future" or "Far past" state with an overflow indicator and the Displayed Time readout prominently shown.
5. THE Date Jump dialog SHALL support interpretation relative to any pinned timezone (e.g. "2025-12-25 09:00 Tokyo time"), not only the user's local timezone, via a timezone picker field.
6. THE Date Jump dialog SHALL display a preview of the resulting Displayed Time in all pinned timezones before the user confirms.
7. THE Date Jump dialog SHALL close on Escape, on backdrop click, and on successful submission.

### Requirement 7 — Orb Detail View

**User story:** As a user, I want to see full details of a zone and access actions on it without leaving the main view, so that I stay oriented while managing my list.

#### Acceptance criteria

1. WHEN the user clicks a Zone Orb, THE Orb Detail View SHALL activate: the clicked orb SHALL scale up to approximately five times its ring size and migrate to the center of the viewport, the Horizon Ring and all other orbs SHALL fade to 15% opacity, and the Globe SHALL fade to 40% opacity and stop its auto-rotation until the detail view is dismissed.
2. THE Orb Detail View SHALL display: the expanded orb filled with the full 24-state Sky Palette for the orb's current local hour (not the compressed 6-state version), the city label with inline edit affordance, the orb's current local time in large type using the active display format, the full IANA timezone name, the current UTC offset including DST awareness, the relative offset from the Local Orb (or from the current Anchor Orb), the local date, and a small sunrise/sunset readout if available.
3. THE Orb Detail View SHALL expose the following actions as buttons or icons: Copy Time (copies the current local time as text), Copy Full (copies name + time + offset), Rename, Set as Anchor, Remove Zone, Close.
4. WHEN the user selects Set as Anchor, THE System SHALL update all other orbs' relative-offset readouts to reference the clicked orb; the Local Orb's relative offset SHALL also recompute; the anchor selection SHALL persist until the user resets to the Local Orb.
5. WHEN the user selects Remove Zone on the Local Orb, THE System SHALL refuse the action and display an inline explanation.
6. WHEN the user clicks outside the expanded orb, presses Escape, or clicks Close, THE Orb Detail View SHALL dismiss: the orb SHALL migrate back to its Ring Angle and scale down, and the ring + other orbs + Globe SHALL restore full opacity and animation.
7. WHILE the Orb Detail View is active, the Scrub Control SHALL remain fully functional; scrubbing SHALL update the expanded orb's time, local hour, and body fill live.
8. THE Orb Detail View SHALL trap keyboard focus and support standard modal-style tab cycling; focus SHALL return to the previously-focused orb on dismissal.

### Requirement 8 — Add Zone flow (Command Palette)

**User story:** As a user, I want to add a new timezone to my ring quickly, preferring my keyboard.

#### Acceptance criteria

1. THE Command Palette SHALL open on any of: click of the "+ add zone" button in the Bottom Bar, keyboard shortcut Ctrl+K or Cmd+K, or focus on the empty-state prompt shown when no orbs are pinned.
2. THE Command Palette SHALL present a search input auto-focused on open, with placeholder "Search city, IANA zone, UTC offset, abbreviation…", and SHALL query the existing `/api/timezones` endpoint with a 150ms debounce.
3. THE Command Palette SHALL render results as a vertical list, each row showing city, country, IANA name, and a small preview chip colored by the timezone's current local Sky Palette.
4. THE Command Palette SHALL support arrow-key navigation and Enter-to-select; on selection, THE System SHALL add a new orb to the ring at the correct Ring Angle for the selected zone's current local hour, with a 400ms entrance animation specified in the UI spec.
5. THE Command Palette SHALL display, when the search input is empty, two sections: "Recent" (last five searched zones) and "Popular" (IST, UTC, EST, PST, JST, CET, GMT, SGT).
6. WHEN a zone is already pinned, its row in the Command Palette SHALL indicate this and selecting it SHALL be a no-op that closes the palette.
7. THE Command Palette SHALL close on Escape, backdrop click, or successful add.

### Requirement 9 — Local timezone detection and seeding

**User story:** As a first-time visitor, I want the app to show something useful immediately without making me configure anything.

#### Acceptance criteria

1. ON first load, THE System SHALL determine the user's local timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` and create the Local Orb for that zone.
2. ON first load, WHEN no persisted orb list exists in localStorage, THE System SHALL additionally seed the ring with three suggested zones: UTC, plus the two most geographically opposite "popular" zones from the user's local zone (e.g. an IST user is seeded with UTC, EST, JST).
3. THE System SHALL display a one-time dismissible coach-mark the first time the user opens the app, explaining the Scrub Control and the click-to-expand gesture in no more than two sentences.
4. THE System SHALL persist orb list, orb labels, Scrub Offset (optional — see Requirement 11), display format, orb drift toggle, and Anchor Orb selection to localStorage on every change.

### Requirement 10 — Display format

**User story:** As a user, I want to choose how times are rendered across the app.

#### Acceptance criteria

1. THE System SHALL support four display formats: 24-hour (HH:MM:SS), 12-hour (h:MM:SS AM/PM), ISO 8601 (YYYY-MM-DDTHH:MM:SS±ZZ:ZZ), and Unix timestamp (integer seconds).
2. THE format choice SHALL apply uniformly to every time readout in the app: orb labels, Orb Detail View, Scrub readout, Date Jump preview, copied-clipboard strings.
3. THE format control SHALL live in the Settings Panel, with a secondary mirror in the Scrub Control area for quick access.
4. WHEN the ISO 8601 format is selected, every time readout SHALL include the correct DST-aware UTC offset for the relevant zone at the Displayed Time.
5. WHEN the Unix format is selected, every time readout SHALL display the same integer value regardless of zone (Unix time is zone-independent), and this SHALL be visually explained via a small "UTC-referenced" hint near the format control.

### Requirement 11 — Persistence and state restoration

**User story:** As a returning user, I want my pinned zones, settings, and (optionally) my last scrub position to be waiting for me.

#### Acceptance criteria

1. THE System SHALL persist to localStorage, on every change, the following state: orb list (IANA name, user label, creation timestamp), display format, orb drift toggle, reduced-motion override, coach-mark dismissal, Anchor Orb IANA name, last-opened camera angle, and recent searches.
2. THE System SHALL NOT persist the Scrub Offset by default; on page reload, the Scrub Offset SHALL reset to zero (real time).
3. THE System SHALL offer a setting "Remember last scrub position" that, when enabled, persists the Scrub Offset and restores it on reload; when this setting is on AND the persisted offset is non-zero AND more than one hour has elapsed since the persisted timestamp, THE System SHALL reset to zero anyway and show a small toast "Scrub position expired, returned to now."
4. IF localStorage is unavailable (private mode, quota), THEN THE System SHALL continue to function session-only, warning the user once via a dismissible toast.
5. THE System SHALL provide a "Reset Horizon" action in the Settings Panel that clears all persisted state and re-runs first-load seeding.

### Requirement 12 — Share moment

**User story:** As a user, I want to paste "what time is it across my zones right now (or at the scrubbed moment)" into a Slack message or email.

#### Acceptance criteria

1. THE Share control SHALL render as a button in the Bottom Bar labeled "Share moment" or equivalent iconography.
2. WHEN invoked, THE System SHALL generate a plain-text block containing: the Displayed Time formatted per the current format setting, a label such as "— live" if the Scrub Offset is 0 or the signed offset readout if not, and one line per pinned orb in the format `{city label} — {local time} ({UTC offset})`.
3. THE System SHALL copy this text to the clipboard and display a 2-second confirmation toast.
4. THE Share control SHALL offer a secondary option "Share as link" that generates a URL embedding the current Scrub Offset and pinned zone list, such that opening the link reproduces the view.
5. THE share link SHALL be limited to URLs no longer than 2000 characters; when exceeded, the link SHALL encode only the Scrub Offset and the user SHALL be informed their zone list was not included.

### Requirement 13 — Keyboard navigation and accessibility

**User story:** As a keyboard-only user or a user of assistive technology, I want to use every feature of Horizon without a pointer.

#### Acceptance criteria

1. THE System SHALL define a keyboard tab order: Top Bar brand → Top Bar settings → Scene Canvas (focus enters the first orb) → each orb in ring clockwise starting from 12 o'clock → Scrub Control handle → Scrub Control "Now" button → Bottom Bar add-zone → Bottom Bar share → status pill.
2. WHEN a Zone Orb has keyboard focus, Enter or Space SHALL activate the Orb Detail View; Delete or Backspace SHALL prompt removal (suppressed for the Local Orb).
3. WHEN the Scene Canvas has focus and no orb is selected, Left/Right arrows SHALL move focus between adjacent orbs on the ring (counter-clockwise / clockwise respectively).
4. EVERY interactive element SHALL have a visible focus ring meeting WCAG AA 3:1 contrast against the sky background at the current Displayed Time.
5. THE System SHALL provide an ARIA live region announcing significant state changes: scrub offset commits, zone additions/removals, anchor changes, format changes.
6. EVERY text element SHALL meet WCAG AA 4.5:1 contrast; the Orb Detail View and Scrub readout SHALL meet WCAG AAA 7:1 contrast given their informational importance.
7. THE System SHALL honor `prefers-reduced-motion: reduce` by: disabling Globe auto-rotation, disabling orb drift, replacing all enter/exit animations with opacity-only 100ms transitions, disabling ambient particle motion, and disabling the Globe tint crossfade.

### Requirement 14 — Mobile behavior

**User story:** As a mobile user, I want the core Horizon experience to work on my phone, even if some advanced desktop features are simplified.

#### Acceptance criteria

1. AT viewport widths below 768px, THE Scene Canvas SHALL render in a locked isometric view with no hold-to-orbit camera control.
2. AT viewport widths below 768px, THE Globe diameter SHALL be 28% of viewport width and the Horizon Ring radius SHALL be 40% of viewport width, with the Scrub Control collapsing to a simplified horizontal bar taking the full viewport width below the Scene Canvas.
3. AT viewport widths below 768px, tap-and-hold on an orb SHALL activate the Orb Detail View (replacing click on desktop); a short tap SHALL flash the orb's time readout larger for 1.5 seconds without triggering full detail view.
4. THE Command Palette, Date Jump, Settings, and Orb Detail View overlays SHALL each render full-screen on mobile, not as centered modals.
5. THE System SHALL NOT render ambient particles on mobile viewports to preserve battery and performance.
6. Mobile orientation change SHALL re-fit the scene with a 250ms animation, preserving all orb positions.

### Requirement 15 — API compatibility

**User story:** As the developer, I want to reuse my existing `/api/timezones` endpoint without changes.

#### Acceptance criteria

1. THE Command Palette SHALL consume the existing `/api/timezones` endpoint with no contract changes.
2. THE System SHALL canonicalize legacy IANA aliases on read (e.g. `Asia/Calcutta` → `Asia/Kolkata`) at the client level, so stored zone IANA names are always canonical.
3. THE System SHALL cache `/api/timezones` results in memory for the session and additionally cache the popular-zones response in localStorage with a 24-hour TTL to reduce API load.
4. WHEN `/api/timezones` returns an error or times out, THE Command Palette SHALL fall back to a bundled static list of the 50 most common IANA zones and display a subtle "offline search" indicator.

### Requirement 16 — Current bug fixes included in scope

**User story:** As a product owner, I want the redesign to fix the known bugs from the current app.

#### Acceptance criteria

1. THE System SHALL compute UTC offsets using DST-aware logic for the Displayed Time, not merely the current real time (fixes the historical incorrect-offset bug).
2. THE System SHALL canonicalize `Asia/Calcutta` and any other deprecated IANA aliases to their canonical names on both display and storage (fixes the `Calcutta` naming bug).
3. THE System SHALL produce ISO 8601 output that includes the correct offset suffix and is round-trippable through `Date.parse` (fixes the broken ISO output bug).
4. THE System SHALL compute Unix timestamps as zone-independent integers — the Unix readout SHALL be identical across all orbs for the same Displayed Time (fixes the per-card Unix variance bug).
5. THE System SHALL unify the brand identity under a single accent color system applied consistently across all sky states (addresses the split dark-teal / warm-orange brand identity).
6. THE System SHALL render any time-of-day digit hierarchy consistent with seconds-are-secondary: the hour digits SHALL have the highest emphasis, minutes medium, seconds lowest (fixes the reversed digit hierarchy).

---

## 7. Non-functional requirements

### 7.1 Performance

- First Contentful Paint under 1.5s on a 3G-throttled connection for the landing scene.
- Scene Canvas target 60 fps on desktop, 55 fps floor on mid-tier integrated graphics.
- JavaScript bundle (excluding Three.js) under 180 KB gzipped.
- Three.js usage restricted to modules actually needed; no full three.js bundle import.

### 7.2 Browser support

- Evergreen Chrome, Firefox, Safari, Edge (latest two versions).
- Mobile Safari 15+, Chrome for Android latest.
- No IE11 support.

### 7.3 Privacy

- No geolocation requests (weather is out of scope; no location is needed for timezone detection, which uses `Intl` only).
- No third-party analytics baked into the core; any analytics are opt-in via setting.
- localStorage is the only persistence surface; no server-side user state.

### 7.4 Internationalization

- The UI copy is English-only for v1 (matching current app).
- City labels from `/api/timezones` are passed through as-is and support Unicode.
- The display format setting supports Unicode digit contexts correctly (no forced ASCII digit conversion).

### 7.5 Telemetry (if enabled)

- Count of orbs added / removed.
- Count of Date Jumps invoked.
- Count of Share invocations.
- Never transmit city labels or IANA names (privacy: reveals user location patterns).

---

## 8. Data model

### 8.1 Orb

```
Orb {
  id: string              // UUID
  ianaName: string         // canonical, e.g. "Asia/Kolkata"
  label: string            // user-editable, default = city name
  isLocal: boolean         // true only for the Local Orb
  createdAt: number        // Unix ms
  displayOrder: number     // tiebreaker for identical ring angles
}
```

### 8.2 Settings

```
Settings {
  displayFormat: "24h" | "12h" | "iso" | "unix"
  orbDrift: boolean                     // default true
  rememberScrubPosition: boolean         // default false
  reducedMotionOverride: "auto" | "on" | "off"   // "auto" respects OS
  anchorOrbId: string | null             // null = Local Orb
  cameraAngle: { azimuth: number, elevation: number }  // last held
  coachMarkDismissed: boolean
  recentSearches: string[]               // max 5
  lastScrubOffset: number                // minutes, only persisted if rememberScrubPosition
  lastScrubTimestamp: number             // Unix ms, for expiry check
}
```

### 8.3 Session (in-memory only)

```
Session {
  scrubOffset: number                    // minutes, signed
  expandedOrbId: string | null
  scrubbingInProgress: boolean
  cameraIsOrbiting: boolean
  commandPaletteOpen: boolean
  dateJumpOpen: boolean
  settingsOpen: boolean
}
```

---

## 9. Component map

The table below maps each new Horizon component to the existing component it replaces or extends.

| Horizon Component       | Responsibility                                  | Replaces / Derives From                                        |
|------------------------|-------------------------------------------------|----------------------------------------------------------------|
| `HorizonScene`           | Top-level Three.js scene wrapper                 | Replaces `Main.tsx` and `HeroSection.tsx` as primary surface  |
| `Globe`                  | Rotating earth with terminator                   | Replaces `FluidSkyBackground` as central visual element        |
| `HorizonRing`            | Ring guide + cluster-separation logic            | New                                                            |
| `ZoneOrb`                | Single orb instance, reads scrub context         | Replaces `TimezoneCard.tsx` and `SkyCard.tsx`                  |
| `LocalOrb`               | Special-case ZoneOrb for local timezone          | Subsumes `HeroClock` time display                              |
| `ScrubControl`           | ±24h scrubber + Now button                       | New; subsumes `TimeWas` page's timestamp picker entry          |
| `DateJumpDialog`         | Full date/time/Unix input with preview           | Replaces `TimeWas` page's form entirely                        |
| `OrbDetailView`          | Expanded orb with metadata and actions           | Replaces `TimestampModal.tsx`                                  |
| `CommandPalette`         | Add-zone keyboard flow                           | Replaces `TimezoneSearch.tsx`                                  |
| `BottomBar`              | Add-zone button, share, status pill              | New; replaces parts of current navbar                          |
| `TopBar`                 | Brand, date, settings entry                      | Replaces existing `Navbar.tsx`                                 |
| `SettingsPanel`          | Format, drift, motion, about, reset              | Consolidates scattered current settings                        |
| `skyPaletteEngine`       | 6-state palette + 24-state palette APIs          | Extends existing `skyThemeEngine.ts`                           |
| `scrubStore`             | Redux slice for scrub offset + subscribers       | New slice in existing store                                    |
| `orbStore`               | Redux slice for orb list CRUD                    | Replaces existing `timezones` slice (migration path required)  |

---

## 10. Migration from the current app

### 10.1 localStorage migration

On first load post-deploy:

1. Detect presence of the legacy `timezones` key.
2. Parse it; map each entry to the new `Orb` shape, canonicalizing any deprecated IANA aliases in the process.
3. Write the migrated list under the new `horizon.orbs` key.
4. Keep the legacy key untouched for two weeks as a rollback safety net; then delete on a later migration.
5. Legacy `dateFormat` maps to new `displayFormat`.
6. Legacy `miniNav` and `timewasData` are discarded (time-was is no longer a distinct page).

### 10.2 URL compatibility

- `/` renders the primary view (unchanged path).
- `/TimeWas` 301-redirects to `/?jump=open`, where the `jump=open` query triggers the Date Jump dialog immediately on mount.
- Share links of the form `/?offset=120&zones=ist,utc,jst` are new additions.

### 10.3 Deprecated features (explicitly cut)

- Weather overlays and the Open-Meteo integration.
- The Comparison Grid at the bottom of the current page.
- The Golden Window feature (can return in Phase 2 if desired, but not in v1).
- The three-position Auto/Day/Night theme toggle (Horizon's sky state is purely time-driven with no manual override; reduced-motion settings handle the accessibility path).

---

## 11. Phasing

### 11.1 Phase 1 (v1 launch)

Every requirement in Section 6.

### 11.2 Phase 2 (post-launch candidates)

- Meeting-finder overlay (pick 2+ orbs, highlights the overlap of their working hours on the ring).
- Calendar integration (import working-hours ranges per orb).
- Weather particles restored, if demand exists, as tiny decorations on orb surfaces.
- Multi-user shared rings ("Team Horizon").
- Export ring as image.
- Ambient sound (very quiet atmospheric loop that shifts with globe terminator).

### 11.3 Phase 3 (speculative)

- Native app builds via Tauri.
- WebGPU renderer path for higher fidelity globe.
- Historical calendar integration (jump to "last full moon", "next solstice", etc.).

---

## 12. Open questions

These are intentional unknowns for follow-up discussion, not blockers for writing the UI/UX spec.

1. Should the Local Orb display the same time format as other orbs, or always show seconds even when other orbs show HH:MM only? (Recommendation: same format everywhere for consistency.)
2. When the user scrubs and an orb crosses midnight into a different date, should the orb's date readout be visible in the ring view, or only in the Orb Detail View? (Recommendation: only in Detail View, to keep ring labels compact.)
3. Should the 50% hover-proximity cluster-separation apply only to pointer hover, or also to keyboard focus? (Recommendation: both.)
4. Is there value in a "compare mode" where exactly two orbs are pulled out of the ring and laid out side-by-side? (Recommendation: defer to Phase 2; Orb Detail View + Set as Anchor already covers the 90% case.)
5. Ring-angle-by-time-of-day creates an interesting edge case: an orb at 23:59 and another at 00:01 are spatially adjacent (both near the 12 o'clock position) but on different calendar days. Do we signal that difference? (Recommendation: a subtle "tomorrow" / "yesterday" pip on the orb if its date differs from the Local Orb's date; spec'd in UI document.)

---

## 13. Appendices

### 13.1 Preserved app features — mapping

| Current feature                                         | Horizon equivalent                                                  |
|---------------------------------------------------------|---------------------------------------------------------------------|
| Live local hero clock                                    | Local Orb (large) + optional Top Bar readout                        |
| Timezone search (city, IANA, abbreviation, UTC offset)   | Command Palette (Req 8)                                             |
| Quick-add chips (IST, UTC, EST, PST, JST)               | Command Palette "Popular" section on empty input                    |
| Popular suggestions and recent searches on focus         | Command Palette empty state                                         |
| Pin/unpin cards with localStorage                        | Orb list persistence (Req 11)                                       |
| Copy time, rename label, remove card                     | Orb Detail View actions (Req 7)                                     |
| Accurate UTC offsets                                     | Req 16.1                                                            |
| Relative offset from local                               | Orb Detail View metadata                                            |
| Timezone details modal                                   | Orb Detail View (Req 7)                                             |
| Configurable display format                              | Req 10                                                              |
| Time Was conversion                                      | Date Jump dialog (Req 6)                                            |
| Alto's-Adventure sky theming                             | Sky palettes applied to Globe tint, orb fills, and Detail View      |

### 13.2 Cut features — rationale

| Cut feature                     | Rationale                                                                           |
|---------------------------------|-------------------------------------------------------------------------------------|
| Weather overlays                 | Scope, performance, and focus. Time is the hero.                                    |
| Time Now / Time Was page split  | Collapsed into a single scrub + date-jump model; no separate page.                  |
| Comparison Grid                  | Ring itself does this job better, with less visual noise.                           |
| Golden Window feature            | Orthogonal to the redesign; worth keeping in backlog for Phase 2.                  |
| Timezone cards / strips          | Orbs subsume their role; see Component Map.                                         |
| Manual Day/Night/Auto toggle    | Sky state is always time-driven; no manual override needed.                         |