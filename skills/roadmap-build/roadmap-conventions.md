# Roadmap Conventions

Cross-cutting rules applied by all roadmap formats. Every generated file — markdown and HTML — must comply with these conventions. They complement the format-specific structure rules in each `format-*.md` file.

---

## Sprint Coverage Variables

These variables are computed in Step 6 and used throughout Steps 7–8.

| Variable | Type | Definition |
|---|---|---|
| `sprint_file_loaded` | boolean | True when a sprint/task board file was successfully read in Step 4 |
| `sprint_coverage[initiative]` | boolean per initiative | True when at least one sprint task was fuzzy-matched to this initiative |
| `any_sprint_coverage` | boolean | Derived: `any(sprint_coverage.values())` — true when at least one initiative has coverage |
| `sprint_status_counts` | object | `{ complete, in_progress, planned, at_risk, no_data }` — count of initiatives per status |

**Key rule:** `sprint_coverage` is per-initiative, not global. An initiative with no matched tasks always shows blank Status and Completion % — never "Planned" by default. Columns and stat blocks still appear when `any_sprint_coverage = true`, even if only some initiatives have data.

---

## Sprint Status Display — All Formats

When `any_sprint_coverage = true`, every generated format must include sprint status. When `any_sprint_coverage = false`, all sprint-related columns, stat blocks, and sections are omitted entirely.

### Per-format rules

| Format | Hero | Body |
|---|---|---|
| Now / Next / Later | Sprint Status stat | `Status` and `Completion %` columns in every horizon table |
| Theme-Based | Sprint Status stat | Status inline after each initiative: `Name (FR-01) — {Status} · {n}%` |
| Goal-Oriented (OKR) | Sprint Status stat | `Status` and `Completion %` columns in every initiatives table |
| Gantt | Sprint Status stat | `done,`/`active,` tags on Mermaid bars (markdown); custom progress bars in HTML + `Status`/`Completion %` columns in reference table |

### Hero Sprint Status stat

Add as the fifth stat block in every HTML hero when `any_sprint_coverage = true`. Omit entirely when false.

```html
<div class="stat">
  <span class="label">Sprint Status</span>
  <span class="value">{complete} done</span>
  <span class="sub">{in_progress} in progress · {planned} planned{· {at_risk} at risk}</span>
</div>
```

Counts are per initiative, not per story. Omit "· {n} at risk" when count is 0.

---

## Effort Summary — Required in Every File

Every markdown and HTML file produced in Step 8 MUST end with an `## Effort Summary` section. This is not optional and is not delegated to the format file. Always include all five subsections:

1. **Group breakdown table** — one row per horizon/theme/objective/group, plus a totals row
2. **Sequential and parallel totals** with calendar week range
3. **Critical path** — named initiative chain with cycle and week count
4. **Team Context table** — reviewer count, availability, parallel contexts, QA, PM, UX, calendar blockers
5. **Sprint Progress** — include when `any_sprint_coverage = true`:

```markdown
### Sprint Progress

| Status | Initiatives | Notes |
|---|---|---|
| Complete | {n} | — |
| In Progress | {n} | — |
| Planned | {n} | — |
| At Risk | {n} | — |
| No sprint data | {n} | Not mapped from sprint file |
```

Omit the "No sprint data" row when all initiatives have coverage. Omit the At Risk row when count is 0.

The full block structure for each subsection is defined in `estimation-model.md` → "Totals Block (all formats)".

---

## Estimation Single-Source Rule

Estimates are computed **once** in Step 7 and stored in the shared estimate table. All format files read from that table — never re-derive. If multiple formats are generated in the same run, every format MUST show identical story cycle counts, week ranges, and Effort Summary totals. Divergence between formats is always a bug.
