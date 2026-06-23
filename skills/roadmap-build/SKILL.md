---
name: roadmap-build
description: Generate a product roadmap from PRD with optional Architecture doc. Produces Now/Next/Later, Theme-Based, OKR, and Gantt formats with AI-agent effort estimates.
---

# Roadmap Build

Generate a product roadmap from your PRD — with optional architecture, feature specs, and sprint context — into one or more formats with AI-agent effort estimates.

## On Activation

1. **Startup check** — verify all 9 reference files exist at `{skill-root}`. Check for:
   - `estimation-model.md`
   - `format-now-next-later.md`
   - `format-theme-based.md`
   - `format-goal-oriented.md`
   - `format-gantt.md`
   - `format-html.md`
   - `roadmap-conventions.md`
   - `team-roles-reference.json`
   - `sprint-parsing.md`

   If any file is missing, stop immediately:
   > ⚠ Missing reference file: `{filename}` at `{skill-root}`. The skill may be corrupted — try reinstalling.

2. **Defaults** — try to read `{skill-root}/defaults.md`. If found, parse each line as `{key}: {value}` and store in-memory as overrides. Built-in defaults:
   - `governance-path`: `{skill-root}/governance.md`
   - `output-dir`: `{skill-root}/_roadmaps/{product-name}/` *(resolved after PRD is read in Step 2)*

3. **Session check** — try to read `{skill-root}/session.json`. If found and valid JSON, parse the `step` field.

   **If `step` is a number (active session):** show:

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Resuming roadmap-build session
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   Ask: `Resume from Step {step}, or start fresh?`
   - **Resume** → load stored values and jump to the stored step.
   - **Fresh** → delete `{skill-root}/session.json` and proceed normally.

   **If `step` is `"done"` (completed roadmap):** show:

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Last roadmap: {product_name}  v{roadmap_version}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   Ask: `Refresh sprint status, iterate from scratch, or start fresh?`
   - **Refresh** → proceed to **Refresh path**.
   - **Iterate** → delete `{skill-root}/session.json` and proceed to Step 1.
   - **Fresh** → delete `{skill-root}/session.json` and proceed normally.

4. **Silent preload** — load the following files using the mandatory read loop:
   - `estimation-model.md`
   - `roadmap-conventions.md`
   - `team-roles-reference.json`
   - `sprint-parsing.md`

   **Team governance** — try to read `{governance-path}`. If found, extract `team_profile` and normalize all role names to standard keys using `team-roles-reference.json`. Any unrecognized role is stored as `other_role` and treated as Senior Developer baseline for estimation. If not found, apply solo-developer defaults silently and show:
   > ℹ No governance file found — estimates will use solo-developer defaults. Run `/team-governance` to configure your team profile.

   Keep all loaded content in context for the entire run.

5. Read `{skill-root}/welcome.md` in full and display it. Proceed directly to Step 1.

   If the user says **"show inputs"**, display:

   | # | Input | Required |
   |---|-------|----------|
   | 1 | **prd-file-path** — Path to your Product Requirements Document | ✅ Required |
   | 2 | **feature-files** — Feature spec files to supplement the PRD (path, comma-separated list, or directory) | ⬜ Optional |
   | 3 | **architecture-doc-path** — Path to your architecture document | ⬜ Optional |
   | 4 | **sprint-task-board-path** — Path to a Jira CSV export or markdown task table | ⬜ Optional |

   Then continue from where the skill was.

   If the user says **"change defaults"**, display:

   | # | Setting | Current value | Description |
   |---|---------|---------------|-------------|
   | 1 | **governance-path** | `{value}` | Path to the team governance file |
   | 2 | **output-dir** | `{value}` | Output directory for generated roadmap files |

   Let the user change any setting conversationally. After each change, update in-memory and persist to `{skill-root}/defaults.md`:
   ```
   # Defaults
   governance-path: {value}
   output-dir: {value}
   ```
   Then continue from where the skill was.

---

## How to invoke

`/roadmap-build`

## Behavior

### Refresh path

