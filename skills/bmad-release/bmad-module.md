# BMAD Module Reference

Complete reference for building, structuring, and distributing BMAD modules. Covers both module types, all schema fields, config variable types, dependency chaining, agent roster, and distribution.

---

## Module types — decide first

A module packages one or more skills with a shared config installer. There are two structural approaches:

### Multi-skill module (setup skill)

Use when packaging **2 or more skills** together. A dedicated `-setup` skill handles installation for all of them.

```
{module-code}-setup/          ← setup skill (installs config, registers capabilities)
  SKILL.md
  assets/
    module.yaml
    module-help.csv
  scripts/
    merge-config.py
    merge-help-csv.py
    cleanup-legacy.py
{skill-1}/                    ← workflow output folder
  SKILL.md
  customize.toml
{skill-2}/
  SKILL.md
  customize.toml
```

### Standalone module (self-registering)

Use when packaging a **single skill**. No separate setup skill — the skill registers itself on first run (or when invoked with `setup`/`configure`).

```
{skill-name}/
  SKILL.md                    ← main skill — includes registration check in On Activation
  assets/
    module.yaml
    module-help.csv
    module-setup.md           ← self-registration reference (loaded on first run / setup arg)
  scripts/
    merge-config.py
    merge-help-csv.py
../.claude-plugin/
  marketplace.json            ← distribution manifest (for publishing)
```

**Decision rule:** single skill → standalone. Multiple skills → setup skill. If the user overrides, respect their choice.

---

## Module code convention

- **2–4 lowercase letters only** — no hyphens, no numbers (e.g. `rp`, `bmb`, `cis`, `hpp`)
- Drives all skill naming: `{module-code}-{skill-name}` (e.g. `rp-roadmap-build`)
- `bmad-` prefix is reserved for official BMad creations
- Changing the code after naming skills requires a find-and-replace across the entire module

---

## module.yaml — full schema

Located at `assets/module.yaml` (in setup skill or skill root for standalone).

```yaml
code: rp                        # 2–4 lowercase letters — module identifier
name: "Resource Planner"        # human-friendly display name
description: "One-line summary of what the module does"
module_version: 1.0.0           # use module_version, NOT version
default_selected: false

module_greeting: >              # displayed after setup completes
  Welcome to Resource Planner! Run this setup again anytime to reconfigure.

# ── Config variables ──────────────────────────────────────────────────────────
# Defined as top-level keys (NOT under a `variables:` section)
# Skills reference these as {workflow.var_name} via customize.toml

# Text input (default type):
output_dir:
  prompt: "Where should output files be saved?"
  default: "{output_folder}/resource-planner"
  result: "{project-root}/{value}"    # optional — transforms user answer before storing
  required: true                       # optional — blocks setup if empty
  regex: "^[a-z0-9/_-]+$"            # optional — validation pattern
  example: "e.g. output/rp"           # optional — hint shown below default
  user_setting: true                   # optional — written to config.user.yaml (not config.yaml)

# Single-select (constrained choice list):
default_format:
  prompt: "Default roadmap format?"
  single-select:
    - value: now-next-later
      label: "Now / Next / Later"
    - value: gantt
      label: "Gantt chart"
    - value: okr
      label: "OKR-based"

# Multi-select (checkboxes, answer is an array):
enabled_phases:
  prompt: "Which phases to enable?"
  multi-select:
    - value: analysis
      label: "Analysis"
    - value: planning
      label: "Planning"
    - value: implementation
      label: "Implementation"

# Confirm (boolean Yes/No):
enable_estimates:
  prompt: "Include AI effort estimates?"
  default: false

# ── Directories ───────────────────────────────────────────────────────────────
directories:                    # created on disk at install time
  - "{output_dir}"
  - "{output_dir}/reports"

# ── Post-install notes ────────────────────────────────────────────────────────
post-install-notes: |           # shown after setup (can be plain string or conditional)
  Add your Jira credentials to config.user.yaml to enable ticket sync.

# ── Workflows ─────────────────────────────────────────────────────────────────
workflows:                      # workflow folder names (from bmad-workflows-path) to install
  - roadmap-build               # alongside this module; omit if no workflows required
  - prototype-build

# ── Agent roster (only for modules with agent personas) ───────────────────────
agents:
  - code: analyst               # matches skill basename after module prefix
    name: Mary                  # leave "" if named at first activation
    title: Business Analyst
    icon: "📊"
    description: "Evidence-grounded business analyst and requirements expert."
```

