# Skill Conventions

## Naming

- Skill names: lowercase kebab-case — `my-skill-name`
- The skill directory name must exactly match the `name` field in its SKILL.md frontmatter

**Valid examples:** `roadmap-build`, `skill-build`, `halo-bmad`
**Invalid examples:** `RoadmapBuild`, `roadmap_build`, `roadmap build`

---

## Frontmatter

Every SKILL.md must begin with this block (no blank lines before or after the delimiters):

```
---
name: {skill-name}
description: {one-line description, under 200 characters}
---
```

The frontmatter block must contain **only** these two fields — do not add `version`, `author`, `team`, or any other fields. The `description` is used by skill discovery tools — keep it specific and actionable.

---

## File structure

```
{output-folder}/
  SKILL.md
  {aux-file-1}.md        ← prose rules, templates, guidelines
  {aux-file-2}.json      ← structured data: schemas, lookup tables, configs
  welcome.md
  .skill-meta.json
```

The output folder is chosen by the user at build time. The default suggestion is `{skill-root}/../{skill-name}/` — one level above the skill-build directory, placing the new skill alongside it.

---

## Auxiliary files

### Roles: SKILL.md vs aux files

| File | Role | Contains |
|---|---|---|
| `SKILL.md` | Orchestration | Steps, flow, branching, what to read, what to ask, what to write |
| Aux `.md` | Reference content | Rules, templates, examples, guidelines that Claude reads and interprets |
| Aux `.json` | Structured data | Schemas, lookup maps, classification tables, typed configs that Claude parses |

**SKILL.md is always the orchestration layer.** Complex logic, rule sets, templates, and reference data belong in aux files — not inline in behavior steps.

### When to extract to an aux file

Extract content from SKILL.md to an aux file when **any** of these apply:

- A rule set, classification table, or template is referenced in more than one step
- Inline content would exceed ~20 lines and is reference material, not flow control
- The content changes at a different rate than the step structure (rules evolve independently of step order)
- A behavior step contains more content than the surrounding orchestration instructions
- Multiple types of reference content belong to the same feature (e.g. checks + display template + output messages) — extract them all to a single dedicated aux file even if any one piece alone would stay inline; keep only the orchestration call inline: `read {skill-root}/feature-name.md and apply its rules`

Keep inline in SKILL.md only when:
- The instruction is ≤ 5 lines and used in exactly one step
- It is branching or decision logic that directly controls flow (not reference material)

### Format: `.md` vs `.json`

**Use `.md` when:**
- Content is prose, rules, or templates that Claude reads and interprets contextually
- Examples, guidelines, or explanations where narrative context matters
- Structured tables (Markdown tables) that Claude reasons about, not iterates over programmatically

**Use `.json` when:**
- Content is a key-value map, array, or typed field set that Claude reads and iterates or looks up values from
- The data has a schema — field names, types, and defaults that must stay consistent across sessions
- The file is shared across multiple steps or multiple skills as a structured config
- Examples: classification rules as arrays, author identity, field schemas, lookup tables

### Single-purpose rule

Each aux file must serve exactly one purpose. Its entire content should be explainable by its `description` field alone.

**Signs of a violation:**
- Sections that belong in a different aux file (e.g. naming conventions inside a template file)
- Rules that duplicate content already present in another aux file or inline in SKILL.md
- A behavior step in an aux file — orchestration belongs in SKILL.md, not in reference files
- Two aux files that both define rules for the same concept

**How to fix:**
- Move off-purpose sections to the correct file (or into SKILL.md if they are flow control)
- Remove duplicate rules — keep the definition in one place and reference it from others
- Update the `description` field in `aux_files[]` to reflect the file's narrowed scope after cleanup

---

### `aux_files[]` format field

Every entry in `aux_files[]` must declare its format:

```json
"aux_files": [
  { "name": "rules", "format": "md", "description": "Output format rules and examples." },
  { "name": "schema", "format": "json", "description": "Field schema used to validate output structure." }
]
```

- `format` is `"md"` or `"json"` — no other values are valid
- The file on disk is `{name}.{format}` — e.g. `rules.md`, `schema.json`
- If `format` is absent from an existing entry (legacy), treat it as `"md"`

---

## Behavior steps

- Must be numbered H3 headers in sequence: `### Step 1 — Name`, `### Step 2 — Name`, ...
- Each step covers exactly one phase — do not combine unrelated actions in a single step
- Separate steps with a horizontal rule `---`