Triggered from the On Activation done-checkpoint banner, or from the Step 6 completion menu.

**Load reference files** using the mandatory read loop before proceeding — load `estimation-model.md`, `roadmap-conventions.md`, `team-roles-reference.json`, `sprint-parsing.md`, and any format files matching `format_selection` from the checkpoint.

**Target roadmap** — if multiple product folders exist in `{skill-root}/_roadmaps/`, list them and ask:
> Which roadmap do you want to refresh? (number or name)

Otherwise use `output_dir` from the done checkpoint directly.

**Read existing roadmap files** — using the mandatory read loop, read existing roadmap files from `output_dir`. Check for HTML files first (`roadmap-*.html`); if none exist, fall back to markdown files (`roadmap-*.md`). Extract:
- Initiative list (names, groups, story cycles, estimates, risk notes)
- Current version — from `roadmap-meta.json` if present, otherwise from file frontmatter

**Sprint file:**

If `sprint_file_path` is null in the done checkpoint:
> No sprint file from last run. Provide a path to update sprint status, or skip? (path / skip)

Otherwise:
> Use the same sprint file? `{sprint_file_path}` (y / new path / skip)

- **y** → re-read from stored path using the mandatory read loop.
- **path / new path** → ask for path, then read.
- **skip** → proceed without updating sprint status.

If read successfully, parse per `sprint-parsing.md` rules, then re-run the sprint matching and status derivation logic from Step 3 against the extracted initiative list. Recompute `any_sprint_coverage`, `sprint_status_counts`, and `sprint_coverage[initiative]` for all initiatives.

If the file cannot be read:
> ⚠ Sprint file not found at `{path}`. Proceeding without sprint update — status unchanged.

**Date:**
> Update date to today? `{today's date}` (y / skip)

- **y** → set `date = {today}`.
- **skip** → keep current date.

**Version:**
> Increment version? Current: v{roadmap_version} (y / skip)

- **y** → set `roadmap_version = current_version + 1`. Ask: `Briefly describe what changed:`. Append to `{output_dir}/roadmap-changelog.md`.
- **skip** → keep current version.

**Re-generate** — rewrite all present roadmap files in `output_dir`:
- Update sprint status columns, hero Sprint Status stat, and Effort Summary Sprint Progress using recomputed coverage data and `roadmap-conventions.md` rules.
- If HTML files exist, update them. If only markdown files exist, update those.
- Update `roadmap-meta.json` with new date and version.
- All initiative content, story cycle estimates, and non-sprint data remain unchanged.

> ℹ Estimates from v{roadmap_version_before} — run Iterate to update story cycles with fresh PRD data.

Display the same completion summary as Step 6. Update the done checkpoint.

---

### Step 1 — Choose format

**[Step 1 of 6]**

Present this menu and wait for selection:

```
Which roadmap format do you want to generate?

  1) Now / Next / Later   — for the dev team. Sequencing, horizons, and visual timeline.
  2) Theme-Based          — for stakeholders. Strategic direction by theme.
  3) Goal-Oriented (OKR)  — for leadership. Objectives and measurable outcomes.
  4) Gantt Chart          — for all audiences. Dependencies and critical path.
  5) All four             — one HTML per format.
```

Wait for selection. If the response is not a valid choice, re-ask — up to 3 attempts total:
> ⚠ No valid selection after 3 attempts. Aborting.

Store as `format_selection`.

**If `format_selection` is 5**, ask:
> Also generate a combined roadmap view (`roadmap-view.html` with all formats as tabs)? (y / no)

Store as `output_mode`:
- `"both"` — if yes to the combined view question
- `"individual"` — if no, or if `format_selection` is 1–4

Silently load format-specific reference files using the mandatory read loop:

| format_selection | Files to load |
|---|---|
| 1 | `format-now-next-later.md` |
| 2 | `format-theme-based.md` |
| 3 | `format-goal-oriented.md` |
| 4 | `format-gantt.md` |
| 5 | all four format files |

If `output_mode` is `"both"`, also load `format-html.md`.

