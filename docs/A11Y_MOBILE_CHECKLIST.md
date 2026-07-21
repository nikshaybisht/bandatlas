# Accessibility & mobile checklist

Quick QA before a release. Not automated.

## Keyboard

- [ ] Tab order reaches search, filters, technique tabs, export, theme, tour
- [ ] Escape closes search dropdown
- [ ] Technique tabs use `aria-selected`
- [ ] Focus ring visible on controls (not outline:none without replacement)

## Screen / motion

- [ ] Light and dark themes both readable on plot axes
- [ ] `prefers-reduced-motion: reduce` stops molecule spin
- [ ] Teaching watermark still readable

## Mobile (~375px width)

- [ ] Top nav wraps without covering content
- [ ] Search hits tappable (min ~44px height)
- [ ] Spectrum plot usable; zoom via buttons if drag-zoom is off on touch
- [ ] 3D viewer toolbar wraps; error empty-state still legible
- [ ] Lab note export controls not clipped

## Content honesty

- [ ] Teaching curves labeled (badge + export disclaimer)
- [ ] “Experimental only” empty state explains zero open series
