# BMAD Workflow Reference

Comprehensive reference for creating BMAD workflow skills. Source: official BMAD-METHOD repo (bmad-code-org/BMAD-METHOD, v6.8.0).

---

## Folder structure

Every BMAD workflow skill lives in its own folder:

```
{skill-name}/
  SKILL.md              ← required — LLM instructions and flow
  customize.toml        ← required for configurable skills; omit for trivial/utility skills
  references/           ← instruction modules loaded conditionally
  assets/               ← templates, schemas, HTML skeletons loaded as data
  scripts/              ← Python scripts invoked from SKILL.md
```

The folder name must exactly match the `name` field in `SKILL.md` frontmatter.

---

## SKILL.md format

### Frontmatter

```yaml
---
name: skill-folder-name
description: One sentence starting with action verbs. Use when {trigger condition}.
---
```

Only `name` and `description` — no other keys. Description ends with a "Use when..." clause for discovery tools.

### Body section order

```
# Skill Display Name

## Overview               ← optional; 1–2 sentences on purpose and when to use
## Conventions            ← path resolution rules and token semantics (not boilerplate — skill-specific)
## On Activation          ← standard numbered steps (see below)
## [Intent / Mode section] ← e.g. "## Intent Operating Modes", "## Detect Intent"
## [Main process sections] ← one ## per phase: Discovery, Planning, etc.
## Finalize               ← always present on workflow skills; ends with on_complete
```

Simple/utility skills (no persistent state, no templates) omit `## Conventions` and `## Finalize` and use fewer sections.

---

## `## Conventions` section

Not a fixed boilerplate — write it to match the skill's actual behavior. Always covers:

- **Path resolution rules** — what bare paths resolve from; what `{project-root}` means
- **Token semantics** — what `{workflow.<name>}` resolves to
- **File roles** — if the skill uses `.decision-log.md`, `addendum.md`, or similar persistent files, define their roles here once
- **`{doc_workspace}`** — if the skill creates a run folder, document that it is bound to the active session folder

Minimal example (simple skill):
```markdown
## Conventions

- Bare paths resolve from `{skill-root}` (where `customize.toml` lives).
- `{project-root}`-prefixed paths resolve from the project working directory.
- `{workflow.<name>}` resolves to the merged `[workflow]` table in `customize.toml`.
```

Extended example (skill with run folders and decision logs):
```markdown
## Conventions

- Bare paths resolve from `{skill-root}`; `{project-root}` from project working dir.
- `{workflow.<name>}` resolves to the merged `customize.toml` `[workflow]` table.
- `{doc_workspace}` is the bound run folder for the current session.
- `.decision-log.md` inside `{doc_workspace}` is the canonical audit trail — append with `memlog.py`, never hand-edit.
```

---

## `## On Activation` section

Standard numbered steps — always in this order:

### Step 1 — Resolve customization (always first)

```markdown
1. Resolve customization: `python3 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow`. On failure, read `{skill-root}/customize.toml` directly and use defaults.
```

### Step 2 — Run prepend steps

```markdown
2. Execute each entry in `{workflow.activation_steps_prepend}` in order.
```

### Step 3 — Load persistent facts

```markdown
3. Treat every entry in `{workflow.persistent_facts}` as foundational context for the rest of the run. Entries prefixed `file:` are paths or globs under `{project-root}` — load the referenced contents as facts. All other entries are facts verbatim.
```

### Step 4 — Load config

```markdown
4. Load `{project-root}/_bmad/core/config.yaml` (and `config.user.yaml` if present). Resolve `{user_name}`, `{communication_language}`, `{document_output_language}`, `{planning_artifacts}`, `{project_name}`, `{date}`. Missing keys → neutral defaults; never block activation.
```

### Step 5 — Detect mode (add when skill has headless mode)

```markdown
5. Detect mode. **Headless** when: no TTY, programmatic caller, `activation_steps_prepend` declares headless, or first message pre-supplies all required inputs. If headless: load `references/headless.md` and follow it for the entire run.
```

### Step 6 — Greet and bind run folder (add when skill creates a run folder)

```markdown
6. Greet `{user_name}` in `{communication_language}` and stay in `{communication_language}` for every turn. Bind `{doc_workspace}` to the active run folder (create with pattern `{workflow.run_folder_pattern}` if starting new; resume existing if continuing).
```

### Closing boilerplate (always present after last On Activation step)

```markdown
Execute each entry in `{workflow.activation_steps_append}` in order.

Activation is complete. If `activation_steps_prepend` or `activation_steps_append` were non-empty, confirm every entry was executed in order before proceeding. Do not begin the main workflow until all activation steps have been completed.
```

### Minimal On Activation (utility skill with no run folder)

Use steps 1–4 only, then the closing boilerplate.

---

## `## Finalize` section

Every workflow skill that produces a persistent artifact ends with a `## Finalize` section. Pattern:

```markdown
## Finalize

1. Run `{workflow.doc_standards}` checks against the document (prose and structure reviews). Surface findings; resolve with the user.
2. If `{workflow.finalize_reviewers}` is non-empty, route to each reviewer. Apply confirmed changes.
3. Move the artifact to its final location if it was drafted in a temp path.
4. Execute `{workflow.on_complete}`.
5. Invoke `bmad-help` to surface next-skill suggestions.
```

Rules:
- `{workflow.on_complete}` is always the last substantive step before `bmad-help`
- `{workflow.doc_standards}` is applied to prose documents only — never to terse structured outputs (spines, machine-contract JSON)
- `bmad-help` invocation is the terminal step of every finalize

---

## `customize.toml` schema

```toml
# DO NOT EDIT -- overwritten on every update.
#
# Workflow customization surface for {skill-name}.
#
# Override files (not edited here):
#   {project-root}/_bmad/custom/{skill-name}.toml         (team overrides)
#   {project-root}/_bmad/custom/{skill-name}.user.toml    (personal overrides)

[workflow]

# ── Standard fields (present on every workflow skill) ────────────────────────

activation_steps_prepend = []
# Array of strings. Natural-language instructions the LLM executes before
# config load and greet. Overrides append (never replace) per merge rules.

activation_steps_append = []
# Array of strings. Instructions executed after greet but before main workflow.
# Overrides append.

persistent_facts = ["file:{project-root}/**/project-context.md"]
# Array of strings. Three formats:
#   "literal fact"                  → treated as a direct instruction/context
#   "file:{project-root}/path.md"   → glob expanded; file contents loaded as facts
#   "skill:skill-name"              → named skill content loaded as facts

on_complete = ""
# String or array of strings. Last instruction(s) run at workflow completion.
# Empty = nothing extra runs.

# ── Document output fields (add when skill produces a persistent artifact) ───

{purpose}_template = "assets/{purpose}-template.md"
# Path to the default document template. Use skill-specific purpose noun:
# prd_template, brief_template, spine_template, spec_template, etc.

{purpose}_output_path = "{planning_artifacts}/{purpose}s"
# Where output folders / files are created. Uses {planning_artifacts} from
# core config. Overrides resolve the real path at runtime.

run_folder_pattern = "{purpose}-{project_name}-{date}"
# Naming pattern for the session run folder bound to {doc_workspace}.

# ── Review and quality fields ────────────────────────────────────────────────

doc_standards = [
  "skill:bmad-editorial-review-structure",
  "skill:bmad-editorial-review-prose"
]
# Applied at Finalize to prose documents. Three formats (same as persistent_facts):
#   "skill:<name>"    → invoke that skill as a subagent reviewer
#   "file:<path>"     → load file as a style directive
#   "plain text"      → applied as a direct instruction

finalize_reviewers = []
# Extra reviewer instructions / subagents at finalize and validate gates.
# Same three-format convention. Empty = no extra reviewers.

validation_checklist_template = "assets/{purpose}-validation-checklist.md"
# Rubric used when intent = validate. Omit if skill has no validate mode.

validation_report_template = "assets/validation-report-template.html"
# HTML skeleton for validation reports. Omit if not applicable.

# ── Integration fields ────────────────────────────────────────────────────────

external_sources = []
# On-demand MCP tool or knowledge-base directives. Loaded when the skill
# needs to pull from external systems (web research, internal wikis, etc.).

external_handoffs = []
# Post-finalize routing instructions. E.g. "Post artifact to Confluence space X".
# Executed in ## Finalize after on_complete if present.
```

### Merge semantics

| Value type | Merge behavior |
|---|---|
| Scalar (`string`, `bool`, `int`) | Override wins — base is replaced |
| Inline table | Deep merge recursively |
| Arrays with `code` or `id` fields | Keyed merge — matching keys replace, new keys append |
| All other arrays | **Append** — base entries first, then override entries. No removal mechanism. |

Override resolution order (highest priority first):
1. `{project-root}/_bmad/custom/{skill-name}.user.toml` (personal)
2. `{project-root}/_bmad/custom/{skill-name}.toml` (team)
3. `{skill-root}/customize.toml` (skill defaults)

---

## Token reference

| Token | Resolved from | Usage |
|---|---|---|
| `{skill-root}` | Runtime — skill's installed dir | File paths to local skill assets |
| `{skill-name}` | Runtime — skill folder's basename | References and log labels |
| `{project-root}` | Runtime — project working directory | Paths to project files and _bmad/ |
| `{doc_workspace}` | Bound at activation to the run folder | All artifact reads/writes during a session |
| `{workflow.<name>}` | Merged `customize.toml` `[workflow]` table | Any configurable value |
| `{user_name}` | `_bmad/core/config.yaml` | Greet and personalization |
| `{communication_language}` | `_bmad/core/config.yaml` | Language for all turns |
| `{document_output_language}` | `_bmad/core/config.yaml` | Language for generated docs |
| `{planning_artifacts}` | `_bmad/core/config.yaml` | Output root for planning docs |
| `{project_name}` | `_bmad/core/config.yaml` | Used in folder patterns and titles |
| `{date}` | Runtime — today's date | Folder names and timestamps |