**Gantt start date** — if `format_selection` is 4 or 5, ask:
> Gantt chart start date? *(press Enter for today: `{today}`)*

Use today's date if blank. Store as `gantt_start`.

**User-initiated format switch** — if the user requests to change format at any point during Steps 1–4, update `format_selection`, immediately load the new format file(s) using the mandatory read loop, and if the new format includes Gantt (4 or 5) and `gantt_start` is null, ask for it before proceeding.

Write checkpoint:
```json
{ "step": 1, "format_selection": {value}, "output_mode": "{value}", "gantt_start": "{value or null}", "product_name": null, "output_dir": null, "feature_file_paths": null, "sprint_file_loaded": null, "sprint_file_path": null, "any_sprint_coverage": null, "current_version": null }
```

---

### Step 2 — Collect and read documents

**[Step 2 of 6]**

Ask one at a time, waiting for each response before continuing:

> What is the path to your PRD file?

Read the file using the mandatory read loop. If it cannot be read, re-ask — up to 3 attempts:
> ⚠ Could not read PRD at `{path}`. Check the path and try again. ({n} attempt(s) remaining)

After 3 failed attempts, stop:
> ⚠ Could not read PRD after 3 attempts. Aborting.

After reading, extract `product_name` from the PRD title or product vision section. Confirm with the user:

> Detected product: **{product_name}**
> Output → `{skill-root}/_roadmaps/{product_name}/`
> Confirm, or enter a different name:

Wait for response. If the user provides a different name, update `product_name`.

**Sanitize before path construction:**
- Strip leading and trailing whitespace
- Replace `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` with `-`
- Collapse multiple consecutive hyphens to one

If the sanitized name differs from the input, show:
> ℹ Name sanitized: `{sanitized}` — path-unsafe characters replaced.

Resolve `output-dir` as `{skill-root}/_roadmaps/{product_name}/` using the sanitized name (or the value from defaults.md if overridden).

Then ask for optional inputs one at a time:

> Feature spec files? *(path, comma-separated list, or directory of .md files — leave blank to skip)*

If provided:
- **Single path** → read the file using the mandatory read loop.
- **Comma-separated paths** → split on `,`, trim whitespace, read each using the mandatory read loop.
- **Directory path** → scan for all `.md` files in that directory (non-recursive), read each using the mandatory read loop.

Store all successfully read content as `feature_docs[]`. For each file that cannot be read, warn and skip:
> ⚠ Could not read `{path}` — skipping.

Store the successfully read paths as `feature_file_paths[]`.

If any feature docs loaded:
> ✓ Feature specs loaded: {n} file(s)

> Architecture document path? *(leave blank to skip)*

If provided, read using the mandatory read loop. If unreadable:
> ⚠ Could not read `{path}` — skipping.

> Sprint / task board file path? *(Jira CSV or markdown table — leave blank to skip)*

If provided, read using the mandatory read loop and parse the task list per `{skill-root}/sprint-parsing.md` rules. Store as:
```
sprint_tasks = [
  { task_name, status, epic, story_points },
  ...
]
```
Set `sprint_file_loaded = true` and store the path as `sprint_file_path`. If unreadable, set `sprint_file_loaded = false`.

If loaded successfully:
> ✓ Sprint file loaded: {n} tasks across {n} epics

Sprint groups are matched to PRD initiatives in Step 3, after the initiative list is known.

**Output directory:**

Create `output-dir` if it does not exist.

**Silent version check:** Try to read `{output_dir}/roadmap-meta.json`. If found, parse `version` and store as `current_version`. If not found, check for any of these files and read `version:` from frontmatter as fallback:
```
roadmap-now-next-later.md
roadmap-theme-based.md
roadmap-goal-oriented.md
roadmap-gantt.md
```
If neither found, set `roadmap_version = 1`.

Display:
> ✓ Output: `{output-dir}`{if current_version: " · v{current_version} found"}