**File reading steps** — must use the mandatory read loop:

```
offset = 0; chunks = []
loop:
  read file at offset, limit=200
  append to chunks
  if result < 200 lines → EXIT loop
  else → offset += 200, continue
content = join(chunks)
```

**File writing steps** — must confirm or ask for the output directory before writing; list all written files in the confirmation output.

**User input steps** — ask one question at a time and wait for a response before asking the next.

**Final step** — must always confirm what was produced: files written with paths, or a summary of console output.

---

## Skill root reference

Inside SKILL.md, use `{skill-root}` as a placeholder for the directory containing the SKILL.md file itself. Claude Code resolves this to the actual path at runtime. Use it when referencing auxiliary files:

```
- `{skill-root}/my-reference-file.md`
```

---

## Error messages

- Prefix with `⚠`
- State what failed (file path, step name)
- State what the user should do next
- Format as a blockquote: `> ⚠ Could not read '{path}'. Check the path and try again.`

---

## Welcome pattern

Every skill with a `welcome.md` follows one of four cases. Pick the case that matches the skill's inputs — do not mix them.

### Case 1 — Has both `User input`/`File` AND `Constant`/`Derived` inputs

```
# {Title}

{one-sentence description}

You have **{n} inputs** and **{m} defaults** you can configure. *(Say "show inputs" or "change defaults" anytime.)*
```

Where `{n}` = count of `User input`/`File` entries, `{m}` = count of `Constant`/`Derived` entries.

After displaying the welcome, the skill proceeds immediately to Step 1 — no confirmation needed. If the user's first response asks to see inputs or change defaults, show the relevant table and re-ask the Step 1 question.

### Case 2 — Has only `Constant`/`Derived` inputs (no `User input`/`File`)

```
# {Title}

{one-sentence description}

You have **{m} defaults** you can configure. *(Say "change defaults" anytime.)*
```

After displaying the welcome, the skill proceeds immediately to Step 1.

### Case 3 — Has only `User input`/`File` entries (no `Constant`/`Derived`)

```
# {Title}

{one-sentence description}

You have **{n} inputs** this skill will ask for. *(Say "show inputs" anytime.)*
```

After displaying the welcome, the skill proceeds immediately to Step 1.

### Case 4 — No inputs of any kind

No `welcome.md` needed. The skill starts immediately on invocation.

### Rules

- **The template shown for each case is the complete and exact content of `welcome.md`** — do not add any lines, hints, or metadata beyond what the template shows. In update mode, do not carry over any content from the existing `welcome.md`.
- **Never wait for a "get started" confirmation** — after displaying the welcome, proceed directly to Step 1
- **Never show the inputs table or defaults table in the welcome message** — show them only when the user explicitly asks (e.g. "show me the inputs", "what are the defaults?")
- If the user's first response asks to see inputs or defaults: show the table, then re-ask the Step 1 question
- Never use "Want to get started?" or "Ready to begin?" — these require an extra roundtrip with no value
- Never use "press Enter to continue" — the agent understands natural language
- Never include a `Source` column in the inputs table — it is an internal detail
- Never add a "What this skill produces" section — fold it into the one-sentence description
- When displaying on demand: Inputs table shows name and Required (✅ Required, unless the brief described the input as optional); Defaults table shows Setting / Default / Description columns
- Never put the same input in both tables

---

## Persistence: `defaults.md` vs `.skill-meta.json`

Two separate files hold skill state across sessions — they serve distinct purposes:

| File | Stores | Does NOT store |
|---|---|---|
| `defaults.md` | Runtime process settings: input/output paths, format options, configurable behavior | Author identity, team, version |
| `.skill-meta.json` | Authorship (`author.name`, `author.email`, `author.team`), skill version, full skill definition | Runtime process settings |

**Rule:** if the value describes *who built the skill or what it is*, it belongs in `.skill-meta.json`. If it describes *how the skill should run*, it belongs in `defaults.md`.

Skills that need author info (e.g. to write it into generated files) must read it from `{skill-root}/.skill-meta.json` — not collect it in defaults.

---

## `.skill-meta.json` structure

Authoritative data source for skill-build Update Mode runs. Field group order: identity → authorship → definition → build tracking.

