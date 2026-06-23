# style-guide

Default visual style tokens (colors, typography, spacing) used when no styleguide is specified; replaceable with a custom styleguide.

## Colors

| Token | Value | Usage |
|---|---|---|
| primary | #3B82F6 | Primary actions, links, active states |
| primary-dark | #1D4ED8 | Hover states on primary |
| secondary | #6B7280 | Secondary text, borders |
| background | #F9FAFB | Page background |
| surface | #FFFFFF | Card and panel backgrounds |
| text | #111827 | Primary text |
| text-muted | #6B7280 | Secondary text, labels |
| border | #E5E7EB | Dividers, input borders |
| success | #10B981 | Success states and badges |
| warning | #F59E0B | Warning states and badges |
| error | #EF4444 | Error states, destructive actions |
| info | #3B82F6 | Informational messages |

## Typography

| Token | Value | Usage |
|---|---|---|
| font-sans | ui-sans-serif, system-ui, sans-serif | Body text and UI |
| font-mono | ui-monospace, monospace | Code, IDs, timestamps |
| text-sm | 0.875rem / 1.25rem | Labels, captions, helper text |
| text-base | 1rem / 1.5rem | Default body size |
| text-lg | 1.125rem / 1.75rem | Sub-headings, card titles |
| text-xl | 1.25rem / 1.75rem | Section headings |
| text-2xl | 1.5rem / 2rem | Page headings |
| font-normal | 400 | Body text |
| font-medium | 500 | Labels, nav items, table headers |
| font-semibold | 600 | Headings, button labels |

## Spacing

| Token | Value | Common usage |
|---|---|---|
| xs | 0.25rem (1) | Icon gaps, tight inline padding |
| sm | 0.5rem (2) | Internal padding for small components |
| md | 1rem (4) | Standard component padding |
| lg | 1.5rem (6) | Card and panel padding |
| xl | 2rem (8) | Section-level padding |
| 2xl | 3rem (12) | Page-level vertical spacing |

## Tailwind config mapping

Apply these tokens in `tailwind.config.ts` under `theme.extend.colors`:

```ts
colors: {
  primary: { DEFAULT: '#3B82F6', dark: '#1D4ED8' },
  secondary: '#6B7280',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  'text-muted': '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
}
```

And as CSS custom properties in `src/styles/global.css`:

```css
:root {
  --color-primary: #3B82F6;
  --color-primary-dark: #1D4ED8;
  --color-secondary: #6B7280;
  --color-background: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-text: #111827;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}
```
