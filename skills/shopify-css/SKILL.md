---
name: shopify-css
description: CSS conventions for Shopify sections and themes. Use alongside the general martech-css skill. Covers when to use {% stylesheet %} vs {% style %} vs assets/ files, section-ID scoping, color schemes, BEM scoping to prevent leaks, the image CDN, and performance gotchas.
---

# Shopify CSS Conventions

## When to Use
When writing or reviewing CSS for Shopify sections and themes. Use alongside the general `martech-css` skill.

## Instructions

### CSS Loading Methods

| Method | When to Use | Liquid Support |
|--------|-------------|----------------|
| `{% stylesheet %}` | Section-scoped static styles | No — Liquid variables don't render inside |
| `{% style %}` | Dynamic styles using section settings | Yes — use `{{ section.settings.* }}` |
| `{{ 'file.css' \| asset_url \| stylesheet_tag }}` | External stylesheets in `assets/` | No — static files |

- **Never** use raw `<style>` tags — use `{% stylesheet %}` or `{% style %}` instead

### Deciding Where CSS Lives

**Put it in `assets/` when:**
- The styles are shared across multiple sections (buttons, cards, typography, grid utilities)
- You want Shopify's automatic minification
- The CSS has no dependency on section settings — it's purely static
- You're building a base layer (reset, tokens, layout primitives)

**Put it in `{% stylesheet %}` when:**
- The styles are specific to a single section and won't be reused elsewhere
- The CSS is static (no Liquid variables needed)
- You want the styles bundled with the section so it's self-contained and portable

**Put it in `{% style %}` when:**
- CSS values come from section settings (merchant-configurable colors, spacing, fonts)
- You need `section.id` scoping for per-instance styles (e.g., two hero sections on one page with different colors)

### `{% style %}` Gotchas

- **Renders inline per section instance.** Every time the section appears on a page, a separate `<style>` block is injected. Don't put your entire section's CSS in `{% style %}` — only the dynamic values. Static rules belong in `{% stylesheet %}` or `assets/`.
- **No nesting or Sass.** It's raw CSS with Liquid interpolation. Keep it simple.
- **Liquid output can break CSS.** If a setting is blank, you'll get invalid CSS like `color: ;`. Always guard with defaults:
  ```liquid
  {% style %}
    {% if section.settings.heading_color != blank %}
      .section-{{ section.id }} .hero__heading {
        color: {{ section.settings.heading_color }};
      }
    {% endif %}
  {% endstyle %}
  ```
- **Don't duplicate static rules.** If a rule doesn't reference `{{ }}`, it doesn't belong in `{% style %}` — move it to `{% stylesheet %}`.

### `{% stylesheet %}` Gotchas

- **One per section file.** Multiple `{% stylesheet %}` tags in the same file are ignored — only the first is used.
- **No Liquid inside.** `{{ section.settings.color }}` will render as literal text, not the setting value. This is the most common mistake.
- **Concatenated globally.** All sections' `{% stylesheet %}` blocks are merged into a single CSS file. Scope everything with BEM classes — bare selectors will leak across sections.
- **Loads on every page.** Even if the section isn't on the current page, its `{% stylesheet %}` CSS is included in the global stylesheet. Keep it lean.

### Scoping with Section IDs
Shopify wraps each section in a `<div>` with a unique class. Use `section.id` for scoping dynamic styles:
```liquid
{% style %}
  .section-{{ section.id }} .hero__heading {
    color: {{ section.settings.heading_color }};
  }
{% endstyle %}
```

For static styles in `{% stylesheet %}`, use the section's BEM block class — Shopify concatenates all `{% stylesheet %}` content into a single CSS file, so class-based scoping prevents conflicts.

### Design Tokens via Color Schemes
Shopify themes define color schemes in `config/settings_schema.json`. Apply them with a class:
```liquid
<section class="section-{{ section.id }} color-{{ section.settings.color_scheme }}">
```
This gives the section access to the scheme's CSS custom properties without hardcoding colors.

### Asset Organization
- `assets/base.css` — CSS reset, typography defaults, design tokens at `:root`
- `assets/component-*.css` — Shared component styles (buttons, cards, forms)
- Section-specific styles stay inside the section file via `{% stylesheet %}`

Load external stylesheets in `layout/theme.liquid`:
```liquid
{{ 'base.css' | asset_url | stylesheet_tag }}
```

### Scoping Rules
- **Never** use bare element selectors (`a`, `p`, `h2`) in section styles — they leak globally
- Always scope to a BEM class: `.features__title` not `h2`
- The only file that should set base element styles is `base.css`
- Avoid generic class names (`.header`, `.footer`, `.nav`) that conflict with theme defaults — use prefixed names (`.site-header`, `.footer-bar`)

### Responsive Patterns
- Use `clamp()` for fluid typography and spacing
- CSS Grid for multi-column layouts, Flexbox for inline elements
- Stack columns on mobile: `grid-template-columns: 1fr`
- Full-width buttons on mobile: `width: 100%`

### Image Handling
Always use Shopify's image CDN for responsive images:
```liquid
{{ image | image_url: width: 800 | image_tag: alt: image.alt, loading: 'lazy', widths: '400,600,800' }}
```
This generates `srcset` attributes automatically for responsive loading.

### Performance
- Shopify auto-minifies CSS files in `assets/`
- Keep `{% stylesheet %}` blocks lean — they're concatenated into a single file for all sections
- Use `{% style %}` sparingly — it renders inline per section instance
