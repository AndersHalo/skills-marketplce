# BMAD Mapping Rules

Conversion rules from Claude Code SKILL.md elements to BMAD conventions.

---

## SKILL.md top-level structure

Every BMAD skill follows this section order:

```
YAML frontmatter (name, description)
# Title                     ← H1, skill display name
## Overview                 ← always present; 1–2 sentences on what it does and when to use it
## Conventions              ← standard path resolution note (copy verbatim, see below)
## On Activation            ← standard 3-step header + skill-specific steps (copy verbatim, see below)
## {Section}                ← one per mapped process step, no step numbers
...
```

**Standard `## Conventions` block (copy verbatim):**
```markdown
## Conventions

- Bare paths (e.g. `references/file.md`) resolve from `{skill-root}` (where `customize.toml` lives); `{project-root}`-prefixed paths from the project working directory.
- `{workflow.<name>}` resolves to fields in the merged `customize.toml` `[workflow]` table.
```

**Standard `## On Activation` header (steps 1–3 always verbatim; add skill-specific steps after step 3):**
```markdown
## On Activation

1. Resolve customization: `python3 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow`. On failure, use a subagent to read `{skill-root}/customize.toml` directly with defaults.
2. Run each `{workflow.activation_steps_prepend}` entry. Treat each `{workflow.persistent_facts}` entry as foundational context (`file:`-prefixed entries are paths/globs under `{project-root}` — load their contents; others are facts verbatim).
3. Load `{project-root}/_bmad/core/config.yaml` (and `config.user.yaml` if present); resolve `{user_name}`, `{communication_language}`. Missing → neutral defaults; never block.
4. {skill-specific: load references/ files, check for session, show welcome content, etc.}
N. Run each `{workflow.activation_steps_append}` entry. Then open the floor.
```

---

## Frontmatter

| Claude Code element | BMAD equivalent |
|---|---|
| `name:` in frontmatter | `name:` in BMAD frontmatter — keep as-is |
| `description:` in frontmatter | `description:` in BMAD frontmatter — keep as-is |
| No frontmatter | Derive `name` from folder name; derive `description` from first heading or first paragraph |

---

## Inputs → BMAD variables

| Claude Code type | BMAD equivalent |
|---|---|
| `Constant` | Skill-specific key in `customize.toml [workflow]` — add to the toml file; referenced in SKILL.md body as `{workflow.var_name}` |
| `Derived` | Skill-specific key in `customize.toml [workflow]` with a computed/path default — referenced as `{workflow.var_name}`; resolved in `## On Activation` step 4+ |
| `User input` | Prompted interactively in the skill flow — becomes an open question in the relevant step |
| `Enum` | Numbered menu in the skill flow — list options with numbers, ask "Which?" |
| `File` | User provides a path; skill reads the file inline when the step runs |

Variable naming in BMAD: use `snake_case` (e.g. `source_skill_path`), not `kebab-case`.

Variable reference syntax by type:
- `Constant` / `Derived` → `{workflow.var_name}` (reads from `customize.toml [workflow]`)
- Core BMAD globals (`user_name`, `communication_language`, `output_folder`, etc.) → `{var_name}` (no prefix, from `_bmad/core/config.yaml`)
- Runtime values / user-provided → inline in prose, no special syntax

---

## Process steps → BMAD sections

| Claude Code element | BMAD equivalent |
|---|---|
| `### Step N — Title` | `## Title` heading in BMAD SKILL.md body (omit step number) |
| Step sub-bullets (numbered) | Numbered list items within the `##` section |
| `**[Step N of M]**` progress marker | Not used in BMAD — omit |
| Conditional branches (if/else) | Prose: "If X → do Y; otherwise → do Z" |
| Session checkpoint write | Apply the "Session state" section criteria — omit unless state is critical |

Keep the full instruction text of each step — BMAD skills are LLM instructions, just like Claude Code skills.

---

## Aux files → BMAD subfolders

