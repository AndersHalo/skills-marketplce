---
name: bmad-release
description: Transforms skills declared in platforms/bmad.yaml into BMAD workflows and modules. Releases version updates and re-transforms existing entries via GitHub PR. The declaration file is the source of truth — no interactive wizard for skill selection.
---

# BMAD Release

Transforms skills declared in `platforms/bmad.yaml` into BMAD workflows and modules. Releases version updates and re-transforms existing entries via GitHub PR to the BMAD repo — no clone required. `platforms/bmad.yaml` is the source of truth for what gets published.

## On Activation

1. Try to read `{skill-root}/defaults.md`. If found, parse each line as `{key}: {value}` and store in-memory as overrides. Built-in default:
   - `bmad-repo-url: https://github.com/AndersHalo/halo-BMAD`

2. **Session check:** Read `{skill-root}/session.json` as a JSON object (use `{}` if missing or invalid). Collect all entries, sort by most recent first (reverse insertion order), take up to 3 → `recent_sessions[]`. If any active entry exists (no `completed: true`):

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Recent sessions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     {N}. {work_queue summary or intent}   step {step}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   Ask: `Resume (1–{N}) or start new?`
   - **Number** → load stored values from that entry; set `active_session_key`; jump to stored `step`.
   - **Start new** → remove all `completed: true` entries (remove pattern); generate new session ID; continue.

3. Read `{skill-root}/welcome.md` in full and display it.

4. At any point, if the user says "change defaults":

   | Setting | Current value | Description |
   |---|---|---|
   | `bmad-repo-url` | `{bmad-repo-url}` | GitHub URL of the BMAD registry repo |

   After each change: update in-memory, persist to `{skill-root}/defaults.md`, echo `✓ {name} → {new-value}`. Then continue.

5. Proceed directly to Step 1.

**Session write/remove patterns (apply throughout this skill):**
- **Write:** read `{skill-root}/session.json` as object (use `{}` if missing); set `object[session_id]` to current state; write full object back.
- **Remove:** read object; delete `object[session_id]`; write full object back.

---

## How to invoke

`/bmad-release`

---

## Behavior

### Step 1 — Load reference files and validate bmad.yaml

**[Step 1 of 7]**

Read the following files in full before doing anything else. `bmad-module.md` is loaded lazily — it will be read when a module transform is first encountered in Step 4. `bmad-schema.md` documents the full schema for `platforms/bmad.yaml`.

- `{skill-root}/bmad-format.md` — BMAD output format specification and section structure rules
- `{skill-root}/bmad-workflow.md` — Rules for generating BMAD workflow SKILL.md and customize.toml
- `{skill-root}/bmad-mapping.md` — Mapping rules from Claude Code SKILL.md elements to BMAD conventions
- `{skill-root}/bmad-schema.md` — Full schema reference for `platforms/bmad.yaml`

Use the mandatory read loop for each:

```
offset = 0; chunks = []
loop:
  read file at offset, limit=200
  append to chunks
  if result < 200 lines → EXIT loop
  else → offset += 200, continue
content = join(chunks)
```

If any file cannot be read, stop with:
> ⚠ Could not read `{filename}` at `{skill-root}`. Check the path and try again.

**Read `platforms/bmad.yaml`** using the mandatory read loop. Parse as two maps:
- `workflows` — keyed by skill name, value = `{ released_version }`
- `modules` — keyed by module_code, value = `{ module_name, module_description, approach, released_version, skill_versions, skills[] }`

If both maps are empty or absent:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  platforms/bmad.yaml has no entries yet.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Edit platforms/bmad.yaml to declare skills. Example:

  workflows:
    my-skill:
      released_version: null

  modules:
    myc:
      module_name: "My Module"
      module_description: "Description"
      approach: setup-skill
      skills:
        - skill: my-skill
          module-help: { ... }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

End here if nothing found.