---

## `references/` vs `assets/`

| Subfolder | Contains | How used |
|---|---|---|
| `references/` | Instruction modules — prose rules, mode-specific behavior, checklists | SKILL.md loads them conditionally: "load `references/headless.md` and follow it" |
| `assets/` | Templates, schemas, HTML skeletons, validation rubrics | SKILL.md reads them as content to fill in, copy, or parse |

**`references/` common files:**

| File | Purpose |
|---|---|
| `headless.md` | Headless mode instructions + JSON response schema |
| `validate.md` | Validate-intent flow for skills with create/update/validate modes |
| `reviewer-gate.md` | Reviewer gate mechanics at finalize |
| `discover-inputs.md` | Input discovery instructions for structured input collection |

**`assets/` common files:**

| File | Purpose |
|---|---|
| `{purpose}-template.md` | Document structure template (PRD, brief, spine, spec) |
| `{purpose}-validation-checklist.md` | Quality rubric for validate mode |
| `validation-report-template.html` | HTML skeleton for validation reports |
| `headless-schemas.md` | JSON response schemas for headless mode (some skills) |

---

## Headless mode

Every workflow skill that can be called programmatically supports headless mode. The detection triggers and instructions always live in `references/headless.md`.

**Detection triggers:**
- No TTY present (programmatic caller)
- `activation_steps_prepend` contains a headless declaration
- First user message pre-supplies all required inputs

**Standard JSON response shape:**
```json
{
  "status": "complete|partial|blocked",
  "intent": "create|update|validate",
  "{artifact_key}": "{doc_workspace}/{artifact}.md",
  "open_questions": [],
  "assumptions": [],
  "external_handoffs": []
}
```

Status values:
- `complete` — artifact produced, all inputs resolved
- `partial` — artifact produced but with inferred inputs or open questions
- `blocked` — no artifact; add `reason` field

Omit keys for artifacts not produced.

---

## Decision log (`memlog.py`)

For skills that produce persistent artifacts with iterative decisions (architecture, spec, PRD), use `memlog.py` to maintain an append-only `.decision-log.md` inside `{doc_workspace}`.

```bash
# Initialize at start of run
python3 {project-root}/_bmad/scripts/memlog.py init \
  --workspace {doc_workspace} \
  --field scope="..." \
  --field purpose="..." \
  --field altitude="..."

# Append entries during the run
python3 {project-root}/_bmad/scripts/memlog.py append \
  --workspace {doc_workspace} \
  --type <type> \
  --text "..."
```

Entry types:

| Type | When to use |
|---|---|
| `decision` | A committed design or product choice |
| `constraint` | A hard limit imposed by stakeholders, tech, or policy |
| `assumption` | Something treated as true but not verified |
| `question` | Open item needing resolution |
| `direction` | A guiding principle adopted for this run |
| `event` | Terminal moments: finalize, validation, handoff |
| `note` | Any other log-worthy context |
| `version` | Document version increments |

No status field exists — once appended, entries are permanent. Use for architecture, spec, and PRD skills; omit for lightweight utility skills.

---

## Intent operating modes

Skills that can create new artifacts or update existing ones declare explicit intent modes:

```markdown
## Intent Operating Modes

**Create** — no existing artifact found (or user says "new"). Start from blank template.
**Update** — existing artifact found (or user provides path). Load, diff, and revise.
**Validate** — user says "validate", "review", or "check". Load artifact and run checklist; produce a validation report.

Detection priority: explicit user instruction → artifact presence in `{doc_workspace}` → ask.
```

Headless mode always declares intent in its JSON response.

---

## Validation checklist

A workflow skill that generates SKILL.md and customize.toml output should verify:

- [ ] `name` in frontmatter matches the folder name exactly
- [ ] `description` is one sentence, starts with action verbs, ends with "Use when..." clause
- [ ] `## Conventions` documents all tokens actually used in the body (`{doc_workspace}`, `{workflow.*}`, etc.)
- [ ] `## On Activation` step 1 runs `resolve_customization.py`; fallback reads `customize.toml` directly
- [ ] `activation_steps_prepend` runs before config load; `activation_steps_append` runs after greet
- [ ] Closing boilerplate present after last On Activation step
- [ ] `customize.toml` header comment matches the standard format
- [ ] All array fields default to `[]`; strings default to `""`
- [ ] `on_complete = ""` (not omitted) so overrides can set it
- [ ] `persistent_facts` defaults to `["file:{project-root}/**/project-context.md"]` unless the skill has no use for project context
- [ ] If skill produces a document artifact: `{purpose}_template`, `{purpose}_output_path`, `run_folder_pattern`, `doc_standards` are all present
- [ ] `## Finalize` is present; ends with `{workflow.on_complete}` then `bmad-help`
- [ ] `references/headless.md` present if headless mode is declared
- [ ] `assets/` files referenced in `customize.toml` exist in the folder
