# session-tracking

Format definitions for the four tracking documents written after each prototype generation run. Used by prototype-build in Steps 8 and 9.

---

## docs/specs.md

Written to `{output_dir}/docs/specs.md` after every run. Always fully rewritten from in-memory values — never derived from existing files, the changelog, or prototype source files.

```markdown
# {prototype_name} — Specs
Status: {IN PROGRESS | READY FOR DEV — {date}}
Last updated: {ISO date}   PRD: {prd_filename}   Stack: HTML + CSS + Vanilla JS   Platform: {web | mobile}   Mode: {Full rebuild | Patch}

## Screens
| Route | Screen | Sub-views | FRs implemented |
|---|---|---|---|
| #{route} | {ScreenName} | {sub-view list or "—"} | {FR numbers from PRD} |

## Data schema
\`\`\`ts
{TypeScript interfaces for all confirmed entities, with all fields and union types}
\`\`\`

## Roles & permissions
| Role | Can see | Cannot access |
|---|---|---|
| {role} | {screens/data visible} | {screens/data restricted} |

## States per screen
| Screen | States |
|---|---|
| {ScreenName} | loading, empty, error, default{, domain-specific states} |

## Use cases
| ID | Screen | Role | State |
|---|---|---|---|
| {screen}_{role}_{state} | {Screen} | {Role} | {State} |

## User flows
{numbered list of flows from Step 4 — each flow as a sequence of screens}
1. {Flow name}: {Screen A} → {Screen B} → {Screen C}

## Dependencies
CDN only — no package.json. Libraries loaded in each screen file:
- Tailwind CSS (CDN)
{- Chart.js (CDN)}
{- {extra_libs[]} (CDN)}
```

**Rules:**
- `Status` line is the first editable field — written as `IN PROGRESS` by default; changed to `READY FOR DEV — {date}` only when user confirms dev-ready in Step 12.
- Do not copy content from the existing `docs/specs.md` — always regenerate from in-memory values.
- If `run_mode = "patch"`, specs.md still reflects the full current state (not just what changed).

---

## docs/changelog.md

Written to `{output_dir}/docs/changelog.md` after every run. New entries are **prepended** — most recent run at the top. Existing entries are never edited or removed.

**First run (file does not exist):**
```markdown
# {prototype_name} — Changelog

## {ISO date} — Full rebuild
PRD: {prd_filename}
Platform: {web | mobile}
Screens: {comma-separated screen list}
Entities: {comma-separated entity list}
Roles: {comma-separated role list}
Use cases: {N}
Files written: {N} screen files + {N} tracking docs
```

**Subsequent Full rebuild run:**
```markdown
## {ISO date} — Full rebuild
PRD: {prd_filename}
Platform: {web | mobile}
Screens: {comma-separated screen list}
Entities: {comma-separated entity list}
Roles: {comma-separated role list}
Use cases: {N}
Files written: {N} screen files + {N} tracking docs
```

**Patch run:**
```markdown
## {ISO date} — Patch
PRD: {prd_filename}
Added screens: {list or "none"}
Changed screens: {list or "none"}
Removed screens: {list or "none"}
Changed entities: {list or "none"}
Use cases: {N total}
Files written: {changed screen files} (patched) + {N} tracking docs
```

**Dev-ready annotation** (appended inline after the run entry, same date):
```markdown
↳ Marked as dev-ready.
```

**Increment annotation** (appended inline after the run entry, or after the dev-ready line):
```markdown
↳ Increment {N} snapshot created.
```

---

## .prototype-session.json

Written to `{output_dir}/.prototype-session.json` after every run. Always fully overwritten.

```json
{
  "last_run": {
    "date": "{ISO date}",
    "prd": "{prd filename only, not full path}",
    "mode": "{full | patch}",
    "files_written": ["login.html", "{screen}.html", "...", "docs/specs.md", "docs/changelog.md"]
  },
  "last_increment": {
    "number": 1,
    "date": "{ISO date}",
    "file": "docs/increments/increment-1-{date}.md"
  },
  "snapshot": {
    "screens": ["{screen name}", "..."],
    "entities": ["{entity name}", "..."],
    "roles": ["{role name}", "..."],
    "platform_type": "{web | mobile}",
    "states": {
      "{screen name}": ["{state}", "..."]
    },
    "fr_list": [
      { "id": "FR-012", "description": "{requirement text}", "screen_hint": "{screen name or null}" }
    ],
    "scenarios": [
      {
        "key": "{scenario_key}",
        "label": "{Scenario label}",
        "role": "{role}",
        "screen": "{screen name}",
        "frs": ["{FR-id}"]
      }
    ]
  },
  "runs": [
    {
      "date": "{ISO date}",
      "prd": "{prd filename}",
      "mode": "{full | patch}",
      "files_written": ["login.html", "{screen}.html", "...", "docs/specs.md", "docs/changelog.md"]
    }
  ]
}
```

**Rules:**
- `last_run` always reflects the current run.
- `last_increment` is `null` if no increment has been created yet; updated each time an increment snapshot is created.
- `snapshot` always reflects the current confirmed state — used by the next run's patch diff in Step 4.
- `runs[]` is prepended — most recent run at index 0. All prior runs are preserved.
- `prd` stores only the filename (e.g. `my-app-prd.md`), not the full path.
- `platform_type` carries forward into subsequent patch runs — do not reset unless the user explicitly changes it.

---

## docs/increments/increment-{N}-{date}.md

Written to `{output_dir}/docs/increments/` when the user answers `y` to "Create a dev increment snapshot?" in Step 12. This is the shareable artifact sent to developers.

**Increment N derivation:**
- N = `prior_session.last_increment.number + 1` if `prior_session.last_increment` is non-null.
- N = 1 if `prior_session.last_increment` is null (first increment ever).
- Never count files in the directory — always derive from `last_increment.number`.

**Format:**
```markdown
# {prototype_name} — Increment {N}
Date: {ISO date}   PRD: {prd_filename}   Stack: HTML + CSS + Vanilla JS   Platform: {web | mobile}

## What changed in this increment
{Bulleted list of runs since the previous increment (using last_increment.date from .prototype-session.json).
 If no prior increment exists, include all runs.
 Each bullet = one run:}
- {ISO date} ({Full rebuild | Patch}): {key changes — screens added/changed/removed, entities changed, use cases count}

## Screens
{copy the Screens table from current in-memory values — same as specs.md}

## Data schema
{copy the Data schema block from current in-memory values}

## Roles & permissions
{copy Roles & permissions table from current in-memory values}

## States per screen
{copy States per screen table from current in-memory values}

## Use cases
{copy Use cases table from current in-memory values}

## User flows
{copy User flows list from current in-memory values}

## Dependencies
{copy Dependencies block from current in-memory values}
```

**Rules:**
- File name: `increment-{N}-{date}.md` where N is derived per the rule above; date = ISO date of this run.
- "What changed" derives from `runs[]` in `.prototype-session.json` — include runs since `last_increment.date`, or all runs if `last_increment` is null.
- All sections below "What changed" are regenerated from in-memory values, not copied from `docs/specs.md` on disk.
- Never overwrite an existing increment file.