| Content type | Subfolder | Rule |
|---|---|---|
| Reference documentation, rules, conventions, format guides | `references/` | Content the skill reads as instructions |
| Templates, example outputs, static scaffolding files | `assets/` | Content the skill copies or fills in |
| Automation scripts | `scripts/` | Python/shell scripts |

If ambiguous: prefer `references/` for anything interpreted; prefer `assets/` for anything copied as-is.

Filename: keep the same name — `{aux-name}.md` → `references/{aux-name}.md` or `assets/{aux-name}.md`.

**Aux files with `.json` or other non-`.md` extensions:**

BMAD outputs only `.md` files. When the source aux file has a non-`.md` extension:
1. The output file is always `{subfolder}/{aux-name}.md` (replace extension with `.md`).
2. When reading the source file during generation: try the original extension first (e.g. `{source-skills-folder}/{skill-name}/{aux-name}.json`), then try `.md`. Use whichever is found.
3. Wrap the raw content in an appropriate fenced code block in the output `.md` file:
   - `.json` source → ` ```json ` fence with a `# {aux-name}` heading and one-line description above it
   - `.yaml`/`.toml` source → ` ```yaml ` / ` ```toml ` fence, same pattern
   - `.csv` source → ` ```csv ` fence
4. If neither extension is found, write a stub with the aux file's description as placeholder content.

The SKILL.md body always references these files by their `.md` output path (e.g. `references/tools-reference.md`), never by the original `.json` path.

---

## Session state

Claude Code uses `session.json` keyed by session ID. BMAD uses `.decision-log.md` for multi-run state. Default is **stateless** — omit session handling unless the source skill meets the criteria below.

**Criteria for "state is critical" (all three must be true):**
1. The source skill has a named session file other than the transformer's own `session.json` (e.g. `governance-session.json`, `sprint-session.json`) — a dedicated file means the original author considered state essential.
2. The source skill's body explicitly routes by session state (e.g. `if current_step = "resources" → ...`) — state drives the flow, not just records it.
3. The source skill produces intermediate output that accumulates across interactions (e.g. writes rows to a file mid-flow, not just a single final write).

**If critical:** keep the same session filename from the source skill (e.g. `governance-session.json`) — do NOT rename to `.decision-log.md`. Reference it by bare path in the skill body: `{skill-root}/governance-session.json`.

**If not critical:** omit all session read/write instructions. The skill runs stateless per invocation.

---

## Loading files in BMAD

BMAD does **not** use a "mandatory read loop" pattern. File loading is inline prose in the relevant step or activation section.

**References loaded at activation (always needed):** add as a numbered step inside `## On Activation` after step 3:
```
4. Load reference files — read `references/X.md` and `references/Y.md` in full.
   If any cannot be read, stop with: ⚠ Could not read `{filename}`. Check the path and try again.
```

**References loaded conditionally (only needed in one path):** inline in the body section that uses them:
```markdown
Load `references/headless.md` and follow it for the whole run.
```

**Assets (templates, schemas):** referenced by path when the step that uses them runs — no pre-loading.

Bare paths (e.g. `references/tools-reference.md`) resolve from `{skill-root}` per the `## Conventions` section.

**When the source skill body contains a mandatory read loop pattern:**

The loop pattern is a Claude Code construct — it does not appear in BMAD output. Replace the entire loop block with a single inline sentence:
```
Read `references/{aux-name}.md` in full.
```
If the surrounding step says "read all files before doing anything else", move that loading to On Activation step 4 instead of keeping it as a body section.

---

## What does NOT translate