Write checkpoint:
```json
{ "step": 2, "format_selection": {value}, "output_mode": "{value}", "gantt_start": "{value or null}", "product_name": "{value}", "output_dir": "{value}", "feature_file_paths": [{paths} or null], "sprint_file_loaded": {true|false}, "sprint_file_path": "{value or null}", "any_sprint_coverage": null, "current_version": {value or null} }
```

---

### Step 3 — Analyze documents

**[Step 3 of 6]**

**From PRD (required):**
- Product vision — the "why" behind the product and next phase
- Current phase scope
- Next phase scope — all features marked `[DEFERRED]`, `[Phase 2]`, or equivalent, with their FR identifiers
- Success criteria and measurable outcomes
- Dependencies between features (stated or implied)
- Features explicitly removed from scope (Change Requests, CR notes)
- Risk flags: any initiative with a dependency blocker, external dependency, or stated risk — extract the reason text verbatim

**From feature spec files (if provided):**
- Additional initiatives, epics, or features in `feature_docs[]` not already captured in the base PRD
- Feature-level dependencies and risks
- Treat as extensions to the PRD scope — merge into the unified initiative list, deduplicating any overlap with the base PRD

**From Architecture (if provided):**
- Technical dependencies between initiatives
- Deferred architectural decisions and phase additions

Synthesize a **dependency chain**: order all initiatives so prerequisites always appear before dependents.

**Derive per initiative:**

| Field | Source | Rule |
|---|---|---|
| **Status** | Sprint file only | Populated per initiative only when `sprint_coverage[initiative] = true` — see derivation below |
| **Completion %** | Sprint file only | Populated per initiative only when `sprint_coverage[initiative] = true` — (done / total) × 100 |
| **Risk note** | PRD primary | Verbatim reason; "Reason not specified in PRD" if none found |
| **Dependency note** | PRD + Architecture | What this initiative blocks or is blocked by |
| **Epic group** | PRD / Architecture | Theme/group used to organize format sections |

**Sprint matching — runs only when `sprint_file_loaded = true`:**

Using the initiative list just extracted from the PRD and feature docs, match each sprint task group (`epic` field from `sprint_tasks`) to an initiative using layered fuzzy matching. Apply in order until a match is found:
1. Exact match (case-insensitive)
2. Keyword overlap — any significant word in the sprint group name appears in the initiative name or vice versa (ignore stop words: "page", "system", "module", "epic", numbers, articles)
3. Semantic similarity — e.g. `authentication` matches `Auth`, `resource-directory` matches `Resource Directory Page`, `epic-3` containing tasks named `resource-profile-*` matches `Resource Profile Page`

For each initiative, collect all matched sprint tasks and compute:

```
tasks = sprint_tasks where epic fuzzy-matches initiative name
sprint_coverage[initiative] = (total_count > 0)

if total_count = 0            → Status = blank, Completion % = blank
elif at_risk_count > 0        → Status = At Risk,     Completion % = done / total × 100
elif done_count = total_count → Status = Complete,    Completion % = 100
elif done_count > 0 or in_progress_count > 0
                              → Status = In Progress, Completion % = done / total × 100 (rounded)
else                          → Status = Planned,     Completion % = 0
```

**Unmatched sprint groups** — after processing all initiatives, identify sprint groups that could not be matched to any initiative. If any exist, display:
> ⚠ Unmatched sprint groups: `{group1}`, `{group2}`, ...
> Continue without these groups, or provide manual mappings?

- **Continue** → exclude those groups from sprint coverage and proceed.
- **Manual mapping** → for each unmatched group, ask one at a time:
  > Map `{group}` to which initiative? *(or leave blank to skip)*
  Accept the initiative name and fold those tasks into the matched set for that initiative.

After processing all initiatives, compute:
```
any_sprint_coverage = any(sprint_coverage.values())
sprint_status_counts = {
  complete:    count of initiatives where Status = Complete,
  in_progress: count of initiatives where Status = In Progress,
  planned:     count of initiatives where Status = Planned,
  at_risk:     count of initiatives where Status = At Risk,
  no_data:     count of initiatives where sprint_coverage = false
}
```

