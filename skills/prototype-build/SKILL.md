---
name: prototype-build
description: Reads a PRD from the project directory, analyzes it, and generates a multi-file HTML prototype — one HTML file per screen — with embedded mock data, a floating State panel for role and scenario switching, functional interactive widgets in each screen, and role-based navigation.
---

## On Activation

1. Try to read `{skill-root}/defaults.md`. If found, parse each line as `{key}: {value}` and store in-memory as overrides.

2. Read `{skill-root}/welcome.md` in full and display it.

3. Proceed directly to the normal flow.

   When the user says "change defaults", display the defaults table with current in-memory values:

   | # | Setting | Current value | Description |
   |---|---------|---------------|-------------|
   | 1 | **stack** | `HTML + CSS + Vanilla JS` | Tech stack; only HTML + CSS + Vanilla JS is currently supported |
   | 2 | **output-dir** | `{skill-root}/prototypes/{prototype-name}` | Output path; `{prototype-name}` resolved from PRD filename in Step 2 |

   After each change: update in-memory and persist to `{skill-root}/defaults.md`:
   ```
   # Defaults
   output-dir: {value}
   ```

   When the user says "show inputs", display:

   | Input | Required |
   |---|---|
   | prd-path | ✅ Required |

---

# Prototype Builder

Reads a PRD from the project directory, analyzes it, and generates a multi-file HTML prototype — one HTML file per screen — with embedded mock data, a floating State panel for role and scenario switching, functional interactive widgets in each screen, and role-based navigation.

**Stack: HTML + CSS + Vanilla JS. One `.html` file per screen. No build step.** Output lands in `{skill-root}/prototypes/{prototype-name}/`.

## How to invoke

`/prototype-build`

## Behavior

### Step 1 — Setup

Load all reference files needed for this run. Use the mandatory read loop for each:

```
offset = 0; chunks = []
loop:
  read file at offset, limit=200
  append to chunks
  if result < 200 lines → EXIT loop
  else → offset += 200, continue
content = join(chunks)
```

**Load now (eager):**
- `{skill-root}/schema-instructions.md` — entity schema derivation rules and use case coverage check procedure
- `{skill-root}/style-guide.md` — default visual style tokens used as fallback
- `{skill-root}/interactive-components.md` — complete JS implementation patterns for all common UI components; referenced during HTML generation in Step 7

**Load lazily (just before Step 7 generation begins):**
- `{skill-root}/control-panel.md` — State panel HTML structure, JS behavior, two-tier interactivity model, renderScreen() contract
- `{skill-root}/session-tracking.md` — format definitions for all tracking documents

If any eagerly-loaded file cannot be read:
> ⚠ Could not read `{filename}` at `{skill-root}`. Check the path and try again.

---

### Step 2 — Find and read PRD

Display: `[Step 2 of 9]`

**Find PRD candidates:**

Scan the current working directory (non-recursively first, then one level deep) for files whose name contains `prd`, `PRD`, `requirements`, or `spec`, or whose extension is `.md`, `.txt`, or `.pdf` and whose name suggests a product document.

Present as a numbered list:

```
Found PRD candidates:
  1. {filename} ({relative path})
  ...
```

Ask:
> Which file is your PRD? Enter a number, or paste the full path if it's not listed.

If no candidates found:
> ⚠ No PRD files found in the current directory. Paste the full path to your PRD file.

Allow up to 3 attempts. After 3 invalid responses:
> ⚠ Could not locate a PRD after 3 attempts. Type the full path or `abort` to exit.

If `abort`: end the skill run. Store confirmed path as `prd_path`.

**Read PRD:**

Read the file at `prd_path` using the mandatory read loop. Store as `prd_content`.

If unreadable:
> ⚠ Could not read `{prd_path}`. Check the path and try again.

**Read auxiliary documents:**

