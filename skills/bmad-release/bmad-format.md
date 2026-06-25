# BMAD Output Format

Reference for bmad-exporter: output folder structure, config variable tiers, and invocation. For full format details see `bmad-workflow.md` (workflow skills) and `bmad-module.md` (modules).

---

## Output folders

BMAD exporter writes to two separate output folders:

```
{bmad_workflow_output_folder}/       ← from _bmad/config.yaml (default: _platforms/bmad/workflows)
  {skill-name}/
    SKILL.md                         ← main skill definition (required)
    customize.toml                   ← workflow customization surface (required)
    references/                      ← markdown reference docs loaded at runtime
    assets/                          ← templates, static files, examples
    scripts/                         ← Python scripts for automation

{bmad_module_output_folder}/         ← from _bmad/config.yaml (default: _platforms/bmad/modules)
  {module-code}-setup/
    SKILL.md                         ← setup skill (installs config, creates directories)
    assets/
      module.yaml
      module-help.csv
    scripts/
      merge-config.py
      merge-help-csv.py
      cleanup-legacy.py
```

Override keys in `_bmad/config.yaml`:
- `bmad_workflow_output_folder` — where transformed workflow skills are written
- `bmad_module_output_folder` — where module scaffold folders are written

→ Full SKILL.md format, customize.toml schema, On Activation pattern, references/ vs assets/ roles: `bmad-workflow.md`
→ Full module.yaml schema, module-help.csv, setup skill structure: `bmad-module.md`

---

## Config variables — two tiers

**Tier 1 — BMAD core config** (`_bmad/core/config.yaml`, managed by BMAD installer):

Standard variables resolved in `## On Activation` step 3. Referenced as `{var_name}` (no `workflow.` prefix):

| Variable | Default | Description |
|---|---|---|
| `user_name` | null | User's name for personalized messages |
| `communication_language` | system/user intent | Language for all communications |
| `document_output_language` | system/user intent | Language for generated document content |
| `output_folder` | `{project-root}/output` | Default output folder |
| `project_name` | null | Project name |
| `date` | current date | Today's date |

**Tier 2 — Skill-specific config** (`customize.toml [workflow]`, per skill):

`Constant` and `Derived` inputs from the source skill map here. Referenced throughout SKILL.md body as `{workflow.var_name}` (with `workflow.` prefix). User overrides go in `_bmad/custom/{skill-name}.user.toml`.

```toml
[workflow]
default_hours_per_day = "8"
governance_output_path = "{skill-root}/governance.md"
```

Referenced in SKILL.md as `{workflow.default_hours_per_day}`, `{workflow.governance_output_path}`, etc.

---

## Invocation

Once installed, BMAD skills are invoked by typing the skill name in the IDE chat panel:

```
roadmap-build
team-governance
```