If no sprint file was loaded, `sprint_coverage` is empty and `any_sprint_coverage = false`.

**Epic group list:**
```
epic_groups_ordered = ["{group1}", "{group2}", ...]
```

Write checkpoint:
```json
{ "step": 3, "format_selection": {value}, "output_mode": "{value}", "gantt_start": "{value or null}", "product_name": "{value}", "output_dir": "{value}", "feature_file_paths": [{paths} or null], "sprint_file_loaded": {value}, "sprint_file_path": "{value or null}", "any_sprint_coverage": {true|false}, "current_version": {value or null} }
```

---

### Step 4 — Estimate all initiatives

**[Step 4 of 6]**

Using `estimation-model.md`, assign for every initiative:
- Complexity tier, story cycles, confidence, parallelizable flag
- Sequential and parallel totals per roadmap group
- Critical path across all groups

Apply Team Adjustment Rules using the `team_profile` loaded during On Activation. If no governance file was found, use solo-developer baseline.

Convert critical-path cycle counts to calendar weeks using the Calendar Time Conversion table in `estimation-model.md`. Use week ranges as time labels — do NOT use quarters or month ranges.

**Epic color assignment:**

Assign in order: first group → `ec0`, second → `ec1`, etc. Wrap after `ec7`.

> `ec0`–`ec7` are CSS class names used by HTML formats. Never displayed as labels.

**Shared Estimate Table — compute once, reuse everywhere:**

```
| Initiative | Group | Epic Color | Story Cycles | Completion % | Status | Risk Note | Dependency Note | Team Adjustments Applied | Confidence | Parallelizable | Offset (days) | Duration (days) | Critical Path |
```

- `Status` and `Completion %` — populated per initiative only when `sprint_coverage[initiative] = true`, otherwise blank
- `Duration (days)` = story_cycles × cycle_days (baseline cycle_days = 2)
- All format files MUST copy from this table — never re-derive

Display before generating:
> ℹ 1 story cycle ≈ {cycle_days} calendar day(s) with current team configuration.

Write checkpoint:
```json
{ "step": 4, "format_selection": {value}, "output_mode": "{value}", "gantt_start": "{value or null}", "product_name": "{value}", "output_dir": "{value}", "feature_file_paths": [{paths} or null], "sprint_file_loaded": {value}, "sprint_file_path": "{value or null}", "any_sprint_coverage": {true|false}, "current_version": {value or null} }
```

---

### Step 5 — Generate roadmap file(s)

**[Step 5 of 6]**

Follow the structure in each loaded format file to generate output. Generate HTML files only.

**Output file table:**

| format_selection | output_mode | Output files |
|---|---|---|
| 1 | individual | `roadmap-now-next-later.html` |
| 2 | individual | `roadmap-theme-based.html` |
| 3 | individual | `roadmap-goal-oriented.html` |
| 4 | individual | `roadmap-gantt.html` |
| 5 | individual | four individual HTML files |
| 5 | both | four individual HTML files + `roadmap-view.html` |

Each format file specifies the HTML structure. Follow it.

Apply all sprint status display, hero stat block, and Effort Summary rules from `roadmap-conventions.md`. Format-specific embedding of story cycles and effort lines is defined in each `format-*.md` file.

**When generating `roadmap-view.html`** (`output_mode = "both"`), use smart file detection to pick the cheapest mode:

**Mode 1 — HTML-compose** *(all four individual HTML files exist)*
1. Read each HTML file using the mandatory read loop.
2. Extract the main content section from each — do NOT re-analyze the PRD or re-derive estimates.
3. Compose `roadmap-view.html` by embedding the extracted sections as tabs.
4. Display: `ℹ Composing combined view from existing HTML files.`

**Mode 2 — Markdown-only** *(all four markdown files exist, but not all HTML)*
1. Read each markdown file using the mandatory read loop.
2. Extract content — do NOT re-analyze the PRD.
3. Generate only `roadmap-view.html`.
4. Display: `ℹ Existing markdown files found — generating combined HTML only.`