Scan the directory containing `prd_path` (non-recursively) for any `.md`, `.txt`, `.pdf`, or `.html` files that are not the PRD itself. Treat a file as an aux candidate if its name contains any of: `auth`, `role`, `rbac`, `feature`, `spec`, `epic`, `stor`, `admin`, `requirements`, `overview`, `design`, `flow`, `doc`, `guide`.

Present as a numbered list (skip the PRD itself):

```
Found additional documents:
  1. {filename} ({relative path})
  ...
```

Ask:
> Are there additional feature or role documents to include? Enter numbers (e.g. `1 3`), paste full paths, or type `none` to skip.

Allow the user to mix numbers and paths in one reply. Read each confirmed file using the mandatory read loop. Store as `aux_docs[]` — each entry: `{ path, label: filename, content }`. Total aux content may be large; read all requested files before proceeding.

If the user types `none` or skips: `aux_docs = []`.

If no candidates found in the directory, ask:
> Are there any additional feature or role documents to include? Paste file paths, or type `none` to skip.

**Format detection** — apply extraction hints during Step 3 analysis:
- `.md` — headings (`#`, `##`, `###`) and bullet lists as structural markers
- `.txt` — blank lines and ALL-CAPS lines as section boundaries
- `.pdf` — page breaks, bold text, and numbered headings as structural markers; normalize whitespace aggressively

**Derive names:**

- `prototype_name`: strip extension, normalize to kebab-case (e.g. `MyApp-PRD.md` → `my-app`)
- `output_dir`: substitute `{prototype-name}` in the in-memory `output-dir` value with `prototype_name`

**Session check:**

Try to read `{output_dir}/.prototype-session.json`. If found and valid JSON: store as `prior_session`. If not found or invalid: `prior_session = null`.

**Naming collision check:** If `prior_session` is set and `prior_session.last_run.prd` differs from the current PRD filename:

> ⚠ `{output_dir}` was last built from `{prior_session.last_run.prd}`, not `{prd_filename}`.
> 1. Rename output directory — enter a new name
> 2. Continue anyway — treat as Full rebuild

If option 1: update `prototype_name`, recompute `output_dir`, set `prior_session = null`.

**Existing run detected:** If `prior_session` is set, present:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Active session found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:      {prototype_name}
Last run:  {prior_session.last_run.date}
PRD:       {prior_session.last_run.prd}
Aux docs:  {prior_session.last_run.aux_docs joined by ", " or "none"}
Screens:   {prior_session.snapshot.screens joined by ", "}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Full rebuild — re-read PRD from scratch; regenerate all screens
2. Patch        — describe what changed, or provide increment files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- **1 / Full rebuild** → `run_mode = "full"`. Proceed.
- **2 / Patch** → ask:
  > Describe the changes since last run, or paste the path to increment / changelog files.

  Accept free-text, file path(s), or both. Read any provided files using the mandatory read loop. Store as `patch_description`. `run_mode = "patch"`. Proceed.

If `prior_session = null`: `run_mode = "full"`, proceed silently.

---

### Step 3 — Analyze PRD

Display: `[Step 3 of 9]`

Silently analyze `prd_content` **and all `aux_docs[]` content** (using format hints from Step 2) and extract. Treat aux docs as additive to the PRD — roles, screens, FRs, and interactions defined in aux docs are merged into the same analysis. When the same FR appears in both, the aux doc's version takes precedence (it is more recent).

- **Screens** — every distinct page or view described
- **Roles / personas** — distinct user types with different views or permissions
- **States** — loading, empty, error, success, and domain-specific states per screen
- **Interaction patterns** — forms, filters, modals, drawers, tables, charts, wizards
- **Additional CDN libraries** — scan for component signals (silent pass):

| Signal | CDN library |
|---|---|
| Charts, graphs, metrics, dashboards | Chart.js |
| Date pickers, calendars | flatpickr |
| Rich text / WYSIWYG editor | Quill |
| Maps, geolocation | Leaflet |
| Drag and drop, sortable lists | SortableJS |

