# Horizon — UI/UX Design Specification

**Project:** And The Time Is — Horizon redesign
**Status:** Specification (Pre-implementation)
**Companion:** `horizon-prd.md` (product & functional requirements)
**Audience:** Whoever implements this, whether yourself, another dev, or another LLM

---

## 1. Purpose

This document specifies the visual and interaction design of Horizon: its layout, color system, typography, motion, micro-interactions, 3D scene composition, iconography, and responsive behavior. It does not specify functional requirements — those live in the PRD. Where a choice is open to implementer discretion, that is stated explicitly; every other number in this document is intentional.

The overarching design principle: **stillness and slow motion**. Horizon should feel like a quiet, contemplative instrument. Nothing jitters. Nothing flashes. Everything that moves, moves gently. The user's attention is earned by clarity, not grabbed by animation.

---

## 2. Visual identity

### 2.1 Design language in one paragraph

Soft, matte, paper-like 3D. Continents are flat silhouettes, not textured terrain. Orbs are frosted glass marbles. The horizon ring is a breath of light, not a hard line. Typography is a single ultra-light display face for time readouts and a clean humanist sans for labels. Every color on screen is pulled live from the sky at the current Displayed Time — so the background, the globe, and the orb fills all share a family palette that slowly evolves over 24 hours. No hard blacks, no hard whites anywhere. Everything is a soft version of itself.

### 2.2 Brand anchor

- **App name in-product:** Horizon (under the hood; the filename URL stays `timeis.astrx.dev`).
- **Logomark:** a small circle bisected by a single horizontal line — half lit in the active sky's noon color, half in the active sky's midnight color. Lives in the Top Bar.
- **Wordmark typography:** the H in Horizon gets a small extending top-bar, echoing the logomark's horizon line.

---

## 3. Color system

### 3.1 The 6-state sky palette (orb fills)

These six canonical states are derived from your existing 24-state palette by selecting the hour that best represents each phase and locking those as the orb fill states. All colors are expressed as pairs: `zenith` (top of sphere when rendered as gradient) and `horizon` (bottom).

| State     | Representative Hour | Zenith   | Horizon  | Text On Fill | Celestial Icon |
|-----------|---------------------|----------|----------|--------------|----------------|
| Midnight  | 02:00               | `#0b1033`| `#1a1f4a`| `#e8eaff`    | Moon (full)    |
| Dawn      | 06:00               | `#4a3a6e`| `#e8a38a`| `#fff8f0`    | Sun (rising)   |
| Day       | 10:00               | `#6fb8e8`| `#b8d8ee`| `#1a2b3f`    | Sun            |
| Noon      | 12:00               | `#4a9fdb`| `#e8e0c8`| `#1a2b3f`    | Sun (bright)   |
| Dusk      | 19:00               | `#3d2a5a`| `#e8856e`| `#fff4e8`    | Sun (setting)  |
| Night     | 21:00               | `#1a1a3f`| `#3a2f5a`| `#e8eaff`    | Moon           |

The `Day` and `Noon` states are visually close siblings — Noon is slightly more saturated and slightly warmer, to mark the middle of the day as the visual peak.

### 3.2 The 24-state palette (globe + detail view)

Reused directly from your existing `skyThemeEngine.ts`. No changes required. The globe uses the full 24-state palette for its lit-hemisphere tint; the Orb Detail View uses it for the expanded orb's fill.

### 3.3 Neutrals (UI chrome)

Horizon has no fixed dark/light mode. All chrome is semi-transparent and floats over the active sky background. The following tokens are used:

| Token            | Value                                      | Usage                                    |
|------------------|--------------------------------------------|------------------------------------------|
| `--chrome-glass` | `rgba(12, 14, 28, 0.35)` + backdrop-blur   | Top Bar, Bottom Bar, overlay panels       |
| `--chrome-border`| `rgba(255, 255, 255, 0.10)`                 | 1px hairlines on all glass surfaces       |
| `--chrome-text-primary`   | `rgba(255, 255, 255, 0.92)`       | Primary text on chrome                    |
| `--chrome-text-secondary` | `rgba(255, 255, 255, 0.62)`       | Labels, meta                              |
| `--chrome-text-muted`     | `rgba(255, 255, 255, 0.38)`       | Tertiary (timestamps, hints)              |
| `--accent`       | `#f4c572` (warm amber)                      | Focus rings, selected state, emphasis     |
| `--accent-soft`  | `rgba(244, 197, 114, 0.18)`                 | Accent tints, hover states                |

The accent color is intentionally warm-amber and held fixed across all sky states, unifying the brand identity (addresses the current split-brand concern). On dark sky states it reads as a soft gold; on bright sky states it reads as a deeper honey. It never clashes.

The chrome stays legible over every sky state because it is a glass panel with blur — it always pulls a darker version of the sky through itself. Text contrast is guaranteed by the blur density, not by swapping colors.

### 3.4 State colors

| Token              | Value                          | Usage                                     |
|--------------------|--------------------------------|-------------------------------------------|
| `--focus-ring`     | `var(--accent)` 3px, offset 2px| Keyboard focus on all interactive chrome   |
| `--danger-soft`    | `rgba(230, 120, 120, 0.18)`    | Remove-zone confirm state                  |
| `--danger-text`    | `#f2a8a8`                       | Destructive action labels                  |
| `--success-soft`   | `rgba(120, 210, 160, 0.18)`    | Copy-confirmed toast, share success        |

