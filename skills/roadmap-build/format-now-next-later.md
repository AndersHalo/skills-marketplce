# Format: Now / Next / Later

**Audience:** Development team
**Purpose:** Communicate what is being built, what comes next, and what is on the horizon — with a visual timeline showing when each horizon runs.
**Filename:** `roadmap-now-next-later.md` + `roadmap-now-next-later.html`

---

## Required Sections

### Vision
1-2 sentences from the PRD answering: "what problem does the next phase solve?"

### Product Goal
The business outcome the team is working toward. One clear sentence.

### Timeline

ASCII bar chart showing when each horizon runs. Derive week ranges from the shared estimate table (critical path per horizon). Do NOT use quarter labels.

```
               Week 1–{X}       Week {X+1}–{Y}   Week {Y+1}+
               ──────────────────────────────────────────────
Now            ████████
In Progress

Next                            ████████████████
Planned

Later                                            ████████████
Strategic horizon
```

Use the actual week ranges computed in Step 7. Replace `{X}`, `{Y}` with the real numbers.

---

### Now — Weeks 1–{X}
*Work the team is actively building. Committed. Prerequisite for everything that follows.*

**How to set the label:** Use the parallel-optimized critical path week count for Now initiatives from the shared estimate table.

Initiative table:

**If `any_sprint_coverage = true`:**
```
| Initiative | Description | PRD Ref | Story Cycles | Confidence | Status | Completion % |
```

**If `any_sprint_coverage = false`:**
```
| Initiative | Description | PRD Ref | Story Cycles | Confidence |
```

- Mark parallelizable initiatives with `(parallel)` after the initiative name.
- After the table add:
  - `**Goal:** {one sentence describing the horizon outcome}`
  - `**Success metric:** {one measurable outcome}`
  - `**Effort:** {n} story cycles total — {n} parallelizable (~{n} calendar weeks on critical path, agentic)`

---

### Next — Weeks {X+1}–{Y}
*Planned priorities. Depend on Now being complete. Direction is clear, details still being refined.*

Same table format as Now. Items must have a stated or implied dependency on Now items.
Add goal, success metric, and effort lines after the table.

---

### Later — Weeks {Y+1}+
*Strategic horizon. Valuable but not urgent. Subject to reprioritization.*

Same table format. Items with no blocking dependencies on Now or Next may also appear here if lower priority.
Add goal, success metric, and effort lines after the table.

---

### Key Dependencies

ASCII diagram showing which initiatives unlock which others:

```
[Initiative A] ──────────────────────────┐
[Initiative B] ──────────────────────────┤
                                          ▼
                          [Initiative C (depends on A+B)]
                                          │
                                          ▼
                          [Initiative D]
```

### Effort Summary
Totals block per the estimation model spec.

---

## HTML Output

Generate `roadmap-now-next-later.html` as a self-contained file. Use the full CSS from `format-html.md`. Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Product Name} — Now / Next / Later</title>
  <!-- full CSS block from format-html.md -->
</head>
<body>

  <div class="hero">
    <h1>{Product Name}</h1>
    <p class="subtitle">Now · Next · Later · {today's date} <span class="version-chip">v{version}</span></p>
    <div class="stats">
      <div class="stat"><span class="label">Initiatives</span><span class="value">{n}</span><span class="sub">total</span></div>
      <div class="stat"><span class="label">Story Cycles</span><span class="value">{n}</span><span class="sub">{n} parallel-optimized</span></div>
      <div class="stat"><span class="label">Calendar Time</span><span class="value">~{n} weeks</span><span class="sub">agentic pipeline</span></div>
      <div class="stat"><span class="label">Critical Path</span><span class="value">{n} cycles</span><span class="sub">{initiative A} → … → {initiative Z}</span></div>
      <!-- if any_sprint_coverage = true: -->
      <div class="stat"><span class="label">Sprint Status</span><span class="value">{n_complete} done</span><span class="sub">{n_in_progress} in progress · {n_planned} planned</span></div>
    </div>
  </div>

  <!-- Timeline bar (ASCII rendered in a <pre> block inside a card) -->
  <section>
    <p class="section-label">Visual Timeline</p>
    <h2>Horizons at a Glance</h2>
    <div class="gantt-wrap"><pre>{ASCII timeline block}</pre></div>
  </section>

  <!-- Now / Next / Later sections — one <section> per horizon -->
  <section id="now">
    <p class="section-label">Now — Weeks 1–{X}</p>
    <h2>{Horizon goal}</h2>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Initiative</th><th>Description</th><th>PRD Ref</th>
          <th>Story Cycles</th><th>Confidence</th>
          <!-- if any_sprint_coverage: --> <th>Status</th><th>Completion %</th>
        </tr></thead>
        <tbody>
          <!-- one <tr class="ec{n}"> per initiative -->
          <!-- add class "at-risk" and risk-note div if status = At Risk -->
        </tbody>
      </table>
    </div>
    <span class="effort-line"><strong>Effort:</strong> {n} cycles — {n} parallelizable (~{n} weeks)</span>
  </section>

  <!-- repeat for Next and Later -->

  <!-- Key Dependencies as a <pre> block -->
  <section id="dependencies">
    <p class="section-label">Dependencies</p>
    <h2>Initiative Dependencies</h2>
    <div class="gantt-wrap"><pre>{ASCII dependency diagram}</pre></div>
  </section>

  <!-- Effort Summary -->
  <section id="summary">
    <p class="section-label">Estimates</p>
    <h2>Effort Summary</h2>
    <!-- summary-grid cards per horizon + totals card -->
    <!-- critical-path block -->
  </section>

  <footer>
    Generated by roadmap-build · {today's date} · v{version} · Sources: {documents used}
  </footer>

</body>
</html>
```

Status badge class: `s-planned`, `s-progress`, `s-complete`, `s-risk`.
Confidence badge class: `badge-high`, `badge-medium`, `badge-low`.
Apply `class="at-risk"` to `<tr>` when status = At Risk.
Omit Status and Completion % columns entirely when `any_sprint_coverage = false`.
