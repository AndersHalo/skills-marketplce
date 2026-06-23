# Kashia Prototype — Changelog

## v1.0.0 — 2026-06-22

### Initial build

**PRD source:** `docs/kashia/prd-brief-features.md`
**Style references:** `docs/kashia/color-pallete-guide.md`, `docs/kashia/typography-guide.md`
**Platform:** Mobile (375px viewport, bottom nav, bottom-sheet pattern)
**Output directory:** `_skills/prototype-build/prototypes/kashia/`

### Files generated

| File | Scenarios | Interactive widgets |
|---|---|---|
| login.html | 2 | Form validation, error banner |
| dashboard.html | 2 | FAB, status badges |
| new-payment.html | 5 | flatpickr, date banner, duplicate warning, toast, save+add |
| ledger.html | 6 | Filter chips, search, weekly grouping, bottom sheet, edit/delete |
| reports.html | 3 | Chart.js 4.4.0 stacked bar, tab switching, growth badge |
| management.html | 4 | Tab switching, search, client list, bottom sheets, new-client form, Walk-in protection |
| client-profile.html | 2 | Edit sheet, delete modal, tel: link |
| settings.html | 2 | Sync status, toggle, paper width select, BT connect/disconnect |

**Total: 8 HTML files · 26 scenarios**

### Design decisions

- Deep Emerald (#064E3B) primary, Cream (#FDFCF7) background — per brand guide
- Roboto for all monetary amounts and data values; Inter for all UI copy
- Status badge system: BACKDATED (amber), ADVANCED (indigo), SETTLED (slate)
- Walk-in Client (WI-000) always present, cannot be deleted
- localStorage persists role across pages; URL `?scenario=` persists scenario
- Weekly grouping in ledger only when showing all payments (not when filtered)
- Chart.js loaded from CDN (requires internet); flatpickr loaded from CDN

### FRs covered

FR1–FR14 (New Payment), FR15–FR35 (Ledger), FR36–FR41 (Reports + Dashboard),
FR42 (Login), FR51–FR62 (Client Management), FR63–FR66 (Settings/Sync/Print)