---

## 4. Typography

### 4.1 Type stack

| Role                | Family                                      | Fallback stack                             |
|---------------------|---------------------------------------------|--------------------------------------------|
| Display (time)      | Inter (weight 100, tabular-nums feature)    | `ui-sans-serif, system-ui, -apple-system` |
| UI (labels, chrome) | Inter (weight 400/500)                      | Same                                       |
| Monospace (ISO, Unix, metadata values) | JetBrains Mono (weight 400)   | `ui-monospace, "SF Mono", Menlo, monospace`|

A single font family (Inter) powers both display and UI to keep bundle weight down. Tabular numerals are enabled everywhere a time is shown so digits don't jitter.

### 4.2 Type scale

| Token       | Size (px) | Line-height | Weight | Usage                                              |
|-------------|-----------|-------------|--------|----------------------------------------------------|
| `text-xs`   | 11        | 1.4          | 500    | Top Bar meta, UTC-offset chips                     |
| `text-sm`   | 13        | 1.45         | 400    | Orb labels on ring, chrome meta                    |
| `text-base` | 15        | 1.5          | 400    | Body copy in overlays                              |
| `text-md`   | 18        | 1.4          | 500    | Orb time readout on ring                           |
| `text-lg`   | 22        | 1.35         | 400    | Section headings in overlays                       |
| `text-xl`   | 32        | 1.2          | 300    | Orb Detail View city name                          |
| `display-1` | 56        | 1.1          | 100    | Local Orb time (compact state)                     |
| `display-2` | 88        | 1.05         | 100    | Orb Detail View time                               |
| `display-3` | 120       | 1.0          | 100    | Local Orb time (expanded state, if large viewport) |

Weight 100 on display gives the airy, glowing quality the current app reaches for but stops short of achieving. Mobile scales: `display-1` collapses to 40px, `display-2` to 64px.

### 4.3 Text treatments

- Time readouts: always tabular-nums, always medium tracking (`letter-spacing: 0.02em`), colon separators at 40% opacity.
- Labels on dark sky: `--chrome-text-primary`.
- Labels on bright sky (Day/Noon orb fills): switch to `#1a2b3f` automatically via the orb's `textOnFill` color token.
- Date / metadata in overlays: small-caps uppercase, letter-spacing `0.08em`, color `--chrome-text-secondary`.

---

## 5. Layout (desktop, ≥ 1024px wide)

### 5.1 The single viewport

```
┌───────────────────────────────────────────────────────────────┐
│ [◐] Horizon             Tue 24 Apr · Bengaluru        [⚙]     │ ← Top Bar (56px tall)
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│                        ·  Tokyo  ·                              │
│                 12:00            04:30                          │
│         ·  NY                          London  ·                │
│      11:30                                                      │
│                                                                 │
│                     ┌─────────┐                                 │
│                     │         │                                 │
│                     │  GLOBE  │      ← scene canvas             │
│                     │         │                                 │
│                     └─────────┘                                 │
│                                                                 │
│       ·  LA                           Sydney  ·                 │
│      8:30                              13:30                    │
│              ·  You  ·        ·  Dubai  ·                       │
│              08:30            07:00                             │
│                                                                 │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  ◀   ─── ─── ─── ─── ─── ●  NOW  ── ── ── ── ── ── ─── ─── ▶  │ ← Scrub Control (88px tall)
│        -24h        -12h      ·         +12h        +24h          │
├───────────────────────────────────────────────────────────────┤
│  [+ Add zone]         Live · Tue 24 Apr, 08:30      [⤴ Share]  │ ← Bottom Bar (56px tall)
└───────────────────────────────────────────────────────────────┘
```

### 5.2 Region specifications