**Validate entries:**
- Each key in `workflows` → verify `skills/{skill-name}/SKILL.md` exists. If missing → warn and skip that key.
- Each key in `modules` → for each `s` in `module.skills[]`, check that `s.skill` is a key in `workflows`. If not → warn: `⚠ "{s.skill}" in module "{module_code}" is not declared in workflows — skipping from module export.` Remove from the module's effective skill list.
- After filtering, if a module's effective skill list is empty → warn and skip that module entirely.
- `approach` absent on a module → infer: 1 effective skill → `standalone`; 2+ → `setup-skill`.

**Property split:** `workflows[skill]` holds ALL workflow-level properties (display-name, menu-code, description, action, args, phase, required, output-location, outputs, released_version). The module skill ref `{ skill, preceded-by, followed-by }` holds ONLY the module-specific ordering overrides. When building module-help.csv, merge both: base from `workflows[s.skill]`, ordering from the module ref.

Generate a session ID (e.g. `sess-a3f9k2`, 6 chars from `a-z0-9`). Write checkpoint:
```json
{ "step": "1", "owner": null, "repo": null, "work_queue": [], "pr_url": null }
```

---

### Step 2 — Intent

**[Step 2 of 7]**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ▸ BMAD Release
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Release    — detect version changes and push updates for declared entries
  2. Transform  — re-generate BMAD files for a declared entry without bumping version
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To add or remove entries, edit platforms/bmad.yaml directly.
```

Parse owner and repo from `{bmad-repo-url}` by stripping `https://github.com/`. Store for use in all subsequent API calls. Write checkpoint: `{ "step": "2", "owner": "{owner}", "repo": "{repo}", "work_queue": [], "pr_url": null }`.

Proceed to the corresponding path.

---

### Step 3A — Release path

**[Step 3 — Release]**

**Run `npm run build:manifest`** to ensure the manifest reflects the latest skill versions before comparing:

```bash
npm run build:manifest
```

If this command fails, stop and report the output to the user.

Read `skills-manifest.json` using the mandatory read loop — source of truth for current `skill_version` per skill.

If `skills-manifest.json` cannot be read:
> ⚠ `npm run build:manifest` may have failed. Check for errors above.

For each entry in `workflows` and `modules` maps from bmad.yaml, compute release status:

**Workflow entries** (each key `skill_name` in `workflows`):
- Look up `skill_name` in skills-manifest.json → get `current_version`
- Compare with `workflows[skill_name].released_version`

| Condition | Status |
|---|---|
| Not found in skills-manifest.json | ⚠ warn — missing from manifest, skip |
| `released_version` absent or null | **new** |
| `current_version` ≠ `released_version` | **update** |
| `current_version` = `released_version` | up to date — skip |

**Module entries** (each key `module_code` in `modules`):
- Use the module's **effective skill list** (already filtered in Step 1 to only skills declared in `workflows`)
- For each `s.skill` in effective skills: look up `skill_version` in skills-manifest.json
- Compare each against `modules[module_code].skill_versions[s.skill]` (treat absent/null as "never released")
- If `modules[module_code].released_version` is absent or null → **new**
- If any skill's version differs from its `skill_versions` snapshot → **update**
- Otherwise → up to date — skip

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Release delta
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  new     martech-css      workflow
  update  halo-product     module     v1.0.0 → v1.0.1   (roadmap-build: 1.1.0→1.2.0)
  —       other-entry      (up to date)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{N} to release · {M} up to date