**Mode 3 — Full generation** *(any file is missing)*
1. If any individual format files were not loaded in Step 1, load them now using the mandatory read loop.
2. Generate all four individual HTML files.
3. Compose `roadmap-view.html` from the generated HTML.
4. Display: `ℹ Generating all files.`

When generating `roadmap-view.html`, check whether `{output_dir}/roadmap-changelog.md` exists. If it does, read it using the mandatory read loop and include a Changelog section per the spec in `format-html.md`.

**Optional markdown export:**

After all HTML files are written, ask:
> Export markdown files for version control? (y / skip)

- **y** → generate a markdown file for each format with frontmatter:
  ```
  ---
  document: Product Roadmap
  format: {format name}
  title: {product name} — {phase name} Roadmap
  version: {roadmap_version}
  date: {today's date}
  sources: {documents used}
  ---
  ```
- **skip** → no markdown files generated.

**Write metadata file:**

Write `{output_dir}/roadmap-meta.json`:
```json
{ "version": {roadmap_version}, "date": "{today's date}", "format_selection": {value}, "product_name": "{value}" }
```

Write checkpoint:
```json
{ "step": 5, "format_selection": {value}, "output_mode": "{value}", "gantt_start": "{value or null}", "product_name": "{value}", "output_dir": "{value}", "feature_file_paths": [{paths} or null], "sprint_file_loaded": {value}, "sprint_file_path": "{value or null}", "any_sprint_coverage": {true|false}, "current_version": {value or null} }
```

---

### Step 6 — Done

**[Step 6 of 6]**

**Versioning** — only if `current_version` was found in Step 2:

Ask:
> Roadmap updated. Previous version was v{current_version}. Archive it and create a changelog entry? (y / skip)

**If yes:**
1. Set `roadmap_version = current_version + 1`
2. Ask: `Briefly describe what changed and why:`
3. Copy each `roadmap-*.html`, `roadmap-*.md` (if present), and `roadmap-view.html` to `{output_dir}/_archive/v{current_version}/`
4. Append to `{output_dir}/roadmap-changelog.md`:

```markdown
## v{new_version} — {today's date}

**Reason:** {user-provided reason}

### Changes
- {derive from context or ask for a brief list}
```

5. Update `version` in `roadmap-meta.json` and all generated files to `{new_version}`.
6. Display: `✓ Archived v{current_version} → v{new_version} created.`

**If skip:**
> ⚠ Existing roadmap files will be overwritten. Continue? (y / cancel)

- **y** → overwrite in place. No archive, no changelog entry.
- **cancel** → return to the versioning question.

---

**Output summary:**

```
✓ Roadmap v{roadmap_version}

Files:
  {list all written files with relative paths}

Status:  {if any_sprint_coverage: "{n} complete · {n} in progress · {n} planned{· n at risk}"
          else: "no sprint data — open files show planning view only"}
Effort:  {n} cycles sequential · {n} parallel-optimized · critical path ~{n} weeks
Team:    {n} reviewer(s) · ~{cycle_days}d/cycle · {n} parallel contexts
{if at risk: "⚠ {n} initiative(s) at risk — see Risk column in roadmap"}
```

> 💡 Open any `.html` file with a double-click in any browser — no server required.

Write done checkpoint to `{skill-root}/session.json`:
```json
{ "step": "done", "product_name": "{value}", "output_dir": "{value}", "format_selection": {value}, "sprint_file_path": "{value or null}", "roadmap_version": {value} }
```

```
Working in: {output_dir}

What's next?
  1. Iterate — regenerate with updated documents
  2. New format — generate a different format from the same documents
  3. Refresh — update sprint status and date without re-reading documents
  4. Done
```

- **1 (Iterate)** → return to Step 2 and reload documents fresh. Keep team profile in memory.
- **2 (New format)** → return to Step 1. Keep loaded documents and estimates in memory.
- **3 (Refresh)** → proceed to **Refresh path** using documents already in memory.
- **4 (Done)** → end.