**Top Bar — 56px tall, full width, glass chrome.**
- Left cluster: logomark (16px) + "Horizon" wordmark in `text-sm` weight 500.
- Center cluster: live date in `text-sm` weight 400, followed by a middle-dot separator and the local city name (inferred from the Local Orb's label). This text is `--chrome-text-secondary`.
- Right cluster: settings cog icon (20px), keyboard-accessible, opens Settings Panel.
- Padding: 16px horizontal, 0 vertical (centered vertically by flex).
- Backdrop: `--chrome-glass` with `backdrop-filter: blur(20px) saturate(140%)`.
- Border bottom: 1px `--chrome-border`.

**Scene Canvas — occupies all space between Top Bar, Scrub Control, and Bottom Bar, edge-to-edge horizontally.**
- Contains the Three.js-rendered globe, ring, orbs, and ambient background gradient (which itself is driven by the current Displayed Time's sky theme).
- The background gradient is the full-bleed layer; the chrome bars float over it.
- No padding; WebGL canvas absolute-positioned.

**Scrub Control — 88px tall, full width, glass chrome with reduced blur.**
- See Section 7.

**Bottom Bar — 56px tall, full width, glass chrome.**
- Left cluster: "+ Add zone" button (primary ghost style, accent text, 36px tall, 16px horizontal padding, 18px border-radius).
- Center cluster: Status Pill (glass, 28px tall, 18px border-radius, 12px horizontal padding) showing either "Live" with a pulsing dot, or the Scrub Offset ("+4h 15m ahead") with a neutral dot. Includes the Displayed Date in small text after a middle-dot separator.
- Right cluster: Share button (icon + label, same styling as Add zone but secondary).

### 5.3 Viewport math

At a 1440×900 reference viewport:

- Top Bar + Scrub Control + Bottom Bar = 200px total chrome height.
- Scene Canvas height = 900 − 200 = 700px.
- Scene Canvas width = 1440px.
- Smaller dimension = 700; Globe diameter = 700 × 0.18 = 126px; Ring radius = 700 × 0.34 = 238px.
- Orb default diameter = 56px; orb outer bound = ring radius + orb radius = 238 + 28 = 266px.
- Scene has 84px of horizontal breathing room on each side and 62px vertically.

---

## 6. The 3D scene

### 6.1 Camera and projection

- Perspective camera, FOV 35° (tight, reduces distortion of the ring shape).
- Default position: azimuth 0°, elevation 12° (slight isometric tilt — enough to see depth, not so much that the ring becomes an ellipse).
- Near plane: 0.1; far plane: 100 units.
- Scene scale: 1 unit = ~100 px at default camera distance. Globe radius = 0.63 units; ring radius = 1.19 units.

### 6.2 Lighting

- Single directional "sun" light, positioned relative to the Displayed Time: at displayed local noon the light sits at elevation 80°, at midnight it sits at elevation −80° (below the scene, producing only rim glow from the ambient).
- Ambient light at 0.35 intensity, tinted to the current sky's horizon color.
- A subtle rim light on the far side of the globe at 0.15 intensity to define silhouette in dark hours.
- **No shadows.** Shadows cost performance and don't help readability.

### 6.3 Globe

- Geometry: icosahedron subdivision level 3 (~1280 triangles) — deliberately low to show its facets as design, not a bug.
- Material: `MeshPhongMaterial` with no specular highlights (matte finish). Base color interpolated between the current `Noon` sky zenith (for lit hemisphere) and `Midnight` sky zenith (for dark hemisphere).
- Continent silhouettes: rendered as a single additive overlay texture at 512×256, solid dark shape against transparency, at 70% opacity on the lit hemisphere and 15% on the dark hemisphere. No borders, no labels.
- Terminator: computed per-frame from Displayed Time, rendered as a soft gradient band across the sphere — 8° wide in world space, feathered on both sides. The band uses the `Dusk` horizon color on the sun-going-away side and `Dawn` horizon color on the sun-arriving side. This single detail sells the whole scene.
- Atmospheric rim: a second slightly larger sphere (radius × 1.04) rendered with additive blending and a backside material in the lit hemisphere's zenith color at 35% opacity. Produces a soft halo.
- Rotation: one full rotation every 24 real seconds when Scrub Offset is 0. When Scrub Offset changes, the globe holds position corresponding to the Displayed Time. Scrubbing from Now +0 to Now +6h spins the globe ~90° forward.

### 6.4 Horizon Ring

- Rendered as a `TubeGeometry` with a Catmull-Rom curve along a circle of ring radius 1.19, tube radius 0.004 units (visually 1px on screen).
- Material: emissive with color pulled from the current sky's horizon color, opacity at rest `0.08`, opacity on scrub or hover-near `0.25`.
- Sits in the equatorial plane of the globe.
- Four cardinal tick points (12, 3, 6, 9 o'clock positions) render as slightly larger 3px segments at `0.18` opacity — gentle hour anchors, no labels.

### 6.5 Zone Orbs

- Geometry: sphere, radius 0.22 units. Rendered as a `MeshPhongMaterial` with a gradient texture generated per-orb from the orb's current 6-state palette.
- The gradient texture is a 64×64 vertical linear gradient from zenith to horizon color — regenerated only when the orb's state transitions between palette states, cached otherwise.
- A thin glass shell: a second sphere at radius × 1.02 with `MeshPhysicalMaterial`, transmission `0.3`, roughness `0.4`, opacity `0.9`. Gives the frosted-marble look.
- The orb's local time and label are rendered as HTML DOM elements absolutely positioned over the canvas at the orb's projected screen position, not as 3D text. This keeps text crisp and makes it easy to handle font scaling, accessibility, and hit-testing.
- Celestial icon inside the orb: a small sun or moon glyph at 40% of orb diameter, rendered as a sprite at 0.8 opacity, positioned within the orb based on its current local hour (sun rises from the east of the orb at dawn, peaks at center-top at noon, sets to the west at dusk; moon behaves inversely).
- **Local Orb distinction:** the Local Orb carries a persistent 2px accent ring at `--accent` around its body, and its HTML label includes a small "YOU" pill (10px, uppercase, accent text, `--accent-soft` background, 12px border-radius).

### 6.6 Label layout

Each orb gets an HTML label block positioned via projection from its 3D position to screen coordinates, re-computed every frame.

Label block layout (on the outside of the ring, radial-outward from the orb):

```
┌────────────────┐
│  Tokyo         │  ← city name (text-sm 500 on dark sky fills, text-sm 600 on light fills)
│  12:00:34      │  ← time (text-md, tabular-nums, 400)
│  +4h 30m       │  ← relative offset from Anchor (text-xs 400 muted; hidden on Local Orb)
└────────────────┘
```

The label block anchors to whichever side of the orb faces away from the globe — so for an orb at 3 o'clock (6 AM), the label sits to the right of the orb; at 9 o'clock (6 PM), it sits to the left; at 12 o'clock (midnight), it sits above; at 6 o'clock (noon), it sits below.

If an orb clusters with neighbors (see 6.7), labels stack radially outward so they don't overlap — the algorithm gives each label in a cluster a unique radial slot 32px further from the ring than the previous.

### 6.7 Cluster-separation

When multiple orbs occupy nearby Ring Angles:

1. Identify all orbs within 8° of each other; form clusters.
2. For each cluster, compute the mean angle.
3. Distribute the cluster's orbs evenly along a ±8° tangent arc centered on the mean, in their original sort order (by creation time for stable behavior).
4. When the user's cursor is within 48px of a cluster (computed in screen space), expand the cluster to a ±16° spread and lift each orb outward from the ring by 0.08 units. This animates over 200ms with our standard ease.
5. On cursor leave, the cluster collapses back over 300ms.

### 6.8 Density scaling

As orbs multiply beyond 15:

- Orb radius decreases linearly from 0.22 units (at 15 orbs) to 0.09 units (at 40 orbs); below 15, always 0.22.
- Label font size decreases from `text-md` to `text-sm` at 20 orbs.
- At 30+ orbs, label "relative offset" line is hidden by default and only shown on hover.

### 6.9 Camera orbit (hold-to-orbit)

- Desktop only. Disabled on touch viewports.
- Trigger: pointer-down on an empty area of the Scene Canvas (not an orb).
- While held, mouse deltas rotate the camera around the scene's center: horizontal drag → azimuth (±180° range), vertical drag → elevation (0° to 60°, clamped to not flip upside down).
- Release: camera eases back to default position (azimuth 0°, elevation 12°) over 600ms with a soft cubic ease-out. No snap.
- Rotation speed: 0.005 radians per pixel.
- While orbiting, the Horizon Ring opacity rises to 0.25 so the user sees the ring's 3D nature.
- Double-click empty space: resets camera immediately (skip the ease).

---

## 7. The Scrub Control

### 7.1 Anatomy

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                        ┌────────────────┐                            │
│                        │   08:30:42     │  ← Displayed Time readout  │
│                        │   Tue 24 Apr   │                            │
│                        └────────────────┘                            │
│                                                                      │
│  ◀──┬──┬──┬──┬──┬──┬──●──┬──┬──┬──┬──┬──┬──▶  [⏵ Now] [🗓 Jump]   │
│    -18h        -6h       NOW      +6h      +18h                      │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 Track

- Full width minus 32px padding on each side, 4px tall, 2px border-radius.
- Background: `--chrome-border` at 10% opacity.
- Filled portion (from the "Now" midpoint outward to the handle): accent gradient `linear-gradient(90deg, transparent, var(--accent) 100%)` when handle is ahead of Now; flipped direction when behind.
- Tick marks at every hour (25 ticks across -24h to +24h), 1px wide, 8px tall, color `--chrome-text-muted`.
- Major ticks at ±6h, ±12h, ±18h, ±24h: 2px wide, 12px tall, plus a label in `text-xs` muted.
- The "Now" tick at center: accent color, 2px wide, 16px tall, no label (labeled separately above).

### 7.3 Handle

- 20px circle, `--accent` fill, 2px `--chrome-text-primary` border, soft drop-shadow `0 2px 8px rgba(0,0,0,0.3)`.
- On hover: scales to 1.15, shadow intensifies.
- On drag: scales to 1.3, a second outer ring pulses softly at the handle center.
- The Displayed Time readout floats 12px above the handle, following its horizontal position. The readout card is glass chrome (24px border-radius, 8px padding horizontal, 4px vertical, `text-sm` tabular-nums).

### 7.4 Interaction

- **Click on track:** handle moves to clicked position, animated over 200ms.
- **Drag handle:** handle follows pointer, Displayed Time updates every frame. Scene updates in sync.
- **Release:** if within 3px of a 15-min tick, handle snaps to it over 100ms; otherwise holds exact position.
- **Mouse wheel over track:** scrolls the Scrub Offset by 15 minutes per detent.
- **Keyboard (when handle focused):** see PRD Requirement 5.7.

### 7.5 The "Now" button

- Visible only when Scrub Offset ≠ 0.
- Ghost button, 32px tall, accent text, `--accent-soft` background on hover.
- Label: "▶ Now".
- Click: handle animates back to center over 400ms with easing; Scene updates in sync.

### 7.6 The "Jump" button

- Always visible.
- Small icon button, 32px square, secondary style.
- Icon: calendar-with-arrow glyph.
- Click: opens Date Jump dialog.

### 7.7 Far-range states

When the Scrub Offset is set via Date Jump to a value outside ±24h:

- The scrub track remains visible but gains a visual overflow treatment: the left or right end fades into a gradient-masked "…" indicator.
- The Displayed Time readout above the handle is promoted to a larger `text-lg` size and always shows the full date + time.
- The handle itself pins to the nearest edge of the visible range, with a small chevron pointing outward.
- A tappable label appears next to the handle: "Return to ±24h window" which shrinks the offset back into the visible range.

---

## 8. Orb Detail View

### 8.1 Activation

- Click on a Zone Orb (or tap-hold on mobile, or Enter on keyboard focus).
- Animation over 500ms with our standard ease:
  - The clicked orb scales from its ring size (0.22 units) to center size (0.88 units, a 4× scale).
  - The orb translates from its Ring Angle position to the scene's geometric center (same screen position as the globe).
  - Simultaneously, the Horizon Ring fades to 15% opacity, other orbs fade to 15% opacity, the globe fades to 40% opacity and its auto-rotation pauses.
  - The orb's HTML label block dissolves and is replaced by a new Detail View HTML panel that fades in over 300ms (starting at 200ms into the orb's movement).

### 8.2 Layout

The detail panel is an overlay HTML container centered in the viewport, 480px wide on desktop, full-width on mobile. It is positioned just below the expanded orb, with the orb taking the top portion of the combined visual block.

```
                  ┌────────────────────┐
                  │                    │
                  │      (big orb,     │  ← the expanded orb, sky-filled
                  │   fills 24-state   │
                  │      palette)      │
                  │                    │
                  └────────────────────┘

        ┌──────────────────────────────────────┐
        │  Tokyo                          ✎    │  ← city label + inline edit
        │  Japan · JST · UTC+9                 │  ← meta line, small caps
        │                                       │
        │       12:00:34                        │  ← display-2 time readout
        │       Tue 24 Apr, 2026                │
        │                                       │
        │  +4h 30m from Bengaluru (you)         │  ← relative offset chip
        │                                       │
        │  ┌──────────────────┬────────────────┐
        │  │ IANA zone        │ Asia/Tokyo     │
        │  │ DST in effect    │ No              │
        │  │ Sunrise          │ 04:51          │  ← if data available
        │  │ Sunset           │ 18:23           │
        │  └──────────────────┴────────────────┘
        │                                       │
        │  [📋 Copy time] [📋 Copy full]        │
        │  [⚓ Set as anchor] [🗑 Remove]        │
        └──────────────────────────────────────┘
```

### 8.3 Styling specifics

- Panel background: `--chrome-glass` with `backdrop-filter: blur(28px) saturate(140%)`.
- Panel border-radius: 20px.
- Panel border: 1px `--chrome-border`.
- Panel padding: 32px top, 24px sides, 24px bottom.
- City label: `text-xl` weight 400, `--chrome-text-primary`.
- Meta line: `text-xs` uppercase, letter-spacing 0.08em, `--chrome-text-secondary`.
- Time readout: `display-2`, tabular-nums, weight 100, text color derived from the orb's current sky state (same logic as on-ring orbs — switches to dark text on bright skies).
- Relative offset chip: glass, 28px tall, 12px border-radius, `text-sm`, muted text.
- Metadata table: two-column, row-striped with `rgba(255,255,255,0.04)` on alternating rows, `text-sm` values in monospace for IANA names and offsets.
- Action buttons: pill style, 36px tall, 14px horizontal padding, `text-sm` weight 500. Primary (Copy) in accent; secondary (Set as anchor, Remove) in ghost style. Remove uses `--danger-text` on hover.

### 8.4 Inline rename

- Click the pencil icon (or click directly on the city label): label transforms into an input field of the same size, pre-selected content.
- Enter: commits.
- Escape: cancels.
- Blur: commits.
- Max length 30 characters; input shows a small character counter that only appears at >25.

### 8.5 Set as Anchor interaction

- Click Set as Anchor: the button's icon transitions to a checked state, its label becomes "Anchor: this zone", and the action becomes a toggle.
- On next detail view opening of any other orb, its relative-offset chip reads relative to this anchor instead of the Local Orb.
- The Local Orb's label on the ring gains a small dashed circle around its YOU pill to indicate the anchor has been shifted away from it.
- To reset: set anchor on the Local Orb, or use "Reset Anchor" in Settings Panel.

### 8.6 Remove flow

- Click Remove: button expands into an inline confirm strip within the action area: "Remove Tokyo?" + [Cancel] [Yes, remove].
- If confirmed: the detail view dismisses via the standard exit animation, but the orb does not migrate back to its ring position — instead it fades out over 400ms as it moves toward the ring edge and disappears.
- For the Local Orb: the Remove button is disabled with tooltip "Your home zone can't be removed."

### 8.7 Dismiss

- Click the backdrop (anywhere outside the orb and panel): dismiss.
- Escape: dismiss.
- Close affordance: a small × in the top-right corner of the panel (28px, ghost style).
- Dismiss animation: reverse of entry — orb migrates back to its Ring Angle, scales down, panel fades out, ring + other orbs + globe restore full opacity.
- After dismiss, keyboard focus returns to the originating orb on the ring.

---

## 9. Overlays

All overlays share the chrome language of the rest of the app:

- Backdrop: `rgba(8, 10, 22, 0.55)` with `backdrop-filter: blur(12px)`.
- Panel: `--chrome-glass`, border-radius 20px, border 1px `--chrome-border`.
- Entry: backdrop fades in over 200ms; panel scales from 0.96 to 1.0 and fades in over 250ms with cubic ease-out.
- Exit: reverse, 150ms.

### 9.1 Command Palette (Add zone)

- Size: 560px wide, max-height 480px, centered vertically at 30% from top of viewport.
- Search input at top: 48px tall, 16px horizontal padding, `text-base`, placeholder `--chrome-text-muted`, no visible border, focus ring suppressed inside panel (panel border acts as implicit container).
- Results: scrollable list below the input.
- Each result row: 48px tall, 12px horizontal padding, 8px border-radius, hover `rgba(255,255,255,0.06)`, selected (keyboard nav) `--accent-soft` with a 3px accent left border.

Row layout:

```
┌──────────────────────────────────────────────────────────────┐
│ ● | Kolkata · India                        IST · UTC+5:30   │
│   | Asia/Kolkata                                              │
└──────────────────────────────────────────────────────────────┘
```

- Leading dot: small circle filled with the timezone's current sky palette zenith color (a "live swatch").
- Primary line: city · country, `text-base` weight 500.
- Secondary line: IANA name, `text-xs` monospace `--chrome-text-muted`.
- Trailing line: abbreviation + UTC offset, `text-sm` monospace right-aligned.

Empty state: "Recent" section (up to 5 rows) and "Popular" section (8 rows: IST, UTC, EST, PST, JST, CET, GMT, SGT).

Kbd hint at bottom of palette: `text-xs` muted, "↑↓ to navigate  ↵ to add  esc to close".

### 9.2 Date Jump dialog

- Size: 640px wide, max-height 640px (can scroll internally).
- Tabs at top: "Picker", "ISO 8601", "Unix".
- **Picker tab:**
  - Native-feeling date input + time input (12h or 24h based on format setting).
  - A sub-field: "Interpret in:" timezone selector, defaulting to Local Orb, pointing into the current orb list + "Any zone…" (opens Command Palette inline).
- **ISO 8601 tab:** a single monospace input, 48px tall. Live validation: green border when parseable, red border with inline error message when not.
- **Unix tab:** a single monospace integer input. Toggle: "seconds / milliseconds" inferred from magnitude with override.
- Below the input area: a live preview pane showing each pinned zone with its resulting time at the proposed jump.
- Footer: [Cancel] [Jump].

### 9.3 Settings Panel

- Slide-in from the right on desktop, full-screen on mobile.
- 360px wide, full viewport height, anchored to right edge.
- Sections:
  - **Display**: Format (segmented control: 24h / 12h / ISO / Unix).
  - **Motion**: Orb drift (toggle), Reduced motion (Auto / Always / Never), Globe auto-rotation (toggle — defaults on, disabled if reduced motion active).
  - **Persistence**: Remember scrub position (toggle), Reset anchor to local (button), Reset Horizon (destructive button with two-step confirm).
  - **About**: version, link to GitHub, link to PRD, short credits line.

Each section is a grouped card with `text-lg` weight 400 heading and 16px internal padding.

---

## 10. Motion and animation

### 10.1 Timing tokens

| Token          | Duration | Easing                                  | Usage                                |
|----------------|----------|------------------------------------------|--------------------------------------|
| `motion-xs`    | 100ms    | `ease-out`                              | Hover state changes, ticks           |
| `motion-sm`    | 200ms    | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Handle snaps, panel appear           |
| `motion-md`    | 300ms    | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Orb cluster separation, overlay enter|
| `motion-lg`    | 500ms    | `cubic-bezier(0.16, 1, 0.3, 1)`        | Orb Detail View expand/collapse      |
| `motion-xl`    | 900ms    | `cubic-bezier(0.16, 1, 0.3, 1)`        | Orb entry/exit (adding/removing zones)|
| `motion-ambient` | 24s    | `linear`                                 | Globe rotation (1 rev / 24 seconds at live time) |
| `motion-drift` | 86400s   | `linear`                                 | Orb drift around ring (1 rev per 24h wall time)   |

### 10.2 Key animations

- **Orb entry (new zone added):** starts at scene center, fades in from opacity 0 to 1, scales from 0.4 to 1.0, migrates to its Ring Angle. Duration 900ms `motion-xl`.
- **Orb exit (zone removed):** scales from 1.0 to 0.6, fades to 0, drifts slightly outward from the ring. Duration 700ms.
- **Scrub drag:** no discrete animation — real-time follow at drag event rate.
- **Scrub snap to tick:** 100ms `motion-xs`.
- **Scrub return to Now (via button):** 400ms `motion-md`.
- **Orb Detail View expand:** 500ms `motion-lg`.
- **Cluster hover expand:** 200ms `motion-sm`; collapse 300ms `motion-md`.
- **Overlay panel enter:** 250ms `motion-sm` scale + fade.
- **Globe hour-tint crossfade:** 200ms linear when Scrub Offset crosses an hour boundary (or during live scrub passing an hour).

### 10.3 Reduced motion

When `prefers-reduced-motion: reduce` is true (or the user overrides in Settings):

- Globe auto-rotation: **off**. Globe holds position corresponding to Displayed Time statically.
- Orb drift: **off**.
- Orb entry/exit: replaced with opacity-only 100ms fade.
- Orb Detail View expand: replaced with opacity-only 150ms fade; orb does not physically scale or migrate (a flat panel just appears centered).
- Cluster hover expand: **off** (clusters stay in their static positions; orbs in dense clusters become harder to distinguish but static).
- Scrub-handle snap animation: **off** (instant snap).
- Ambient particles (if any): **off**.

### 10.4 Micro-interactions

- **Status Pill "Live" dot pulse:** 2px radius, pulses between 100% and 40% opacity over 2s, infinite; paused during scrub.
- **Add-zone button:** on hover, the leading `+` icon rotates 90° over 200ms to become `×` — a playful hint that if already used it would close. (Cosmetic only.)
- **Copy-confirmation toast:** appears bottom-center, 44px tall, pill shape, `--success-soft` background, slides up 8px and fades in over 200ms, holds for 1800ms, fades out over 250ms.
- **Focus rings:** materialize with a 120ms fade, no scaling.

---

## 11. Empty state

First-time visitor, after Local Orb is created and suggested seeds are placed (per PRD 9.2):

```
                    (small globe)
                 ·            ·
          ·                         ·
     ·    (Local Orb with         (UTC)  ·
          YOU pill)
     ·                                    ·
          ·        (EST)       ·
                 ·            ·
                    (JST)

           ┌──────────────────────────────┐
           │  Welcome to Horizon.          │
           │  Drag the scrubber to see      │
           │  any moment in time.           │
           │  Click an orb for details.     │
           │                                │
           │  [Dismiss]                     │
           └──────────────────────────────┘
```

Coach-mark: floating card anchored to the Scrub Control, pointing at the handle. Dismissible. Shows once. Stored in `settings.coachMarkDismissed`.

---

## 12. Responsive behavior

### 12.1 Breakpoints

| Breakpoint | Behavior                                                  |
|------------|-----------------------------------------------------------|
| ≥ 1280px   | Full desktop as specified. Globe 18% of min dimension.     |
| 1024–1279  | Desktop layout preserved. Ring slightly tighter (33% radius instead of 34%). |
| 768–1023   | Tablet: Bottom Bar elements wrap slightly; Orb labels use `text-xs`. |
| 480–767    | Mobile portrait: see 12.2.                                |
| < 480      | Small mobile: see 12.2, further compressed.                |

### 12.2 Mobile layout

```
┌──────────────────────────┐
│ ◐ Horizon          ⚙    │  ← Top Bar (48px)
├──────────────────────────┤
│                           │
│                           │
│                           │
│     (smaller scene         │
│      w/ globe & ring)      │
│                           │
│                           │
│                           │
├──────────────────────────┤
│  -12   NOW   +12          │  ← simplified Scrub (64px)
│   ─────●─────              │
├──────────────────────────┤
│ [+ Add]     Live     [⤴]  │  ← Bottom Bar (52px)
└──────────────────────────┘
```

- Globe diameter = 28% of viewport width.
- Ring radius = 40% of viewport width.
- Scrub Control compresses to a single-row slider with no ticks labeled; only the "NOW" label and the handle's floating readout.
- Hold-to-orbit camera: **disabled** on touch.
- Tap an orb: flashes its time larger for 1500ms without activating Detail View.
- Tap-and-hold an orb (350ms): activates Detail View as a full-screen overlay.
- Command Palette, Date Jump, Settings, Orb Detail View: each renders full-screen.
- Orb labels: shown outside the ring as on desktop, but time readouts drop to `text-sm`.

### 12.3 Orientation change

- On orientation change, the scene smoothly re-fits over 300ms; orbs retain their Ring Angles; globe scale adjusts.

---

## 13. Iconography

All icons are custom-drawn SVG, 1.5px stroke width, rounded linecaps, 24×24 grid unless specified. Stroke color inherits from parent; no hard-coded fills.

| Icon            | Usage                                                 |
|-----------------|-------------------------------------------------------|
| logomark         | Top Bar — bisected circle (half filled, half open)    |
| settings-cog     | Top Bar right                                         |
| plus-circle      | Add Zone button, rotates to × on hover                 |
| share-up         | Share button                                          |
| clock-arrow      | Jump button                                           |
| play             | "Now" button                                          |
| pause-dot        | Live status pill (pulsing dot)                         |
| scrubbed-dot     | Scrubbed status pill (solid, non-pulsing)              |
| sun              | Orb celestial icon (day states)                        |
| moon             | Orb celestial icon (night states)                      |
| sun-rise         | Orb celestial icon (dawn state)                        |
| sun-set          | Orb celestial icon (dusk state)                        |
| anchor           | Set as Anchor button                                   |
| copy             | Copy time, Copy full                                   |
| trash            | Remove zone                                           |
| pencil           | Inline rename                                         |
| chevron-up/down  | Overlay navigation                                    |
| keyboard         | Keyboard-shortcut hints                                |
| you-pin          | YOU pill on Local Orb                                  |

---

## 14. Accessibility specifics

- Scene Canvas has `role="application"` with `aria-label="Horizon timezone globe"`.
- Each orb is a `<button role="button">` positioned over the canvas via projection; this enables native focus, click, and keyboard activation.
- Scrub Control handle uses `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (human-readable e.g. "4 hours and 30 minutes ahead of now").
- Orb Detail View is a `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the city heading.
- A visually hidden `<div role="status" aria-live="polite">` announces: "Scrub offset set to +4h 30m", "Tokyo added", "Tokyo removed", "Anchor set to Tokyo", "Format changed to 12-hour", etc.
- Focus ring: 3px `--accent`, 2px offset, always visible on keyboard focus; suppressed on pointer focus via `:focus-visible`.
- High-contrast mode (Windows): force chrome text tokens to pure white on pure `#000`, and the focus ring to 4px.

---

## 15. Asset manifest

### 15.1 3D assets

- `globe-continents.png` — 512×256 silhouette texture, transparent PNG, soft antialiasing. Custom-drawn from a simplified world outline (public-domain Natural Earth 1:110m land outlines simplified to 6% detail).
- `atmosphere-halo.png` — 256×256 radial gradient, transparent PNG.
- No 3D model files; all geometry is generated procedurally at runtime.

### 15.2 Textures (generated at runtime)

- Per-orb gradient texture (64×64) — cached, re-generated on palette-state transition only.
- Globe day/night tint textures (1×256) — regenerated on hour boundary crossings, cached.

### 15.3 Fonts

- Inter variable font (subset to Latin + extended Latin + tabular figures).
- JetBrains Mono (subset to Latin + numeric).
- Total font payload: target under 120 KB compressed.

### 15.4 Icons

- Single sprite SVG file containing all icons. Target under 8 KB.

---

## 16. Edge cases and states

- **Scene rendering while tab in background:** pause rendering entirely (request animation frame only when document is visible). All clocks still tick logically via a stored mismatch between real time and last render; on tab return, scene re-renders once to the correct state before resuming animation.
- **Zero orbs other than Local Orb:** possible if user has removed all seeds. Show a subtle hint orbiting near the "+ Add zone" button: an animated prompt arrow guiding the user.
- **Single orb (only Local Orb):** ring still renders; scrub control still works; the single orb drifts alone — intended feeling, not broken.
- **Orb whose IANA zone has been removed from tzdata at some future point:** fallback to UTC with a warning pip on the orb; Detail View shows "Unknown zone — treated as UTC" in red.
- **DST transition during scrub:** scrub offset is a count of real minutes, so it respects wall-clock changes automatically. Orbs whose zones cross a DST boundary as part of the scrub range show a small jump in their Ring Angle (instantaneous, not interpolated) at the transition boundary — this is correct and should not be smoothed.
- **Viewport too small (< 320px wide):** collapse scene canvas to a minimum 320×240 letterbox and show a "Your screen is very small — some features unavailable" notice above the Scrub Control.
- **User's system clock is wrong:** detect via `Intl.DateTimeFormat().resolvedOptions().timeZone` vs. IP-based timezone (if we ever add it — not in v1). For v1, we trust the system clock; document this.
- **Offline:** the app works (no network dependency for core time math). Command Palette falls back to bundled zone list per PRD 15.4.

---

## 17. Feature flags and incremental rollout

Recommended flags for safe rollout:

- `horizon.enabled` — master flag; when off, serves the current app.
- `horizon.dateJump` — when off, hides the Date Jump button but keeps the scrubber.
- `horizon.ambientParticles` — experimental particle layer on the scene (reserved for later).
- `horizon.sharing` — share button visibility.

Each flag reads from build-time env and can be toggled in Settings Panel for development.

---

## 18. Definition of visual done

A Horizon implementation is visually "done" when:

- Opening the app produces a single-viewport scene with globe, ring, and the user's Local Orb plus seeded zones.
- Scrubbing the time control visibly rotates all orbs around the ring and re-lights the globe.
- Clicking any orb smoothly expands it to the Detail View with full metadata and actions.
- Adding a new zone via Ctrl+K flies a new orb onto the ring at the correct Ring Angle.
- The app holds 55 fps on mid-tier hardware with twelve orbs.
- Every interactive element is reachable by keyboard and announced correctly by VoiceOver.
- All text meets WCAG AA contrast at every hour of the day.
- `prefers-reduced-motion` turns the scene into a still but fully functional display.
- On mobile, the scene renders at an appropriate scale and all overlays work.
- Every current-app feature in Appendix 13.1 of the PRD has a working Horizon equivalent.

---

## 19. Appendix — annotated layout diagrams

### 19.1 Scene coordinate system

```
           +Y (toward viewer-up)
             │
             │
   −X ───────┼─────── +X (east in world space → clockwise in ring)
             │
             │
           −Y (toward viewer-down)

Globe center: (0, 0, 0)
Ring: circle of radius 1.19 at Y=0
Ring Angle 0° (midnight):   ring position (0, 1.19, 0)  ← 12 o'clock on screen
Ring Angle 90° (06:00):     ring position (1.19, 0, 0)  ← 3 o'clock
Ring Angle 180° (noon):     ring position (0, −1.19, 0) ← 6 o'clock
Ring Angle 270° (18:00):    ring position (−1.19, 0, 0) ← 9 o'clock
Camera: (0, 0.25, 4.8), looking at (0, 0, 0), FOV 35°
```

### 19.2 Orb at Ring Angle θ

```
orb.position.x = ringRadius * sin(θ)
orb.position.y = ringRadius * cos(θ)
orb.position.z = 0

Where θ is Ring Angle in radians, measured clockwise from +Y.

Example: orb at local hour 09:30 (θ = 9.5/24 × 360° = 142.5°)
  x = 1.19 × sin(142.5°) = 0.724
  y = 1.19 × cos(142.5°) = −0.944
  → orb sits lower-right, below the equatorial plane, as expected for mid-morning.
```

---

## 20. Handoff notes

- Implementation can begin with a static mock of the scene (globe + three hardcoded orbs) to validate the 3D feel before wiring state.
- The scrub→everything flow should be built second; once scrubbing visibly works, the whole concept is de-risked.
- Orb Detail View and Command Palette can be built independently in parallel.
- Settings and Date Jump are last-mile.
- Do not build the Globe's continent texture by hand — use a low-res Natural Earth SVG, convert to PNG with a soft blur. Iteration on this asset will take more time than expected; budget a full day.
- Test with VoiceOver on macOS Safari throughout; the projected-HTML-labels-over-WebGL pattern is subtle and easy to get wrong for screen readers.

*End of UI/UX Specification.*