```

For module updates: show which constituent skill(s) changed in parentheses.

If nothing to release, end here. Otherwise ask:
`Proceed with all, or remove any? (Enter to proceed / list names to exclude)`

Store confirmed entries in `work_queue[]`:
- Workflow: `{ "type": "workflow", "skill": "{skill_name}", "current_version": "{v}", "released_version": "{v or null}" }`
- Module: `{ "type": "module", "module_code": "{key}", "module_name": "...", "module_description": "...", "approach": "...", "skills": [{effective list with module-help}], "current_skill_versions": {snapshot}, "released_version": "{v or null}" }` — `skills` contains only the effective list filtered in Step 1

Write checkpoint: `{ "step": "3A", "owner": "{owner}", "repo": "{repo}", "work_queue": {work_queue}, "pr_url": null }`. Proceed to Step 4.

---

### Step 3B — Transform path

**[Step 3 — Transform]**

Display all entries from `platforms/bmad.yaml`, grouped by section:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Declared in platforms/bmad.yaml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Workflows:
    1. martech-css    released: v1.0.0
    2. new-skill      (never released)
  Modules:
    3. hpp — Halo Product Module   released: v1.0.1
              skills: team-governance, roadmap-build, prototype-build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Show only the effective skill list per module (skills already filtered against `workflows` in Step 1).

Ask: `Which to re-transform? (numbers or names, comma-separated)`

Store selected entries in `work_queue[]` using the same shape as Step 3A. Write checkpoint: `{ "step": "3B", "owner": "{owner}", "repo": "{repo}", "work_queue": {work_queue}, "pr_url": null }`. Proceed to Step 4.

---

### Step 4 — Generate files

**[Step 4 of 7]**

If any entry in `work_queue[]` has `type: "module"` and `bmad-module.md` has not been loaded yet, load it now using the mandatory read loop.

Process one entry at a time from `work_queue[]`. For each entry:

---

#### 4A — Read source skill(s)

For each skill to process (single skill for workflow entries; each `s.skill` for module entries):

1. Read `skills/{skill-name}/SKILL.md` using the mandatory read loop.
2. Read `skills/{skill-name}/.skill-meta.json` — extract `skill_description`, `skill_version`, `skill_name`.
3. List `skills/{skill-name}/` — collect all `.md` files beyond SKILL.md as aux files.

From the source SKILL.md, extract:
- YAML frontmatter `name:` and `description:`
- All `### Step N — Title` headings → map each to a `## Title` BMAD section
- Count of `### Step` headings → used for headless.md decision (3+)
- Constant and Derived inputs from `## On Activation` → config var candidates

---

#### 4B — Fetch existing BMAD files

Attempt to fetch existing files to preserve user overrides:

```bash
# Workflow customize.toml (preserve existing config overrides):
gh api "repos/{owner}/{repo}/contents/workflows/{skill-name}/customize.toml" \
  --jq '.content' | base64 --decode

# Module module.yaml (setup-skill — to read current module_version):
gh api "repos/{owner}/{repo}/contents/modules/{module-code}-setup/assets/module.yaml" \
  --jq '.content' | base64 --decode

# Module module.yaml (standalone — same purpose):
gh api "repos/{owner}/{repo}/contents/workflows/{skill-name}/assets/module.yaml" \
  --jq '.content' | base64 --decode
```

If fetch fails (new file): use declared defaults. `module_version` logic:
- **Release path** — existing file found: bump patch (`1.0.1` → `1.0.2`). Not found: use `modules[code].module_version` from bmad.yaml (default `"1.0.0"`).
- **Transform path** — keep `module_version` unchanged.

---

#### 4C — Generate workflow files

For each skill (standalone workflow, or each `s.skill` in a module):

Output root: `workflows/{skill-name}/`

**`SKILL.md`** — apply `bmad-workflow.md` rules:
- YAML frontmatter: `name` (skill folder name) + `description` (one sentence, action verbs)
- `## Conventions` — per `bmad-workflow.md` Conventions section guidance
- `## On Activation` — standard BMAD activation steps per `bmad-workflow.md`
- One `## {Title}` section per mapped source step
- `## Finalize` — include only if the skill produces a human-readable document (PRD, roadmap, report, spec). Structure per `bmad-workflow.md` Finalize section.

**`customize.toml`** — apply `bmad-workflow.md` toml schema:
```toml
# DO NOT EDIT -- overwritten on every update.
[workflow]
activation_steps_prepend = []
activation_steps_append  = []
persistent_facts         = ["file:{project-root}/**/project-context.md"]
on_complete              = ""
doc_standards            = ["skill:bmad-editorial-review-structure", "skill:bmad-editorial-review-prose"]
finalize_reviewers       = []
external_sources         = []
external_handoffs        = []

# ── Skill-specific ────────────────────────────────────────────────────────────
{var-name} = "{default}"   # {description from source}
```
Omit `doc_standards` and `finalize_reviewers` if the skill has no `## Finalize` section. Include only config vars inferred from Constant/Derived inputs.

