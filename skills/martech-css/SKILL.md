---
name: martech-css
description: General CSS conventions used across all client web projects regardless of platform (HubSpot, Shopify, WordPress). Covers BEM naming, fluid typography with clamp(), grid/flex layout, button patterns, responsive breakpoint strategy, transitions/animation, and CSS accessibility.
---

# CSS Conventions (General)

## When to Use
When writing or reviewing CSS for any client project, regardless of platform (HubSpot, Shopify, etc.). These are universal CSS patterns used across all templates and modules.

## Instructions

### Naming
- BEM convention: `.block__element--modifier`
- Module root class should be short and descriptive (e.g., `.hero`, `.fg`, `.fbe`, `.cs`)
- Variant classes use `--modifier` suffix (e.g., `.card--dark`, `.final-cta--purple`, `.nav--centered`)

### Typography
- Use `clamp()` for fluid typography — no fixed breakpoint jumps for font sizes
- Negative `letter-spacing` on headings for tighter display type
- Smooth font rendering: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`

### Layout
- Use CSS Grid for multi-column layouts
- Use Flexbox for nav, footer, CTA groups, inline elements
- Cards always `1fr` in grid context — never fixed-width at responsive sizes
- Full-bleed backgrounds: set background on the outer element, constrain content with an inner wrapper using `max-width`
- Container pattern: `max-width: var(--container-max); margin: 0 auto; padding: 0 var(--px)`

### Buttons
- Base `.btn` class with shared padding, font, border-radius, transition
- Variants via modifier classes: `--primary`, `--ghost`, `--outline`, `--nav`
- Hover: `transform: translateY(-2px)` + `box-shadow`

### Responsive Strategy
- Three breakpoints: desktop (default), tablet (`max-width: 1024px`), mobile (`max-width: 768px`)
- Desktop-first with `clamp()` for fluid scaling between breakpoints
- Stack columns on mobile: grid columns → `1fr`, flex → `flex-direction: column`
- Full-width buttons on mobile: `width: 100%; justify-content: center`
- Center text alignment on mobile for section labels and subtexts

### Transitions & Animation
- Default transition: `0.2s–0.3s ease` for interactive states
- Easing curves: `var(--ease-out)` for exits, `var(--ease-smooth)` for general motion
- Keyframe animations: use descriptive names (`glowPulse`, `dotPulse`, `cursorBlink`, `particleDown`)

### Accessibility
- Never use `display: none` on content that should be accessible — use `clip` / `sr-only` patterns
- Focus states: ensure all interactive elements have visible focus indicators
- Color contrast: text on dark backgrounds must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Use `aria-hidden="true"` on decorative SVGs and visual-only elements