```json
{
  "schema_version": 1,
  "skill_name": "my-skill",
  "skill_version": "1.0.0",
  "output_folder": "skills/my-skill/",
  "author": {
    "name": "...",
    "email": "...",
    "team": "..."
  },
  "skill_description": "One sentence description.",
  "skill_inputs": [...],
  "skill_process": "...",
  "skill_outputs": "...",
  "aux_files": [{ "name": "rules", "format": "md", "description": "..." }],
  "applied_suggestions": [...]
}
```

`team` lives inside `author` — not as a top-level field. `skill_version` is only present after the first Update Mode run.

---

## Step counter

Multi-step skills display a step counter at the start of each step's runtime output — distinct from the H3 header, which is the skill definition:

```
**[Step 2 of 5]**
```

Always use the format `[Step N of M]` where `N` is the current step and `M` is the total. Place it as the first line of the step's output, before any content.

---

## Session state

Use `{skill-root}/session.json` to persist state across steps so the skill can resume if interrupted. The file is a JSON object keyed by session ID — this allows multiple Claude Code sessions to run the same skill concurrently without colliding.

**Session key:** always a random short ID generated at the start of each run (e.g. `sess-a3f9k2`, 6 chars from `a-z0-9`). Never use folder paths or subject names as keys.

**session.json structure:**

```json
{
  "sess-a3f9k2": {
    "current_step": "plan",
    "output_folder": "skills/my-skill/",
    "skill_name": "my-skill"
  },
  "sess-x7m1qp": {
    "current_step": "generate",
    "output_folder": "skills/other-skill/",
    "skill_name": "other-skill",
    "completed": true
  }
}
```

Store only the values needed to reconstruct context on resume. Always include the subject field (e.g. `output_folder`, `plugin_folder`) in every checkpoint write so the recovery scan can find it.

**Write/remove patterns:**
- **Write:** read `session.json` as object (use `{}` if not found); set `object[session_id]` to current state; write full object back.
- **Remove:** read object; delete `object[session_id]`; write full object back.

**Subject recovery:** When the session's target subject becomes known during the flow, scan all entries in `session.json` for one whose subject field matches.
- Found and active (no `completed`) → remove provisional entry if one was created before the subject was known (remove pattern); adopt found session ID; offer resume or overwrite.
- Found and `completed: true` → remove it (remove pattern); continue with current session ID.
- Not found → continue with current session ID.

**Rules:**
- Write checkpoint **after** each step completes — not before.
- On activation: read `session.json`; collect all entries, sort by most recent first (reverse insertion order), take up to 3. If none → start fresh with no banner. If any → show a unified list below the welcome:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Recent sessions
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    1. {skill_name}     completed
    2. {skill_name}     updating
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
  Ask: `Resume (1–N), start new, or update a different skill?` — number resumes the chosen session; start new removes completed entries and proceeds fresh; update different goes to the Update path.
- On resume: load stored values from the chosen entry; jump to the stored step.
- On fresh start: generate a new session ID; create a new entry.
- On successful completion: set `completed: true` in the entry — do not remove it. Keep at most **1** completed entry total; remove the oldest `completed: true` entry when a new one is added.
- When the user starts something new: remove only `completed: true` entries — never remove active entries. Active sessions stay in place for future resume.
- If interrupted mid-run: leave the entry in place for the next run.

---

## Retry cap

When asking the user to select from a numbered menu or provide a specific value, enforce a maximum of **3 attempts** before aborting:

```
⚠ No valid selection after 3 attempts. Aborting.
```

Apply to any step where invalid input blocks progress — marketplace selection, plugin selection, name validation, etc.

---

## Context banner

For skills that navigate a hierarchy of entities (e.g. marketplace → plugin, workspace → project), show a context banner when the user makes a decision that depends on the active context:

```
Working in: {parent} › {child}
```

Show it at the **start of the step** where the choice is made. Skip steps where context is already obvious from file paths or other content shown.

---

## Iterative completion menu

Skills that can run multiple times or operate on related entities should offer a continuation menu after completing a run, instead of ending immediately:

```
Working in: {context}

What's next?
  1. {most specific re-entry — later step}
  2. {mid-level re-entry}
  3. {broad reset — earlier step}
  4. Done
```

Rules:
- Number options from most-specific to least-specific re-entry point.
- Always include "Done" as the last option.
- Re-entry skips all setup steps already completed (reference file loading, author setup) — jump directly to the indicated step.
- Keep marketplace/plugin/other resolved context in memory when jumping to later steps.
