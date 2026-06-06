# UI Polish & Production-Readiness Plan

## 1. Visual Refinements

### TopBar
- Add subtle box-shadow: `0 1px 0 var(--chrome-border)` for depth separation

### Icon Buttons
- Add scale transform on hover (0.97) and active (0.95) for tactile feedback

### Orb Cards
- Add subtle shadow `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` to differentiate from background

### Settings Panel
- Adjust backdrop blur to 32px for more premium glass effect

### Share Menu
- Add arrow/popover pointer at top using CSS pseudo-element

## 2. Micro-interactions

```css
.observatory-icon-btn,
.observatory-control-btn,
.observatory-view-seg-btn {
  transition: transform 100ms ease-out, background 150ms ease-out;
}

.observatory-icon-btn:active {
  transform: scale(0.92);
}

/* Toast improvements */
.toast-container {
  position: fixed;
  bottom: 80px; /* Above bottom bar */
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
```

## 3. Color Scheme Improvements

### Orb Fill Colors (Gradient + Depth)
```css
.horizon-observatory .obs-orb-body {
  background: linear-gradient(
    145deg,
    #f8f4eb 0%,
    #e8dfd0 60%,
    #d9cfc0 100%
  );
  box-shadow: 
    inset 0 1px 0 rgba(255,255,255,0.8),
    0 2px 6px rgba(0,0,0,0.08),
    0 0 0 1px rgba(0,0,0,0.06);
}

/* Day vs Night orbs */
.horizon-observatory .obs-orb.is-day .obs-orb-body {
  background: linear-gradient(145deg, #f0e68c 0%, #daa520 100%);
}

.horizon-observatory .obs-orb.is-night .obs-orb-body {
  background: linear-gradient(145deg, #4a5568 0%, #2d3748 100%);
}

/* Local orb - richer ember glow */
.horizon-observatory .obs-orb.is-local .obs-orb-body {
  box-shadow: 
    0 0 0 3px var(--ember-soft),
    0 2px 8px rgba(212, 80, 44, 0.25),
    inset 0 1px 0 rgba(255,255,255,0.5);
}
```

### Typography Hierarchy
```css
:root {
  --ink-vivid: #1a1714;    /* Primary text - warm black */
  --ink-warm: #4a4743;     /* Secondary - warmer, more visible */
  --ink-muted: #7a7772;    /* Tertiary - still subtle but more presence */
  --ink-faint: #a8a49e;    /* Quaternary - for subtle labels */
}
```

### Surface & Elevation
```css
.horizon-observatory .observatory-topbar {
  background: linear-gradient(180deg, #f8f4eb 0%, #f2ece0 100%);
  box-shadow: 
    0 1px 0 rgba(0,0,0,0.05),
    0 -4px 16px -8px rgba(0,0,0,0.06);
}

/* Button hover - subtle fill instead of inversion */
.horizon-observatory .observatory-control-btn:hover {
  background: rgba(20, 20, 20, 0.06);
  color: #141414;
  border-color: rgba(20, 20, 20, 0.15);
}
```

### Ring & Globe Enhancements
- Replace wireframe materials with solid gradient fills
- Add emissive glow to orbs

### State Colors Expansion
```css
:root {
  --ember: #c44536;       /* Richer red-orange */
  --ember-light: #e0634f;
  --success-vivid: #1f6860;
  --warning-vivid: #b8860b;
  --info-vivid: #4a6fa5;
}
```

### Shadow & Glow System
```css
.elevation-1 { box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.elevation-2 { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.elevation-3 { box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.elevation-4 { box-shadow: 0 12px 40px rgba(0,0,0,0.16); }

.ember-glow {
  box-shadow: 0 0 20px rgba(212, 80, 44, 0.25);
}
```

## 4. Accessibility Enhancements
- Add `aria-live="polite"` to time displays
- Add `role="status"` to scrub control
- Improve focus indicators (2px solid accent, 3px offset)
- Add skip-to-content link
- Add `prefers-contrast: more` media query support

## 5. Production-Readiness Touches
- **Loading states**: Skeleton loaders for CommandPalette results
- **Error states**: Retry button when timezone search fails
- **Empty states**: Illustration + clear CTA for empty orb list
- **Offline support**: Offline indicator in TopBar
- **Performance**: Add `will-change: transform` to animated elements

## Summary: Wireframe → Polished

| Element | Current | Polished |
|---------|---------|----------|
| Orb bodies | 0.5px border, flat fill | Gradient + shadow + inner glow |
| Typography | Monochrome | 4-tier ink hierarchy |
| Buttons | Full inversion on hover | Subtle fill + scale |
| Surfaces | Flat paper | Gradient + elevation shadow |
| Globe/Ring | Wireframe lines | Solid fills with subtle gradient |
| Dividers | 0.5px hairline | 1px with soft shadows |