**Fields NOT in real module.yaml:** `version` (use `module_version`), `skills:` array.

**`workflows:`** — optional list of workflow folder names (relative to `bmad-workflows-path`) that must be installed alongside this module. The installer reads this field and only installs the listed workflows. If absent, no workflows are installed.

**`user_setting: true`** — values marked this way are written to `config.user.yaml` (gitignored, personal) instead of `config.yaml` (shared, committed). Use for: `user_name`, `communication_language`, API keys, personal paths.

---

## module-help.csv — full schema

Located at `assets/module-help.csv`. Has exactly **13 columns** in this order:

| Column | Description | Required |
|---|---|---|
| `module` | Module code — same value for every row in the file | yes |
| `skill` | Skill folder name (e.g. `rp-roadmap-build`) | yes |
| `display-name` | Human-readable label shown in menus | yes |
| `menu-code` | 1–3 uppercase letter shortcut, unique within the module (e.g. `RB`, `IM`) | yes |
| `description` | One-sentence description for users and LLM routing | yes |
| `action` | Capability/action name within the skill (e.g. `build-roadmap`, `configure`) | yes |
| `args` | Arguments in `{arg: description}` format, `\|`-separated | no |
| `phase` | BMAD phase or `anytime` (see phase table below) | yes |
| `preceded-by` | Skills that must run BEFORE this — format `skill:action`, `\|`-separated | no |
| `followed-by` | Skills recommended AFTER this — format `skill:action`, `\|`-separated | no |
| `required` | `true` if mandatory; `false` if optional | yes |
| `output-location` | Config var name or path where output lands | no |
| `outputs` | What this produces — file patterns or short descriptions | no |

**Valid BMAD phases:**

| Phase | When to use |
|---|---|
| `1-analysis` | Research, discovery, brief, market/domain/technical analysis |
| `2-planning` | PRD, product requirements, roadmap, planning documents |
| `3-solutioning` | Architecture, technical design, UX, epics, system design |
| `4-implementation` | Stories, sprints, coding, dev tasks, QA, review, retrospective |
| `anytime` | Utilities, audits, setup/config, helper skills |

**`preceded-by` / `followed-by` format:**

```
skill:action                          ← single dependency
skill-a:action-a|skill-b:action-b    ← multiple, pipe-separated
```

A skill can appear in both `preceded-by` and `followed-by` with different actions (e.g., `build-process` must precede, `quality-analysis` follows).

**`args` format:**

```
{-H: headless mode}|{path: skill to analyze}|{description: initial concept}
```

Each `{name: description}` separated by `|`. Optional args use `-` prefix or square brackets in description.

**Example rows:**

```csv
module,skill,display-name,menu-code,description,action,args,phase,preceded-by,followed-by,required,output-location,outputs
rp,rp-roadmap-build,Build Roadmap,RB,Generate a product roadmap from PRD with effort estimates.,build-roadmap,{prd_path: path to PRD}|{-H: headless},2-planning,rp-prd-handoff:handoff,,false,output_dir,roadmap.md
rp,rp-roadmap-build,Validate Roadmap,VR,Check roadmap completeness and PRD alignment.,validate-roadmap,{path: roadmap to validate}|{-H: headless},2-planning,rp-roadmap-build:build-roadmap,,false,output_dir,validation-report.md
rp,rp-setup,Setup Resource Planner,SU,Install or reconfigure the Resource Planner module.,configure,{-H: headless mode}|{inline values: skip prompts},anytime,,,false,{project-root}/_bmad,config.yaml
```

---

## Standalone module — self-registration

For single-skill modules, self-registration replaces the setup skill. The main `SKILL.md` must include a registration check in `## On Activation`:

**If the skill has no existing first-run init:**

```markdown
Check if `{project-root}/_bmad/config.yaml` contains a `{module-code}` section.
If not — or if user passed `setup` or `configure` — load `./assets/module-setup.md`
and complete registration before proceeding with normal activation.
```

