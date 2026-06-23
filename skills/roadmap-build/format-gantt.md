# Format: Gantt Chart

**Audience:** All stakeholders — cross-functional visual overview  
**Purpose:** Show the full initiative timeline with parallelism, dependencies, and critical path in a single Mermaid diagram.  
**Filename:** `roadmap-gantt.md` + `roadmap-gantt.html`

---

## Required Sections

### Header block

```
# {Product Name} — Gantt Roadmap

**Start date:** {project start date}  
**Total duration:** ~{n} calendar weeks (agentic)  
**Critical path:** {n} story cycles → ~{n} weeks minimum  
**Initiatives:** {n} total · {n} on critical path
```

### Project Start Date

Use `gantt_start` collected in Step 4 of the skill flow (asked alongside document inputs when a Gantt format is selected). This value is already stored in the session checkpoint — do not ask again.

---

## Gantt Diagram Construction Rules

Generate a fenced Mermaid code block (` ```mermaid `).

### Required directives

```
gantt
    title {Product Name} Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    tickInterval 1week
```

### Sections

Group initiatives by the same dimension as the other formats generated in this run:
- **Standalone Gantt only:** use Now / Next / Later grouping derived from the dependency analysis in Step 7
- **Generated alongside Now/Next/Later:** mirror its three horizons
- **Generated alongside Theme-Based:** one section per theme
- **Generated alongside Goal-Oriented:** one section per objective

Section label format:
```
section {Group Name} (Weeks {A}–{B})
```
Use the week ranges computed from the shared estimate table in Step 7 — identical to the labels in the other formats.

### Task definition format

```
{Initiative Name}    :{status_tags}{crit_tag} {id}, {start}, {duration}d
```

| Field | Rule |
|---|---|
| `{status_tags}` | When `any_sprint_coverage = true`: `done, ` if status = Complete; `active, ` if status = In Progress; omit if Planned or At Risk. These tags go BEFORE `crit,`. |
| `{crit_tag}` | `crit,` if on the critical path — omit otherwise |
| `{id}` | Unique short alphanumeric slug, e.g. `gc1`, `ci2`, `cr3` |
| `{start}` | Absolute date (YYYY-MM-DD) for the first task in a group or for parallel initiatives; `after {id}` for sequential dependents |
| `{duration}d` | `story_cycles × 2` days (1 cycle ≈ 2 calendar days) |

**Status tag combinations:**

| Status | Critical path | Tag string |
|---|---|---|
| Complete | Yes | `done, crit,` |
| Complete | No | `done,` |
| In Progress | Yes | `active, crit,` |
| In Progress | No | `active,` |
| Planned / At Risk | Yes | `crit,` |
| Planned / At Risk | No | *(no tags)* |

**Date calculation:**
- Week 1 start = `gantt_start`
- Week N start = `gantt_start + (N − 1) × 7 days`
- For a parallel initiative that runs alongside another: use the same start date
- For a sequential initiative: use `after {predecessor_id}` — Mermaid computes the date automatically

**Parallelism rule:** Initiatives flagged `parallelizable` in the shared estimate table that have no dependency on each other MUST share the same start date (not chained with `after`).

**Critical path rule:** Every initiative in the critical path computed in Step 7 MUST carry the `crit,` tag.

### Full syntax template

```mermaid
gantt
    title {Product Name} Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    tickInterval 1week

    section {Group 1 — e.g. Now} (Weeks 1–{X})
    {Initiative A}               :crit, id_a1, {gantt_start}, {n}d
    {Initiative B (parallel)}    :      id_a2, {gantt_start}, {n}d

    section {Group 2 — e.g. Next} (Weeks {X+1}–{Y})
    {Initiative C}               :crit, id_b1, after id_a1, {n}d
    {Initiative D (parallel)}    :      id_b2, {week_X+1_date}, {n}d

    section {Group 3 — e.g. Later} (Weeks {Y+1}+)
    {Initiative E}               :      id_c1, after id_b1, {n}d
    {Initiative F (parallel)}    :      id_c2, {week_Y+1_date}, {n}d
```

---

> **Note:** IDs like `gc1`, `ci2`, `id_a1` are internal Mermaid references used only for dependency chaining (`after gc1`). They are never displayed in the rendered chart — only the initiative name appears on each bar.

## Initiative Reference Table

After the Mermaid block, add a reference table. Copy values directly from the shared estimate table produced in Step 7 — do NOT re-derive.

**If `any_sprint_coverage = true`:**
```
| Initiative | Group | Story Cycles | Duration | Status | Completion % | Critical Path | PRD Ref |
|---|---|---|---|---|---|---|---|
| {name} | {group} | {n} | ~{n × 2} days | {status} | {n}% | Yes / No | {ref} |
```

**If `any_sprint_coverage = false`:**
```
| Initiative | Group | Story Cycles | Duration | Critical Path | PRD Ref |
|---|---|---|---|---|---|
| {name} | {group} | {n} | ~{n × 2} days | Yes / No | {ref} |
```

---

## Effort Summary

Add the standard `## Effort Summary` block per `estimation-model.md`. The totals MUST be identical to every other roadmap format generated in the same run — copy from the shared estimate table, do not recompute.

---

## HTML Output

Generate `roadmap-gantt.html` as a self-contained file. Use the full CSS from `format-html.md` — the `.g-*` custom Gantt classes are already included in the shared CSS block there.

### Hero

```html
<div class="hero">
  <h1>{Product Name}</h1>
  <p class="subtitle">{Phase Name} · Gantt Roadmap · Start: {gantt_start} <span class="version-chip">v{version}</span></p>
  <div class="stats">
    <div class="stat"><span class="label">Initiatives</span><span class="value">{n}</span><span class="sub">total</span></div>
    <div class="stat"><span class="label">Story Cycles</span><span class="value">{n}</span><span class="sub">{n} parallel-optimized</span></div>
    <div class="stat"><span class="label">Calendar Time</span><span class="value">~{n} weeks</span><span class="sub">agentic pipeline</span></div>
    <div class="stat"><span class="label">Critical Path</span><span class="value">{n} cycles</span><span class="sub">{initiative A} → … → {initiative Z}</span></div>
    <!-- if any_sprint_coverage = true: -->
    <div class="stat"><span class="label">Sprint Status</span><span class="value">{n_complete} done</span><span class="sub">{n_in_progress} in progress · {n_planned} planned</span></div>
  </div>
</div>
```

### Gantt chart rendering — custom HTML/CSS (not Mermaid)

Do NOT use a Mermaid chart in the HTML output. Mermaid's `done,`/`active,` tags render with insufficient visual contrast to communicate sprint status clearly. Use a custom HTML/CSS bar chart instead.

**Custom Gantt rules:**

1. **Calculate total span** — sum the critical path duration in days (`story_cycles × cycle_days` for sequential initiatives). This is the 100% width reference.

2. **Position each bar** — for each initiative, `left = (offset_days / total_days) × 100%` and `width = (duration_days / total_days) × 100%`. Derive `offset_days` from the dependency chain (sequential = previous end; parallel = same start as parallel peer).

3. **Color by status** (when `any_sprint_coverage = true`):
   - **Complete** → solid green (`#68d391`). Inner fill div at `width: {completion}%` using darker green (`#38a169`).
   - **In Progress** → light blue background (`#bee3f8`). Inner fill div at `width: {completion}%` using blue (`#4299e1`).
   - **Planned** → light gray (`#e2e8f0`) with dashed border. No inner fill.
   - When `any_sprint_coverage = false` → all bars use a neutral color; no fill divs.

4. **Critical path** — add `box-shadow: 0 0 0 2px #e53e3e` to every critical-path bar.

5. **Today marker** — a 2px vertical orange line (`#ed8936`) at the `left` position corresponding to today's date within the chart span. Label it "Today" above the line.

6. **Date ticks** — show week boundaries (every 7 days from `gantt_start`) as labeled tick marks above the bar area.

7. **Legend** — always show: Complete (green) · In Progress (blue, fill = % done) · Planned (gray dashed) · Critical path (red outline) · Today (orange line).

8. **Completion % label** — display the percentage centered inside each bar. Use white text for colored bars, dark text for gray planned bars.

**HTML structure:**

```html
<section id="gantt">
  <p class="section-label">Visual Timeline</p>
  <h2>Gantt Chart</h2>
  <p class="desc">Initiative timeline with sprint status and critical path. Start: {gantt_start}.</p>

  <div class="g-legend">
    <span class="g-li"><span class="g-sw" style="background:#68d391"></span> Complete</span>
    <span class="g-li"><span class="g-sw" style="background:#4299e1"></span> In Progress (fill = % done)</span>
    <span class="g-li"><span class="g-sw" style="background:#e2e8f0;border:1.5px dashed #a0aec0"></span> Planned</span>
    <span class="g-li"><span class="g-sw" style="background:transparent;box-shadow:0 0 0 2px #e53e3e;border-radius:3px"></span> Critical path</span>
    <span class="g-li"><span class="g-sw" style="background:#ed8936;width:4px;border-radius:2px"></span> Today ({today})</span>
  </div>

  <div class="gantt-wrap" style="padding:0;overflow-x:auto;">
    <div style="padding:16px 24px 24px;">
      <div class="g-chart">
        <!-- date axis -->
        <div class="g-axis">
          <!-- one .g-tick per week boundary, positioned with left:{% } -->
        </div>

        <!-- per group: .g-group header, then one .g-row per initiative -->
        <!-- each .g-row has: .g-label (with .g-crit-dot if critical) + .g-bars -->
        <!-- each .g-bars has: gridlines, .g-today marker, and .g-bar div -->
        <!-- .g-bar has inner .g-fill (width=completion%) and .g-pct label -->
      </div>
    </div>
  </div>
</section>
```

The markdown file (`roadmap-gantt.md`) keeps the Mermaid block for programmatic use and plain-text environments. The HTML file uses the custom chart described above — they are separate renderings of the same data.
