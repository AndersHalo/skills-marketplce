# platforms/bmad.yaml — Schema Reference

Source of truth for all BMAD exports. Edit this file to declare workflows and modules, then run `/bmad-release` to generate output files and push a PR to the BMAD repo.

---

## Top-level structure

```yaml
workflows:
  {skill-name}:       # key = skill directory name in skills/
    ...               # workflow-level properties

modules:
  {module-code}:      # key = 2–4 lowercase letters
    ...               # module-level properties
    skills:
      - skill: {skill-name}   # must be a key in workflows above
        preceded-by: ...
        followed-by: ...
```

**Validation rule:** a skill referenced in `modules[].skills[].skill` that is not declared as a key in `workflows` is silently skipped at export time. This lets you declare module ordering without committing to exporting a specific workflow yet.

---

## workflows fields

Each key is the skill directory name. The value holds all properties that go into `module-help.csv` plus release tracking.

| Field | Required | Notes |
|---|---|---|
| `released_version` | ⬜ | Null until first release. Set automatically by `/bmad-release`. |
| `display-name` | ⬜ | Label shown in BMAD menus. Auto-inferred from skill name if absent. |
| `menu-code` | ⬜ | 1–3 uppercase letters, unique within the module (e.g. `RB`). Auto-inferred if absent. |
| `description` | ⬜ | One-sentence description for routing and menus. Falls back to skill frontmatter. |
| `action` | ⬜ | Capability name invoked in BMAD (e.g. `build-roadmap`, `configure`). Auto-inferred if absent. |
| `args` | ⬜ | Args in `{name: description}\|{name: description}` format. Optional args use `-` prefix or `[]` in description. |
| `phase` | ⬜ | BMAD phase. See phase table below. Auto-inferred if absent. |
| `required` | ⬜ | `true` if mandatory in the module. Default: `false`. |
| `output-location` | ⬜ | Config var name or relative path where output lands. |
| `outputs` | ⬜ | What this skill produces — file patterns or short descriptions. |

### Valid BMAD phases

| Value | When to use |
|---|---|
| `1-analysis` | Research, discovery, brief, market/domain/technical analysis |
| `2-planning` | PRD, product requirements, roadmap, planning documents |
| `3-solutioning` | Architecture, technical design, UX, epics, system design |
| `4-implementation` | Stories, sprints, coding, dev tasks, QA, review, retrospective |
| `anytime` | Utilities, audits, setup/config, helper skills |

### args format

```
{prd_path: path to PRD}|{-H: headless mode}
```

Each `{name: description}` separated by `|`. Optional args use `-` prefix or square brackets.

---

## modules fields

Each key is the module code (2–4 lowercase letters). The value holds module-level properties and skill references.

| Field | Required | Notes |
|---|---|---|
| `module_name` | ✅ | Human-friendly display name |
| `module_description` | ✅ | One-line summary |
| `approach` | ⬜ | `setup-skill` (2+ skills, dedicated setup installer) or `standalone` (1 skill, self-registering). Inferred from skill count if absent. |
| `module_version` | ⬜ | Starting version written to `module.yaml`. Default: `"1.0.0"`. Patch-bumped on each release. |
| `default_selected` | ⬜ | Whether module is pre-selected in the BMAD installer. Default: `false`. |
| `module_greeting` | ⬜ | Message shown after setup completes. Auto-generated if absent. |
| `released_version` | ⬜ | Null until first release. Set automatically by `/bmad-release`. |
| `skill_versions` | ⬜ | Per-skill version snapshot at last release. Set automatically by `/bmad-release`. |

### modules[].skills[] fields

| Field | Required | Notes |
|---|---|---|
| `skill` | ✅ | Must match a key in `workflows`. Skipped at export if not declared. |
| `preceded-by` | ⬜ | Skills that must run BEFORE this one. Format: `skill:action` or `skill-a:action-a\|skill-b:action-b`. Use `~` for none. |
| `followed-by` | ⬜ | Skills recommended AFTER this one. Same format. Use `~` for none. |

### preceded-by / followed-by format

```
roadmap-build:build-roadmap                           # single dependency
team-governance:configure|roadmap-build:build-roadmap  # multiple, pipe-separated
```

---

## Generated output structure

### Workflow (standalone or per-skill in a module)

```
workflows/{skill-name}/
  SKILL.md           — BMAD-format skill (sections mapped from source steps)
  customize.toml     — standard BMAD config + skill-specific vars
  references/        — aux files with rules, checklists, reference tables
  assets/            — aux files with templates, examples
  references/headless.md  — stub if source has 3+ steps
```

### Module — setup-skill approach

```
modules/{module-code}-setup/
  SKILL.md           — setup installer (from template)
  assets/
    module.yaml      — module identity, config vars, workflows list
    module-help.csv  — 13-column registry of all bundled skills
  scripts/
    merge-config.py
    merge-help-csv.py
    cleanup-legacy.py
workflows/{skill-name}/    — one per bundled skill (same as standalone workflow)
  ...
```

### Module — standalone approach (1 skill only)

```
workflows/{skill-name}/
  SKILL.md           — includes self-registration check in On Activation
  customize.toml
  assets/
    module.yaml
    module-help.csv
    module-setup.md  — self-registration reference
  scripts/
    merge-config.py
    merge-help-csv.py
```

---

## module.yaml generated fields

`/bmad-release` generates `module.yaml` from the module declaration. Fields:

| Field | Source |
|---|---|
| `code` | `modules` key |
| `name` | `module_name` |
| `description` | `module_description` |
| `module_version` | `module_version` (bumped on each release) |
| `default_selected` | `default_selected` (default: `false`) |
| `module_greeting` | `module_greeting` or auto-generated |
| `workflows` | list of effective skill names |
| `agents` | auto-detected from each skill's `[agent]` block in customize.toml |

---

## module-help.csv column order (13 columns)

```
module, skill, display-name, menu-code, description, action, args,
phase, preceded-by, followed-by, required, output-location, outputs
```

Values are merged from two sources:
- **Base** — `workflows[skill]` properties (columns 3–9, 11–13)
- **Module ordering** — `modules[code].skills[i].preceded-by` and `followed-by` (columns 9–10)
- **Auto-inferred** — any field still empty is filled using detection rules from `bmad-mapping.md`

---

## Example

```yaml
workflows:
  roadmap-build:
    released_version: null
    display-name: Roadmap Builder
    menu-code: RB
    description: Generate a product roadmap from a PRD with effort estimates
    action: build-roadmap
    args: "{prd_path: path to PRD}|{-H: headless}"
    phase: 2-planning
    required: false
    output-location: docs/roadmap
    outputs: roadmap.md

modules:
  hpp:
    module_name: "Halo Product Module"
    module_description: "Product toolkit for planning and prototyping."
    approach: setup-skill
    module_version: "1.0.0"
    default_selected: false
    module_greeting: "Welcome! Run hpp-setup again anytime to reconfigure."
    released_version: null
    skill_versions: {}
    skills:
      - skill: roadmap-build
        preceded-by: ~
        followed-by: "prototype-build:build-prototype"
      - skill: prototype-build
        preceded-by: "roadmap-build:build-roadmap"
        followed-by: ~
```