**If the skill has a first-run init (e.g. agent with memory):** integrate registration into that init flow — the user gets module registration and skill initialization in a single experience.

The `./assets/module-setup.md` reference handles:
1. Reading `module.yaml` for identity and config variables
2. Checking for existing config (fresh install vs. reconfiguration)
3. Collecting user preferences (same table format as setup skill)
4. Running `merge-config.py` and `merge-help-csv.py` in parallel
5. Creating output directories
6. Displaying `module_greeting`

Scripts used by standalone modules: `merge-config.py`, `merge-help-csv.py` (same scripts as setup skill, no `cleanup-legacy.py` needed).

---

## Agent roster — when to populate

Add `agents:` to `module.yaml` only when skills in the module are agent personas (not plain workflows).

**Source:** read each skill's `customize.toml` for an `[agent]` block:

```toml
[agent]
code = "analyst"
name = "Mary"
title = "Business Analyst"
icon = "📊"
description = "Evidence-grounded business analyst."
```

If `customize.toml` is absent (older skill), reconstruct from SKILL.md: `code` from folder basename (strip module prefix), `title` from first `#` heading, `description` from frontmatter, ask user for `name` and `icon`.

**First-Breath-named agents:** if an agent's name is intentionally empty (`name: ""`), preserve the empty string — the user fills it in after first activation.

---

## Distribution — marketplace.json (standalone only)

Standalone modules include `.claude-plugin/marketplace.json` alongside the skill folder for distribution:

```json
{
  "name": "module-display-name",
  "version": "1.0.0",
  "description": "One-line description",
  "owner": "",
  "license": "MIT",
  "homepage": "",
  "repository": ""
}
```

Fill in `owner`, `homepage`, and `repository` before publishing. Multi-skill modules distribute via npm (BMAD installer) — marketplace.json is not generated for them.

---

## Config merge — how setup scripts work

Both `merge-config.py` and `merge-help-csv.py` use an **anti-zombie pattern**: existing entries for the module are removed before writing fresh ones. Stale values never persist across reinstalls.

**`merge-config.py`** writes to two files:
- `{project-root}/_bmad/config.yaml` — shared project config (module section + root core keys)
- `{project-root}/_bmad/config.user.yaml` — personal settings (`user_name`, `communication_language`, `user_setting: true` vars)

**`merge-help-csv.py`** merges module-help.csv rows into `{project-root}/_bmad/module-help.csv`.

**`cleanup-legacy.py`** (setup skill only) removes legacy `_bmad/{module-code}/` directories after migration. Verifies skills exist at `.claude/skills/` before removing anything.

**Path token rule:** `{project-root}` is a literal token in config *values* — never substitute it in the data written to config files. But script CLI arguments (`--config-path`, `--target`, `--bmad-dir`) require the real filesystem path.

---

## Skill naming convention

All skills in a module use the pattern `{module-code}-{skill-name}`:
- `rp-roadmap-build`
- `rp-prd-handoff`
- `rp-setup`

Agent skills: `{module-code}-agent-{name}` or `{module-code}-{name}` (both are recognized).
`bmad-` prefix is reserved for official BMad org skills.

---

## Validation checklist

Before distributing a module, verify:

- [ ] `module.yaml` has `code`, `name`, `description`, `module_version`
- [ ] `module.yaml` `code` is 2–4 lowercase letters
- [ ] Every skill in the module has a row in `module-help.csv`
- [ ] `menu-code` values are unique within the module
- [ ] `preceded-by`/`followed-by` references use `skill:action` format and reference real skills
- [ ] `action` values match actual capability names in the referenced skills
- [ ] `required: true` rows are only blocking gates (not convenience features)
- [ ] All path variables use `{project-root}` token (not hardcoded paths)
- [ ] Standalone modules have `assets/module-setup.md` and both merge scripts
- [ ] Setup skills have all 3 scripts (`merge-config.py`, `merge-help-csv.py`, `cleanup-legacy.py`)
- [ ] `module_greeting` is present and friendly
- [ ] `workflows:` lists all workflow folder names required by the module (omit only if truly none needed)