| Claude Code element | BMAD handling |
|---|---|
| `.skill-meta.json` | Not written to output — used only as a data source during transformation |
| `defaults.md` | Not written to output — `Constant`/`Derived` inputs map to `customize.toml [workflow]` keys |
| `welcome.md` | Not written to output — intro paragraph becomes `## Overview`; Inputs/Defaults tables become trigger blocks in On Activation step 4 |
| `session.json` (transformer's own) | Not written to output — internal to the transformer only |
| Named session files | Keep if state is critical (see Session state section); omit otherwise |
| `plugin.json`, `marketplace.json` | Not written to output — BMAD uses `module.yaml` which is only generated in module mode |
| `{skill-root}/defaults.md` references | Strip — replace with `{project-root}/_bmad/custom/{skill-name}.user.toml` if context is about user overrides |
| `{skill-root}/welcome.md` references | Strip — content was absorbed into On Activation |

---

## Module vs. workflow decision

Use **module** when the source skill:
- References packaging, distribution, or installation of other skills
- Produces multiple output artifacts meant to work together
- Explicitly mentions "module" or multi-skill coordination

Use **workflow** (standalone skill) when the source skill:
- Performs a single focused task
- Produces one primary output
- Has no dependency on other skills

When unsure, default to **workflow**.

---

## Module-help.csv column inference

When collecting module-help.csv data for a skill, silently auto-detect these columns before showing the wizard. Present detections as pre-filled defaults — the user can override any of them.

The new schema columns to infer: `display-name`, `menu-code`, `action`, `args`, `phase`, `preceded-by`, `followed-by`.
Auto-filled (never ask): `module` = module_code, `skill` = skill folder name.

### display-name inference

Title-case the skill folder name, replacing hyphens with spaces. E.g. `rp-roadmap-build` → `Roadmap Build`. Remove module prefix if present.

### menu-code inference

Take the uppercase initials of the display-name words. E.g. `Roadmap Build` → `RB`, `Create PRD` → `CP`. If collision with another skill in same module: append a digit (`RB2`).

### action inference

The `action` is the capability/entry-point name within the skill — what gets passed as an argument to invoke this specific capability.

Scan the skill's SKILL.md body for:
- Named entry points in frontmatter `description:` or arg documentation (e.g. `build-roadmap`, `validate-roadmap`, `configure`)
- Explicit arg documentation blocks listing action names
- The skill's primary verb: `create`, `build`, `validate`, `configure`, `analyze`, `generate`

Default action inference:
| Skill behavior | Suggested `action` |
|---|---|
| Primary creation/generation capability | kebab-case of the skill's main verb + noun (e.g. `build-roadmap`) |
| Validation/review path of same skill | `validate-{noun}` (e.g. `validate-roadmap`) |
| Setup/configuration | `configure` |
| Analysis/audit | `analyze` |
| Conversion | `convert` |

If the skill has one clear purpose: action = that purpose in kebab-case. If multi-capability: each capability gets its own row.

### args inference

Scan the skill's SKILL.md for any documented arguments, flags, or parameters:
- `--headless` / `-H` flags → `{-H: headless mode}`
- File path inputs → `{path: description of file}`
- Named parameters → `{param-name: description}`

Format: `{arg: description}` per arg, `|`-separated. Leave empty if no args documented.

### Phase detection

Scan the skill's SKILL.md body, description, and step titles for signal words:

| Phase code | Signal words (any match) |
|---|---|
| `1-analysis` | research, discovery, brief, market analysis, domain, competitive, brainstorm, exploration, audit existing, investigate |
| `2-planning` | PRD, product requirements, roadmap, planning, strategy, requirements document, feature planning |
| `3-solutioning` | architecture, technical design, system design, UX, wireframe, epics, design document, API design |
| `4-implementation` | stories, sprint, coding, development, implementation, QA, testing, review, retrospective, code, dev story |
| `anytime` | utility, helper, setup, configure, scan, generate context, audit, analyze existing codebase |

If no clear signal or multiple equal matches: default to `anytime`.

### preceded-by / followed-by inference

Default: both empty (none). Do not guess — these encode real workflow dependencies. Present as empty and let the user fill them in during the wizard.

Exception: if the skill's description explicitly mentions "after X" or "requires Y to be run first", pre-fill `preceded-by` with the referenced skill name and inferred action. Show as a suggestion the user can clear.

Format: `{skill-folder-name}:{action}`. Multiple: `skill-a:action-a|skill-b:action-b`.

### Single-skill vs multi-skill module detection

Determined by the number of skills selected for the module:
- **1 skill** → single-skill module — offer standalone approach (see SKILL.md Step 2)
- **2+ skills** → multi-skill module — setup-skill approach always