**`references/`** and **`assets/`** — route aux files per `bmad-mapping.md` subfolder rules:
- Rules, checklists, reference tables → `references/`
- Templates, examples, media → `assets/`
- Non-`.md` sources: wrap in fenced code block per `bmad-mapping.md` non-md wrapping rules.

**`references/headless.md`** — generate stub if source SKILL.md has 3+ `### Step` headings. Content: detection triggers + JSON response schema. Mark as `_{Fill in headless flow details before distributing.}_`.

---

#### 4D — Generate module files

*Module entries only. After 4C has produced workflow files for each bundled skill.*

**Module-help resolution** — for each `s` in `entry.skills[]`:

Build all 13 `module-help.csv` column values by merging in priority order:
1. `workflows[s.skill]` properties — `display-name`, `menu-code`, `description`, `action`, `args`, `phase`, `required`, `output-location`, `outputs` → mark as `(declared)`
2. Module ref overrides — `s.preceded-by`, `s.followed-by` → mark as `(declared)`
3. Auto-inference via detection rules in `bmad-mapping.md` for any field still absent → mark as `(inferred)`
4. Fixed: `module` = `entry.module_code`, `skill` = `s.skill` (always auto-set)

**Show preview** — display resolved values before generating files:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {module_code} — {module_name}  [{new | update | re-transform}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Approach: {setup-skill | standalone}
  Version:  {old} → {new}   (release path only)
  Files:
    {list of all output files}
  Module-help rows:
    {skill-name}: phase={phase} action={action} menu-code={menu-code}
                  preceded-by={value} followed-by={value}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OK? or describe adjustments:
```

- **OK / Enter** → proceed.
- **Adjustments** → apply in-memory, re-show. Repeat until OK.

**`module.yaml`** — generate per `bmad-module.md` full schema:

```yaml
code: {module_code}
name: "{module_name}"
description: "{module_description}"
module_version: {resolved_module_version}
default_selected: {default_selected}
module_greeting: >
  {module_greeting}
workflows:
  - {skill-name-1}
  - {skill-name-2}
  ...
agents:     # omit if no skills have an [agent] block in customize.toml
  - code: ...
    name: ...
    title: ...
    icon: ...
    description: ...
```

`agents:` — detect by scanning each skill's generated `customize.toml` for a `[agent]` block. If found, extract `code`, `name`, `title`, `icon`, `description`. Omit `agents:` entirely if no agent blocks found.

**`module-help.csv`** — one header row + one data row per effective skill in canonical column order:
```
module,skill,display-name,menu-code,description,action,args,phase,preceded-by,followed-by,required,output-location,outputs
```
Empty optional columns write as empty string (not `~`).

**For `approach: setup-skill`:**

Setup root: `modules/{module_code}-setup/`

- `assets/module.yaml` — write generated module.yaml
- `assets/module-help.csv` — write generated CSV
- `SKILL.md` — read `{skill-root}/assets/setup-skill-template.md`; replace `{module-code}`, `{Module Display Name}`, `{module-description}`, `{N}` (skill count) with actual values; write to `{setup-root}/SKILL.md`
- `scripts/merge-config.py`, `scripts/merge-help-csv.py`, `scripts/cleanup-legacy.py` — attempt to fetch verbatim from an existing module in the BMAD repo:
  ```bash
  gh api "repos/{owner}/{repo}/contents/modules/{any-existing-setup}/scripts/{script}" \
    --jq '.content' | base64 --decode
  ```
  If no existing module found: warn `⚠ Scripts not found in BMAD repo — add merge-config.py, merge-help-csv.py, cleanup-legacy.py to modules/{module_code}-setup/scripts/ manually.`

**For `approach: standalone`:**

Skill root: `workflows/{skill-name}/`

- `assets/module.yaml` — write generated module.yaml
- `assets/module-help.csv` — write generated CSV
- `assets/module-setup.md` — generate self-registration reference per `bmad-module.md` "Standalone module — self-registration" section; replace `{module-code}` and `{Module Display Name}` tokens
- `scripts/merge-config.py`, `scripts/merge-help-csv.py` — fetch or warn as above (no `cleanup-legacy.py` needed for standalone)
- Patch generated `SKILL.md` — insert registration check at the start of `## On Activation`:
  ```
  Check if `{project-root}/_bmad/config.yaml` contains a `{module-code}` section.
  If not — or if user passed `setup` or `configure` — load `./assets/module-setup.md`
  and complete registration before proceeding.
  ```

---

### Step 5 — Push PR to BMAD repo

**[Step 5 of 7]**

**Get current main SHA:**

```bash
gh api "repos/{owner}/{repo}/git/refs/heads/main" --jq '.object.sha'
```

**Create release branch** (use today's date; append counter if branch already exists):

```bash
gh api "repos/{owner}/{repo}/git/refs" \
  -X POST \
  -f ref="refs/heads/bmad-release-{YYYY-MM-DD}" \
  -f sha="{main-sha}"
```

**Write each file to the branch.** For each generated file, first check if it already exists (update requires its current SHA):

```bash
gh api "repos/{owner}/{repo}/contents/{path}?ref=bmad-release-{date}" \
  --jq '.sha' 2>/dev/null
```

Then write:

```bash
gh api "repos/{owner}/{repo}/contents/{path}" \
  -X PUT \
  -f branch="bmad-release-{date}" \
  -f message="chore: {entry-name} {new | update vX→vY | re-transform}" \
  -f content="$(printf '%s' '{file-content}' | base64)" \
  [-f sha="{existing-sha}"]   # include only if file already exists
```

After each file write: `  ✓ {path}`

If any write fails: ⚠ report the error and ask `Skip this file and continue, or abort?`

**Open PR:**

```bash
gh api "repos/{owner}/{repo}/pulls" \
  -X POST \
  -f title="bmad-release: {comma-separated entry names}" \
  -f body="## Entries released\n\n{table: entry | type | change}\n\nGenerated by /bmad-release." \
  -f head="bmad-release-{date}" \
  -f base="main"
```

Store `pr_url` from the response. Write checkpoint: `{ "step": "5", "owner": "{owner}", "repo": "{repo}", "work_queue": {work_queue}, "pr_url": "{pr_url}" }`.

---

### Step 6 — Update platforms/bmad.yaml

**[Step 6 of 7]**

Update `platforms/bmad.yaml` for all processed entries:

- **`workflows[skill_name]`, Release path** — set `released_version` to `current_version`
- **`modules[module_code]`, Release path** — set `released_version` to the new bumped version; set `skill_versions[s.skill]` to each effective skill's current version
- **Transform path** — no changes to `released_version` or `skill_versions`

Write the updated file to disk. Write checkpoint: `{ "step": "6", "owner": "{owner}", "repo": "{repo}", "work_queue": {work_queue}, "pr_url": "{pr_url}" }`.

---

### Step 7 — Confirm

**[Step 7 of 7]**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ BMAD release complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entries processed: {N}
  new              martech-css      workflow
  v1.0.0→v1.0.1   halo-product     module
  re-transformed   other-workflow   workflow

PR opened: {pr_url}
Merge when ready to publish to BMAD.

Updated: platforms/bmad.yaml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Mark session `completed: true` (write pattern). Scan for any other `completed: true` entry — remove the oldest one so at most 1 completed entry exists at a time.

**Completion menu:**

```
What's next?
  1. Check for more pending updates (Release)
  2. Re-transform an entry (Transform)
  3. Done
```

- **1** → return to Step 3A
- **2** → return to Step 3B
- **3** → end