Store any detected libraries as `extra_libs[]`.

**FR extraction (silent):**

While analyzing `prd_content` and each file in `aux_docs[]`, scan for functional requirements. Look for explicit labels (`FR-\d+`, `UC-\d+`, `REQ-\d+`, `AUTH-\d+`, `Story \w+`, `AC \d+`), numbered sections under "Functional Requirements", "Features", "User Stories", "Acceptance Criteria", or "Requirements" headings, and distinct capability bullets. For each identified requirement:

```js
{ id: "FR-012", description: "{requirement text, trimmed to one sentence}", screen_hint: "{inferred screen name or null}", source: "{prd | aux doc filename}" }
```

Store as `fr_list[]`. If no explicit FR labels exist, derive one entry per distinct feature or capability described. Aux doc FRs are always included — they are not optional. Include `FRs identified: {N} ({M} from aux docs)` in the analysis summary.

**Platform type:**

Ask:
> Is this a **web** or **mobile** prototype?

Store as `platform_type`. Design rules applied throughout:
- **Web** — sidebar nav, data-dense tables, hover/focus states, multi-column layouts, 14–16px base font
- **Mobile** — bottom nav bar (max 5 items) or hamburger, touch targets ≥44px, single-column, 16px min font, no hover-only interactions

**Complex screen decomposition:**

A screen is complex if the PRD devotes separate FR numbers or headings to internal views (tabs, sub-views, drawers). For each complex screen, break it into named sub-views.

```
Complex screens ({N}):
  {ScreenName}: {sub-view list}
```

Ask:
> Type `expand` to see the full sub-view breakdown, or confirm to continue.

- **`expand`** → show each sub-view with its FR numbers. Ask to confirm or adjust.
- **confirm** → proceed.

