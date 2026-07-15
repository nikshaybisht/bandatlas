# Accessibility & mobile checklist (manual)

Use after UI copy/layout changes. Target: phone **375×667** and keyboard-only desktop.

## Layout (375px width)

- [ ] Top bar stacks: logo, full-width search, filters
- [ ] Search opens results without horizontal overflow
- [ ] Spectrum plot fills width; chips wrap
- [ ] Technique tabs + Normalized / Absolute scale usable without squashing
- [ ] Property card + 3D stack below plot (single column)
- [ ] Footer text readable; links tappable

## Touch

- [ ] Page scrolls while finger is on the plot (drag-zoom off on coarse pointer)
- [ ] **Zoom in / out / Reset** buttons work and are ≥40px tall
- [ ] Search hit + Overlay buttons easy to tap
- [ ] Export / Data folds open without mis-taps

## Keyboard

- [ ] Tab order: search → filters → theme → tabs → scale → plot zoom → export → references → property links
- [ ] **:focus-visible** ring visible on buttons, tabs, search, folds
- [ ] **Escape** closes search dropdown; blurs search input
- [ ] **Escape** closes open Export / Data & references panels
- [ ] Can select a search hit with Enter/Space (native button)

## Contrast (light theme)

- [ ] Body text and muted labels readable on white/grey panels
- [ ] Plot axis tick labels visible on light plot background
- [ ] Peak λ numbers readable (fill + stroke)
- [ ] Chips and footer links pass rough WCAG AA for normal text

## Reduced motion

- [ ] OS “reduce motion” on → 3D spin does not auto-run (already gated)
- [ ] No essential info only in animations

## Quick commands

```bash
npm run dev
# DevTools → device toolbar → iPhone SE / 375px
# Chrome → Rendering → Emulate CSS media feature prefers-reduced-motion
```

No full redesign required — fix CSS/layout only when a box fails.