**Present analysis summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PRD Analysis — {prototype_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Screens ({N}):        {comma-separated list}
Roles ({N}):          {list}
States per screen:    {summary}
Interactions:         {list}
Libraries detected:   {list or "none"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask:
> Are these roles and screens correct? Type `skip {library}` to remove any detected library, or confirm to continue.

Wait for confirmation. Update stored values if adjusted.

**Patch mode — compute patch targets:**

If `run_mode = "patch"` and `prior_session` is set, diff current analysis against `prior_session.snapshot`:

```
added_screens    = current screens not in snapshot.screens
removed_screens  = snapshot.screens not in current screens
changed_screens  = screens in both but with new/removed sub-views or states
added_entities   = current entities not in snapshot.entities
removed_entities = snapshot.entities not in current entities
changed_roles    = any difference between current roles and snapshot.roles

patch_targets = added_screens + changed_screens
              + any screen whose entity or role changed
```

Store `patch_targets`. Steps 4–7 run in full; Step 7 generation limits file writes to `patch_targets` only.

---

### Step 4 — Design

Display: `[Step 4 of 9]`

**Patch mode shortcut:** If `run_mode = "patch"` and no structural changes were detected (screens unchanged, roles unchanged, platform_type unchanged) — inherit `active_style`, `nav_config`, and `layout_config` from `prior_session.design`. Display:

```
↳ Design inherited from prior session — no structural changes detected.
```

Proceed to Step 5.

**Otherwise — build design block:**

*Styleguide detection (silent):*
1. Scan `prd_content` for brand colors, typography, or specific color values (hex, rgb, Tailwind names, token names)
2. Scan CWD non-recursively for files named `styleguide`, `style-guide`, `brand`, `design-tokens`, or `colors` with extension `.md`, `.json`, `.css`, or `.txt`
3. If neither found: use defaults from `{skill-root}/style-guide.md`

*Navigation proposal (silent):*
- **Web** — sidebar layout; group related screens; note role-restricted items
- **Mobile** — bottom nav bar (max 5 primary items); overflow via hamburger or "More" tab

*Layout inference (silent):*
- **Web:** 1–3 screens → Top nav · 4–6 screens → Sidebar fixed · 7+ screens or PRD mentions "collapse"/"drawer" → Sidebar collapsible · PRD mentions "dashboard"/"admin"/"management" → Sidebar regardless of count
- **Mobile:** always single-column; bottom nav for primary; modals/drawers for secondary
- **Header:** include if PRD mentions login, auth, user profile, settings, or notifications
- **Dark mode:** only if PRD explicitly mentions it; default no
- **Icons:** Lucide Icons (CDN) unless PRD names a specific library

Present as one combined confirmation block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Design — {prototype_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Styleguide   source: {PRD | {filename} | default}
  Primary:     {value}
  Background:  {value}
  Text:        {value}
  Accent:      {value or "none"}
  Typography:  {font family or "system default"}

Navigation   {Sidebar | Bottom nav | Bottom nav + hamburger}
  {Label} → {route}   [{role restriction if any}]
  ...

Layout       {platform_type}
  Type:       {Sidebar fixed | Sidebar collapsible | Bottom nav | Top nav}
  Header:     {Yes | No}
  Icons:      {Lucide Icons | {other}}
  Dark mode:  {No | Yes}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask:
> Confirm this design, or type `style`, `nav`, or `layout` to adjust a section.

- **confirm** → store `active_style`, `nav_config`, `layout_config`. Proceed.
- **`style`** → show styleguide sub-block only; accept changes; re-display full block.
- **`nav`** → show navigation sub-block only; accept changes; re-display full block.
- **`layout`** → show layout sub-block only; accept changes; re-display full block.
- **Freeform change** (e.g. "change primary to #2563eb") → apply inline; re-display full block.

If the user provides a styleguide file path: read it using the mandatory read loop and extract tokens.

---

### Step 5 — Schema

Display: `[Step 5 of 9]`

Using the rules in `{skill-root}/schema-instructions.md` and the confirmed screens from Step 3, silently derive a UI-adapted data schema.

Present a compact entity map:

```
Entities ({N}):
  • {EntityName} — {one-line purpose}
  ...
```

Ask:
> Type `expand` to see full schema with fields and relationships, or confirm to continue.

- **`expand`** → show full schema. Ask to adjust or confirm.
- **confirm** → run coverage check.

**Coverage check:**

Cross-reference every entity against every state and role confirmed in Step 3. Rules:
1. For every `status`/`state` union type value — verify a screen displays records in that state.
2. For every role — verify the schema has at least one entity with role-driven behavior.
3. For every screen with domain-specific states — verify the schema entity has a field representing those states.

Present coverage matrix:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Schema coverage check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entity        States covered              Gaps
──────────────────────────────────────────────
{EntityName}  {value} ✓  {value} ✓       {value} ✗
...

Gaps: {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask:
> Fix gaps or mark as out-of-scope?
> Type `fix {Entity} {value}` to add a missing value, or `skip` to mark all gaps as out-of-scope.

- **`fix {Entity} {value}`** → add to entity's union type. Re-run check. Repeat until no gaps.
- **`skip`** → store `coverage_gaps[]` (informational). Proceed.
- **No gaps** → display `✓ Schema coverage: 100%` and proceed silently.

---

### Step 6 — Data

Display: `[Step 6 of 9]`

**Phase A — Scenario design**

For each confirmed screen, derive named scenarios from `fr_list[]`. Group FRs that can be demonstrated with the same dataset into one scenario. For each group produce:

```js
{
  key:               "{screen-slug}_{story-slug}",   // e.g. "resource_dir_manager_busy"
  label:             "{Descriptive story name}",      // e.g. "Manager — busy week"
  role:              "{role}",
  frs:               ["{FR-id}", ...],
  data_requirements: "{what data makes these FRs visible — plain English}"
}
```

After FR-based derivation, check for gaps per screen:
- No empty state scenario → add one
- No error state scenario → add one
- Multiple roles but only one role's scenarios present → add scenarios for other roles

Present per screen and ask to confirm, add (`add {description}`), or remove (`remove {key}`):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Scenarios — {ScreenName} ({N})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. {key}   {label}
   Role: {role} · FRs: {ids}
   Data: {data_requirements}
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Store confirmed scenarios in `all_scenarios[]`.

**FR coverage check:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FR Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FR-012 ✓  {scenario key}
FR-019 ✗  — not covered
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gaps: {N}
```

For each uncovered FR, ask for a scenario description or `skip` to mark out-of-scope. Proceed when all FRs are covered or skipped.

**Phase B — Generate SCREEN_DATA**

Process **one screen at a time**. For each screen, generate a complete dataset per confirmed scenario. Data is designed to make the scenario's `frs[]` visible and demonstrable — not generic fill.

Data generation rules per scenario:
- Generate records that specifically surface the scenario's FRs: include the statuses, values, and field combinations the FR describes
- Include boundary-condition records relevant to the scenario (max value, at-limit, overdue, conflicting dates, etc.)
- Role-filtered: data reflects exactly what `scenario.role` can see per PRD permissions

For empty-state scenarios: `data: { items: [], message: '{domain-appropriate empty message}' }`

For error-state scenarios: `data: { error: '{domain-appropriate error}', items: null }`

Organize as a `SCREEN_DATA` object keyed by scenario, embedded in that screen's HTML file:

```js
const SCREEN_DATA = {
  '{scenario_key}': {
    role:  '{role}',
    label: '{Scenario label}',
    frs:   ['{FR-id}', ...],
    data:  { /* records designed to surface the scenario's FRs */ }
  }
  /* repeat per scenario for this screen */
}
```

Generate `const SCENARIOS = [{ key: '{key}', label: '{label}', role: '{role}' }, ...]` alongside `SCREEN_DATA`. These drive the State panel's Scenario section.

**Phase C — Verify FR coverage**

```
Coverage verification:
  {N} FRs → covered by {N} scenarios across {M} screens
  Uncovered FRs: {list or "none"}
```

Display `✓ FR coverage: {N}/{N} complete` then proceed.

---

### Step 7 — Generate

Display: `[Step 7 of 9]`

**Lazy-load (if not already in context):** read `{skill-root}/control-panel.md` and `{skill-root}/session-tracking.md` using the mandatory read loop.

**Pre-generation check:** If any screen, flow, or component lacks enough detail to generate (missing field types, ambiguous role restrictions, undefined interaction), list the gaps and wait for answers before continuing. For each interactive component type needed, reference the matching pattern in `{skill-root}/interactive-components.md`. If nothing is missing, proceed immediately.

**Confirm output path:**

> I'll write the prototype to: `{output_dir}/`
> Confirm or enter a different path.

Allow up to 3 attempts. After 3 invalid paths:
> ⚠ Could not confirm an output path after 3 attempts. Type a valid path or `abort` to exit.

If `abort`: end the skill run.

**Build estimate:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Build estimate — {prototype_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Platform:   {web | mobile}
  Mode:       {Full rebuild | Patch}
  Screens:    {N} files  {patch mode: "({M} changed)"}
  Use cases:  {N} total
  Libraries:  {list or "none"}
  Output:     {output_dir}/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Starting now…
```

Start immediately — no additional confirmation prompt.

---

#### File structure (HTML + CSS + Vanilla JS)

Generate **one HTML file per screen** in `{output_dir}/`. File name = screen route (e.g. `directory.html`, `project-detail.html`). Login is always `login.html`.

In patch mode: only write files in `patch_targets`. Skip all other screens.

Each file is **fully self-contained**: all CSS in `<style>`, all JS in `<script>`, `SCREEN_DATA` embedded inline.

**Cross-page navigation:** `<a href="{screen}.html">` links. Role persists via `localStorage`. Active scenario passed via URL query param `?scenario={key}`.

**Per-screen file template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{ScreenName} — {prototype_name}</title>
  <!-- Google Fonts if active_style specifies a web font -->
  <!-- CDN libraries from extra_libs[] -->
  <style>
    :root { /* active_style CSS custom properties */ }
    /* Shared component classes */
    /* State panel styles — see control-panel.md */
    /* Screen-specific styles */
  </style>
</head>
<body>

  <!-- FLOATING STATE PANEL — follows control-panel.md rules exactly -->

  <!-- SCREEN CONTENT -->
  <div id="screen-content"></div>

  <script>
    /* ── SCREEN DATA — keyed by scenario (from Step 6 Phase B) ── */
    const SCREEN_DATA = {
      '{scenario_key}': { role: '{role}', label: '{label}', frs: ['{FR-id}'], data: { /* ... */ } }
      /* repeat per scenario */
    }

    /* ── SCENARIOS (drives State panel Scenario section) ── */
    const SCENARIOS = [
      { key: '{scenario_key}', label: '{Scenario label}', role: '{role}' }
      /* repeat per scenario for this screen */
    ]

    /* ── NAV CONFIG (per role, for app sidebar/bottom nav) ── */
    const NAV = {
      '{role}': [{ id: '{route}', label: '{Label}', file: '{screen}.html' }]
      /* repeat per role */
    }

    const DEFAULT_PAGE = { '{role}': '{screen}.html' /* repeat */ }
    const ROLE_LABELS  = { '{role}': '{Display Name}' /* repeat */ }

    /* ── CURRENT STATE ── */
    const params = new URLSearchParams(location.search)
    let S = {
      scenario: params.get('scenario') || Object.keys(SCREEN_DATA)[0],
      role: null
    }
    var _sc = SCREEN_DATA[S.scenario] || SCREEN_DATA[Object.keys(SCREEN_DATA)[0]]
    S.role = localStorage.getItem('rp_role') || (_sc ? _sc.role : '{firstRole}')

    /* ── STATE PANEL — from control-panel.md ── */
    /* togglePanel(), renderPanel(), setScenario(), overrideRole(), switchRole() */

    /* ── DATA RESOLUTION ── */
    function getData() {
      var sc = SCREEN_DATA[S.scenario] || SCREEN_DATA[Object.keys(SCREEN_DATA)[0]]
      return sc ? sc.data || {} : {}
    }

    /* ── SCREEN RENDER (presentational HTML + local JS handlers) ── */
    function renderScreen() {
      var data = getData()
      var el = document.getElementById('screen-content')
      /* Build screen HTML — handle loading/empty/error/domain states */
      /* Define all local UI handlers inline: tabs, filters, search, sort, accordion, pagination */
    }

    /* ── INIT ── */
    document.addEventListener('DOMContentLoaded', function() {
      renderPanel()
      renderScreen()
    })
  </script>
</body>
</html>
```

**`login.html`** — State panel shows Scenarios section only (no Role override). Each scenario represents logging in as a specific role (e.g. `login_as_manager`, `login_error`). Login card contains only form fields and submit button.

**Role persistence rules:**
- `localStorage.setItem('rp_role', role)` on every scenario/role change
- `setScenario(key)`: sets both `S.scenario` and `S.role` from `SCREEN_DATA[key].role`; saves role to localStorage
- `overrideRole(role)`: sets `S.role` only; saves to localStorage; re-renders without redirecting
- `switchRole(role)`: saves to localStorage, redirects to `DEFAULT_PAGE[role]` — used by nav links only
- If a role navigates to a page it cannot access: redirect to `DEFAULT_PAGE[role]`
- Login: any non-empty password OR pressing Enter calls `switchRole(S.role)` — no validation

---

#### Two-tier interactivity model

Every interactive element must belong to exactly one tier:

| Tier | Where it lives | What it controls |
|---|---|---|
| **State panel** | `renderPanel()` + floating overlay | Scenario switching (sets role + dataset) · Role override (changes role within current dataset) |
| **Mockup** | `renderScreen()` + inline JS handlers | Tab switches · filter pills · search inputs · sort controls · accordion open/close · pagination · row selection · modal triggers |

**Every tab set, filter pill, search input, sort header, accordion, and pagination control rendered by `renderScreen()` must have a real JS event handler.** Passive-looking interactive elements are a generation error.

Local UI handlers manipulate the DOM directly without calling `setScenario()` or `overrideRole()`. They operate on the already-loaded `getData()` result:

```js
/* CORRECT — local tab switch inside renderScreen() */
function renderScreen() {
  var data = getData()
  var activeTab = 'all'  /* local state, not S.scenario */

  function showTab(tab) {
    activeTab = tab
    /* re-render only the affected portion of the DOM */
  }

  el.innerHTML = /* HTML with onclick="showTab('all')" on each tab */
}
```

---

#### Mockup-only law

All HTML returned by `renderScreen()` and all static HTML inside `#screen-content` must be purely presentational with respect to role/scenario switching:

- `renderScreen()` never calls `setScenario()`, `overrideRole()`, or `switchRole()`
- Forbidden inside `#screen-content`: scenario buttons, role buttons, `<select>` for scenario/role, "Switch to X" links, any `onclick` targeting `setScenario`, `overrideRole`, or `switchRole`
- **Locked / restricted screens:** render passive text only — no button, no link:
  ```html
  <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0">
    This screen is restricted to [Role]. Use the <strong>⚙ State</strong> panel to switch roles.
  </p>
  ```
- No "control panel" or "dev settings" screen rendered as mockup content

**Pre-write self-check (run before writing each file):**
1. Search `renderScreen()` for `setScenario(`, `overrideRole(`, `switchRole(`, any `onclick` targeting scenario/role switching
2. Search all static HTML outside `#state-panel` and `#state-panel-toggle` for the same patterns
3. Verify every tab bar, filter, search input, sort header, accordion, and pagination control has a JS event handler
4. If any violation: move controls to `renderPanel()`, add missing handlers inline, re-run steps 1–3
5. Write only after all checks pass

---

#### Template literal safety (critical — violations break the entire script)

- Never place `;` inside `${}`: write `${expr};suffix` not `${expr;suffix}`
  - Wrong: `` `color:${active?'red':'blue';font-weight:bold}` ``
  - Right: `` `color:${active?'red':'blue'};font-weight:bold` ``
- Never nest backtick strings inside `${}`: use single quotes or factor into a variable
  - Wrong: `` onclick="${locked?'':``navigate('page')``}" ``
  - Right: `` onclick="${locked?'':\"navigate('page')\"}" `` or `var h = locked ? '' : "navigate('page')"` then `` onclick="${h}" ``
- Keep template literals to one expression depth; if deeper nesting is unavoidable, build the string in a named variable first

---

#### Platform-specific rules

- **Web:** State panel slides in from right edge; data tables with headers; hover states on interactive elements; 14px base font minimum
- **Mobile:** State panel toggle is floating button at bottom-right; panel state buttons have `min-height:44px`; full-width single-column content; 16px base font; cards instead of tables

---

#### Syntax validation (per file, before writing)

Scan each screen's `<script>` block for:
1. Semicolons inside `${}` — pattern: `${[^}]*;[^}]*}`
2. Nested backtick strings inside `${}` — pattern: `` ${[^}]*`[^`]*` ``
3. Unmatched backticks (odd count in script block)
4. `onclick` attributes with double-backtick patterns
5. `setScenario(`, `overrideRole(`, or `switchRole(` calls inside `renderScreen()` body or static `#screen-content` HTML

If issues found: fix inline and list:

```
⚠ Fixed before writing {screen}.html:
  line {N}: semicolon inside ${} — moved outside
  line {N}: nested backtick — replaced with single quotes
```

If issues cannot be auto-fixed: list them and ask:
> Fix manually (paste corrected lines) or `continue anyway`?

---

#### Functional coverage check (per file, after syntax validation)

Scan `renderScreen()`'s output for interactive UI elements: tab bars, filter pills, search `<input>` elements, sortable column headers, accordion headers, pagination controls, any `<button>` or `<a>` whose label/class suggests a view switch or data filter.

For each found, verify a JS event handler exists (`onclick`, `addEventListener`, or a named function called from `renderScreen()`).

Report:
```
Functional coverage:
  {screen}.html — {N}/{M} widgets interactive {✓ | ⚠ missing: {list}}
```

If any widget lacks a handler: generate the missing handler inline before writing. Do not write a file with passive interactive-looking elements.

After all files pass:
```
✓ Functional coverage complete — {N} widgets verified across {M} files
```

---

### Step 8 — Tracking

Display: `[Step 8 of 9]`

Write tracking documents following the exact formats in `{skill-root}/session-tracking.md`:

- `{output_dir}/docs/specs.md` — always fully rewritten; includes current screen list, roles, use case count, platform, and status
- `{output_dir}/docs/changelog.md` — new entry prepended; existing entries preserved
- `{output_dir}/.prototype-session.json` — always fully overwritten; `files_written` lists all written screen files; includes `snapshot`, `last_run`, and `last_increment` fields; `snapshot.fr_list[]` stores extracted FRs from Step 3; `snapshot.scenarios[]` stores confirmed scenarios from Step 6; `last_run.aux_docs[]` stores the filenames of all aux docs read (for patch-mode change detection)

---

### Step 9 — Finalize

Display: `[Step 9 of 9]`

**Confirmation block:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Prototype generated: {prototype_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform:    {web | mobile}
Mode:        {Full rebuild | Patch}

Files written:
  {output_dir}/login.html
  {output_dir}/{screen}.html  × {N}
  {output_dir}/docs/specs.md
  {output_dir}/docs/changelog.md
  {output_dir}/.prototype-session.json

Use cases:   {N} total
State panel: floating — on every screen
Functional:  {N} widgets verified across {M} files

Invoke again with:
  /prototype-build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Dev-ready flag (full rebuild only):**

Ask:
> Mark as dev-ready? This sets `Status: READY FOR DEV` in `docs/specs.md`. (y/n)

- **y** → update the `Status:` line in `docs/specs.md` to `READY FOR DEV — {date}`. Append `↳ Marked as dev-ready.` to the current run entry in `docs/changelog.md`.
- **n** → status stays `IN PROGRESS`.

In patch mode: do not ask — status inherits from existing `docs/specs.md`.

**Increment snapshot (always — full rebuild and patch):**

Ask:
> Create a dev increment snapshot? (y/n)

- **y** →
  1. Derive N: `prior_session.last_increment.number + 1` if set; otherwise N = 1
  2. Collect change scope: gather `runs[]` entries since `prior_session.last_increment.date` (or all runs if null)
  3. Write `{output_dir}/docs/increments/increment-{N}-{date}.md` per format in `{skill-root}/session-tracking.md`
  4. Update `.prototype-session.json`: set `last_increment = { "number": N, "date": "{date}", "file": "docs/increments/increment-{N}-{date}.md" }`
  5. Append `↳ Increment {N} snapshot created.` to current run entry in `docs/changelog.md`
  6. Confirm: `✓ Increment {N} written: docs/increments/increment-{N}-{date}.md`
- **n** → proceed.

**Browser launch:**

Ask:
> Would you like me to open the prototype in your browser?

If yes, open `{output_dir}/login.html`:
- macOS: `open {output_dir}/login.html`
- Windows: `start {output_dir}/login.html`
- Linux: `xdg-open {output_dir}/login.html`

```
✓ Prototype open: {output_dir}/login.html
  All screens in: {output_dir}/
```
