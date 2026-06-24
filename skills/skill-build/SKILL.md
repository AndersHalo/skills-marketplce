---
name: skill-build
description: Conversational skill builder. Collects requirements from a free-form brief, validates and analyzes them, previews a plan for user approval, and generates a production-ready SKILL.md with optional auxiliary files.
---

## On Activation

1. Try to read `{skill-root}/defaults.md`. If found, parse each line as `{key}: {value}` and store in-memory. If not found, use built-in defaults: `output-folder-prefix: {skill-root}/../`, `context-file: {skill-root}/session.json`.

   **Context file conventions (apply throughout this skill):**
   - `{context-file}` is a JSON object keyed by session ID (e.g. `sess-a3f9k2`) — each key holds one session's data.
   - **Write pattern:** read `{context-file}` as object (use `{}` if not found or invalid); set `object[session_id]` to current session data; write full object back.
   - **Remove pattern:** read object; delete `object[session_id]`; write full object back.

   **Output file prohibition — enforced throughout this entire skill run:**
   Do NOT write to any skill output file (`SKILL.md`, `welcome.md`, aux `.md`/`.json` files, `.skill-meta.json`) at any point before the user confirms with `go` and Step 3 begins. This prohibition covers Step 1 (Collect) and Step 2 (Plan) in full — including the Feature, Improvement, and Rebuild paths. During these steps, all changes are tracked as in-memory deltas to stored values only.
   The only permitted file writes before Step 3 are session checkpoint updates in `{context-file}`.
   If you are about to edit a skill's files before `go` — stop immediately. Record the intended change as a delta to the stored values instead, and show it in the Step 2 plan.

2. Load reference files needed for all paths using the mandatory read loop. Keep them in context for the entire run.

   Files to load:
   - `{skill-root}/skill-conventions.md` — naming rules, frontmatter spec, step structure
   - `{skill-root}/analysis-guide.md` — conflict detection, feasibility criteria, suggestion rules

   `input-types.md` loads at the start of the Create path Extract phase. `skill-template.md` loads just before Step 3b. `improvement-checks.md` loads at the start of the Improvement path and the post-generation quality check. Loading them lazily avoids context cost for runs that never reach those paths.

   Mandatory read loop:
   ```
   offset = 0; chunks = []
   loop:
     read file at offset, limit=200
     append to chunks
     if result < 200 lines → EXIT loop
     else → offset += 200, continue
   content = join(chunks)
   ```

   If any file cannot be read:
   > ⚠ Could not read `{filename}` at `{skill-root}`. Check the path and try again.

3. **Session check (silent):** Try to read `{context-file}` as a JSON object.
   - File not found or invalid JSON → `has_session = false`. Stop here.
   - File found and valid:
     - Collect all entries (key + value pairs). Sort by most recent first (reverse insertion order). Take up to 3 → store as `recent_sessions[]` (each entry carries its session ID as a field for later use).
     - For each active entry (no `completed`): apply defaults — `mode` → `"create"` if absent; `meta_source` → `"skill-meta"` if absent; `generated_files` → `[]` if absent.
     - `has_session = recent_sessions.length > 0`

4. Read `{skill-root}/welcome.md` in full and display it.

5. **Session banner and routing:**

   If `!has_session` → skip to step 6 immediately.

   Otherwise, show immediately below the welcome:

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Recent sessions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     {N}. {skill_name}     {completed | updating}
     ...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   Status label: `completed` if `completed: true`; `updating` if active.

   Ask: `Resume (1–{N}), start new, or update a different skill?`

   - **Number — updating (active entry)** → load all stored values; set `active_session_key` = its session ID. Jump to stored step:
     | `current_step` | Jump to |
     |---|---|
     | `"plan"` | Step 2 |
     | `"generate"` | Step 3 |
     When resuming to Step 3: before each sub-step (3a–3g), check `generated_files[]` — skip if its output file is already listed.
   - **Number — completed entry** → load `skill_name` and `output_folder` from it; enter Update path at **Intent** (skip Resolve display). If skill not found at `output_folder`:
     > ⚠ Skill `{skill_name}` not found at `{output_folder}`.
     **Provide a different path** → Update path Resolve normally | **Start fresh** → remove that completed entry (remove pattern); proceed to step 6.
   - **start new** → remove all `completed: true` entries (remove pattern for each); proceed to step 6.
   - **update different skill** → proceed to Update path in Step 1.

6. Proceed directly to the **Create path** in Step 1 — show the brief prompt immediately after the welcome. Do not wait for a "get started" confirmation.

   Interpret the user's first response as:
   - **Change defaults** (says "change defaults", "show defaults", or asks to review/change them) → display the defaults table; let the user change values conversationally; after each change, update in-memory and persist to `{skill-root}/defaults.md`; then re-show the brief prompt.
   - **Update intent** (mentions an existing skill name, or says "update", "edit", "modify") → proceed to the **Update path** in Step 1.
   - **Anything else** → treat as a brief and continue with the **Create path**.

---

## How to invoke

`/skill-build`

---

## Behavior

### Step 1 — Collect

Two paths — Create and Update — both end at **Step 2**. In the Create path, analysis runs silently during extraction and its findings appear in the Plan Confirmation. In the Update path, analysis runs after the delta is applied (Feature path), after improvements are integrated (Improvement path), or after the rebuild plan is approved (Rebuild path); if the user chooses to generate as-is with no changes, analysis is skipped and the plan shows the current stored values unchanged.

---

#### Create path

**Brief**

Show:
```
**[Step 1 of 3]**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  halo-skill-builder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> Describe the skill you want to build. Include its name, what it does, what the user needs to provide, what it produces, and any reference files it needs.
> *(Write as much or as little as you like — I'll ask follow-ups for anything unclear.)*

Wait for the user's response.

**Load input-types.md (lazy):**

Read `{skill-root}/input-types.md` using the mandatory read loop. If it cannot be read:
> ⚠ Could not read `input-types.md` at `{skill-root}`. Check the path and try again.

**Extract and analyze (silent)**

Run both phases without producing any output.

*Phase 1 — Extract:*

| Field | How to extract |
|---|---|
| `skill_name_raw` | Exact name as the user stated it ("called X", "named X"). Mark `?` if no name mentioned. |
| `skill_name` | `skill_name_raw` normalized to kebab-case. Mark `?` if `skill_name_raw` is `?`. |
| `skill_description` | One sentence from the purpose statement. Under 200 characters. |
| `skill_inputs[]` | Each input: `name` (kebab-case noun), `description`, `type` (use input-types.md rules), `default` (Constant/Derived only; `null` for all others). Mark `?` if no inputs mentioned. |
| `skill_process` | What the skill does internally. Mark `?` if too vague to produce a behavior step. |
| `skill_outputs` | Files, console output, or both. Mark `?` if not mentioned. |
| `aux_files[]` | Reference files mentioned (templates, rules, specs). Each entry is `{ "name": "kebab-case-name", "format": "md" or "json", "description": "what it contains and how the skill uses it" }`. Empty array if none. Infer `format` from the description: signals like "schema", "structured data", "lookup table", "config", "key-value", "array of" → `"json"`; otherwise default to `"md"`. |

*Phase 2 — Analyze:*

Apply all rules from `analysis-guide.md` to the extracted values. Classify each finding:

| Severity | Conditions |
|---|---|
| **ERROR** | File conflict: `{output_folder}/SKILL.md` already exists (create mode only); duplicate input names; same input in both Inputs and Defaults; `skill_process` too vague for any behavior step; `skill_outputs` entirely undefined; feasibility = `Not feasible as described`; a `Constant` or `Derived` input has `default: null` |
| **WARNING** | Inputs described vaguely; aux file has no description; `skill_description` exceeds 200 chars; feasibility = `Needs adjustment`; any suggestion from `analysis-guide.md` |

WARNING-level suggestions are specified in `analysis-guide.md`. Apply all suggestions marked `yes` in the Auto-apply column to stored values immediately; record each key in `applied_suggestions[]`. Surface suggestions marked `no` as WARNINGs in Step 2 for the user to decide.

**Idempotency rule:** Before appending text to `skill_process`, check whether that phrase is already present. If it is, skip — do not add duplicate text.

**Deduplication rule:** Before appending a key to `applied_suggestions[]`, check whether that key is already present. If it is, skip — do not add duplicate keys.

Compute `output_folder = {output-folder-prefix}{skill_name}/` if `skill_name` is known; otherwise set `output_folder` to `?`.

**Session consolidation:** Scan `{context-file}` entries for one whose `output_folder` matches.
- Found and active (no `completed`) → adopt its session ID in-memory; do not overwrite it here — the plan checkpoint will update it.
- Found and `completed: true` → remove it (remove pattern); generate a new session ID (e.g. `sess-a3f9k2`).
- Not found → generate a new session ID.

Store the session ID in-memory for all subsequent checkpoint writes in this run.

*Write session entry to context file (write pattern, key = session ID):*

```json
{
  "schema_version": 1,
  "current_step": "plan",
  "mode": "create",
  "skill_name_raw": "My Skill",
  "skill_name": "my-skill",
  "output_folder": "skills/my-skill/",
  "skill_description": "One sentence description.",
  "skill_inputs": [
    { "name": "topic", "type": "User input", "description": "The topic to process.", "default": null },
    { "name": "output-format", "type": "Constant", "description": "Output format.", "default": "markdown" }
  ],
  "skill_process": "...",
  "skill_outputs": "...",
  "aux_files": [
    { "name": "rules", "format": "md", "description": "Output format rules and examples." },
    { "name": "schema", "format": "json", "description": "Validation schema for the generated file." }
  ],
  "applied_suggestions": ["reclassify:topic:derived", "add-read-loop"],
  "generated_files": []
}
```

Replace all placeholder values with the actual extracted values. `default` is `null` for `User input` and `File` entries; a quoted string for `Constant` and `Derived`.

Proceed to **Step 2**.

---

#### Update path

##### Resolve

Ask:
> Which skill do you want to update? Provide the skill name or its folder path.

Resolve `output_folder`:
- Bare name (no `/`): `output_folder = {output-folder-prefix}{name}/`
- Path: use as-is

Try to read `{output_folder}/.skill-meta.json`. If found and valid JSON, load all field values from it, including `applied_suggestions` (default to `[]` if absent). Set `meta_source = "skill-meta"`.

If not found, silently parse `{output_folder}/SKILL.md` and (if readable) `{output_folder}/welcome.md` to infer field values. Mark fields that cannot be reliably extracted as `?`. Set `meta_source = "parsed"`.

If SKILL.md cannot be read either:
> ⚠ No skill found at `{output_folder}`. Check the name or path and try again.

Repeat until found, up to 3 attempts. After 3 failed attempts, offer: **Abort** → return to the welcome and ask what to do next.

After values are loaded from either source: store `original_aux_files[] = aux_files[]` as the pre-delta baseline.

**Session consolidation:** Scan `{context-file}` entries for one whose `output_folder` matches.
- Found and active (no `completed`) and not already the current session → adopt its session ID in-memory.
- Found and `completed: true` → remove it (remove pattern); generate a new session ID.
- Not found → generate a new session ID.

Store the session ID in-memory for all subsequent checkpoint writes in this run.

Show:
```
**[Step 1 of 3]**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Skill found: {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Important:** All output files will be regenerated from scratch — the existing files are the source of values, not structure.

Display the current values:

```
Skill name:     {skill_name}
Output folder:  {output_folder}
Purpose:        {skill_description}
Inputs:
  {for each User input / File:   "  {type:<12} {name} — {description}"}
  {for each Constant / Derived:  "  {type:<12} {name} = {default}"}
  {if skill_inputs[] is empty:   "  none"}
Process:        {skill_process}
Outputs:        {skill_outputs}
Aux files:      {aux_files[].name joined by ", ", or "None"}
```

{if meta_source = "parsed":}
ℹ Values inferred from SKILL.md (no .skill-meta.json found) — verify all fields before describing changes.

##### Intent

Ask:
> What would you like to do?
> **1. Add / fix a feature** — describe the change and I'll integrate it
> **2. Browse improvements** — I'll analyze `{skill_name}` and suggest fixes by category
> **3. Rebuild** — I'll read the full skill, propose the correct design, and implement it

Wait for selection.

##### If Feature

Ask:
> Describe the feature you'd like to add or fix.

Wait for response. Apply as a delta on top of loaded values. Set `mode = update`.

If the delta includes a skill name change: update `skill_name_raw` to the user's raw input, normalize `skill_name` to kebab-case, and recompute `output_folder = {output-folder-prefix}{skill_name}/`.

Proceed to **Analyze**.

##### If Improvement

**Auto-apply pass (silent, before fixed checks):** Run the auto-apply suggestions from `analysis-guide.md` (same logic as Phase 2 in the Create path) against the loaded values. Apply matching suggestions to stored values; log each to `applied_suggestions[]` (apply idempotency and deduplication rules); collect `informational_warnings[]`. This runs once here — it will not run again in Analyze for the Improvement path.

Read `{skill-root}/improvement-checks.md` using the mandatory read loop. If it cannot be read:
> ⚠ Could not read `improvement-checks.md` at `{skill-root}`. Check the path and try again.

Silently analyze the now-updated stored values against all checks defined in `improvement-checks.md`. For each check: skip it if its key already appears in `applied_suggestions[]`; skip it if the condition does not apply to this skill. Collect only genuine findings. Also run the generative checks described in `improvement-checks.md`.

If no findings: use the no-findings message from `improvement-checks.md` and proceed to **If Feature**.

Otherwise, display findings using the display format defined in `improvement-checks.md`.

Ask:
> Integrate? (numbers · `critical` · `major` · `all` · `none`)

- **Number(s), `critical`, `major`, or `all`** → resolve to the matching set of findings (`critical` = all critical-severity items; `major` = all major-severity items; `all` = everything listed). Then:
  - If `imp-aux-purpose` is among the selected: run it first as an interactive audit — read each aux file in full (mandatory read loop), report misplaced sections and duplicated rules, apply user-confirmed changes to the files on disk. Then continue with the remaining selected improvements.
  - Apply all other selected improvements as deltas to stored values (`skill_inputs[]`, `skill_process`, or `aux_files[]` as appropriate). Append each key to `applied_suggestions[]`; apply deduplication rule. Set `mode = update`.
  - Compute `removed_aux_files[] = original_aux_files[] − current aux_files[]`.
  - Update session entry in `{context-file}` (write pattern) with all current stored values, `current_step: "plan"`, `removed_aux_files`, and `informational_warnings[]`.
  - Proceed to **Step 2** (skip Analyze — auto-apply already ran at the top of this section).
- **'none'** → set `mode = update`. Compute `removed_aux_files[] = original_aux_files[] − current aux_files[]` (empty, since nothing changed). Update session entry in `{context-file}` (write pattern): set `current_step: "plan"`, `meta_source: {current meta_source}`, `original_aux_files: {aux_files[]}`, `removed_aux_files: []`. Proceed to **Step 2**.

##### If Rebuild

**Phase 1 — Blank-slate design (run before reading any existing file):**

Using only `skill_description`, `skill_inputs[]`, `skill_outputs`, and the names + descriptions in `aux_files[]` (no file content), silently design the ideal implementation from scratch. Ignore the existing structure entirely. Produce `ideal_design`:

- **Steps** — what steps are needed, in what order, and one-line purpose for each
- **Aux files** — which reference files are needed and what each should contain
- **Process flow** — how the skill moves from activation to completion
- **Features** — what capabilities the ideal version must have

**Phase 2 — Deep read (run after blank-slate design is complete):**

Read the full skill implementation from disk:

1. Read `{output_folder}/SKILL.md` using the mandatory read loop.
2. For each entry in `aux_files[]`: read `{output_folder}/{name}.{format}` using the mandatory read loop. If a file cannot be read, note it as missing and continue.

**Phase 3 — Gap analysis:**

Compare `ideal_design` against the actual content read in Phase 2. For each step, section, and aux file, classify:

- **keep** — already matches the ideal design; no changes needed
- **rewrite** — exists but is incorrect, outdated, or structured wrong relative to ideal
- **add** — does not exist in the current implementation; ideal design requires it
- **remove** — exists but no longer belongs in the ideal design

Generate and display the rebuild plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Rebuild plan: {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Purpose understood:
  {one sentence — what this skill is really trying to do}

Ideal design:
  Steps ({N}): {name — one-line purpose for each}
  Aux files:   {list of aux files the ideal design needs}
  Key flows:   {how the skill moves from activation to done}

Proposed structure:
  Steps: {current N} → {proposed M}
  Aux files: keep {list} · remove {list} · add {list}

Gap analysis:
  keep    {step or file} — {why it already matches the ideal}
  rewrite {step or file} — {what is wrong and how it should change}
  add     {step or file} — {what it brings; why ideal design needs it}
  remove  {step or file} — {why it is dead weight or misaligned}

New features:
  + {feature} — {why it fits this skill's purpose}

Simplifications:
  − {what gets simplified and why}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> Proceed, adjust, or cancel?

- **Proceed** → apply all proposed changes as deltas to stored values (`skill_inputs[]`, `skill_process`, `skill_outputs`, `aux_files[]` as needed). Compute `removed_aux_files[] = original_aux_files[] − current aux_files[]`. Append each applied change to `applied_suggestions[]` using the format `rebuild:{item}` (e.g. `rebuild:remove-old-rules`, `rebuild:add-validation`); apply deduplication rule. Set `mode = update`. Update session entry in `{context-file}` (write pattern): set `current_step: "plan"`, include `removed_aux_files`, store the full `ideal_design` object under `"ideal_design"`, and set `"rebuild_mode": true`. Proceed to **Step 2**.
- **Adjust** → user describes what to change in the plan (e.g. "don't remove the defaults file", "add a dry-run step first"). Update the plan accordingly. Redisplay. Ask again.
- **Cancel** → return to **Intent**.

---

##### Analyze

*This step is reached only from the Feature path. The Improvement path runs its own auto-apply pass and goes directly to Step 2.*

Apply all rules from `analysis-guide.md` to the updated values. Use the same classification and application logic as Phase 2 in the Create path:
- Classify each finding as ERROR or WARNING.
- Auto-apply all auto-apply suggestions to stored values.
- Record informational warnings in `informational_warnings[]`.
- Record each applied change in `applied_suggestions[]`.

Compute `removed_aux_files[] = original_aux_files[] − current aux_files[]` (entries present in the baseline but absent in the current list).

**Critical:** The context file is now the single source of truth. Do NOT re-read any existing skill files during Step 3. All generation uses only the stored values.

Write session entry to context file (write pattern, key = session ID): set `current_step: "plan"`, `mode: "update"`, `meta_source: {current meta_source}`. Initialize `applied_suggestions` as an empty array if this is the first analysis pass, then append any auto-applied results. Include `original_aux_files` and `removed_aux_files` so they survive a session resume:

```json
{
  "schema_version": 1,
  "current_step": "plan",
  "mode": "update",
  "meta_source": "skill-meta",
  "skill_name_raw": "my-skill",
  "skill_name": "my-skill",
  "output_folder": "skills/my-skill/",
  "skill_description": "One sentence description.",
  "skill_inputs": [
    { "name": "topic", "type": "User input", "description": "The topic to process.", "default": null },
    { "name": "output-format", "type": "Constant", "description": "Output format.", "default": "markdown" }
  ],
  "skill_process": "...",
  "skill_outputs": "...",
  "aux_files": [
    { "name": "rules", "format": "md", "description": "Output format rules and examples." }
  ],
  "original_aux_files": [
    { "name": "rules", "format": "md", "description": "Output format rules and examples." },
    { "name": "old-spec", "format": "md", "description": "Previously included, now removed." }
  ],
  "removed_aux_files": [
    { "name": "old-spec", "format": "md", "description": "Previously included, now removed." }
  ],
  "applied_suggestions": [],
  "generated_files": []
}
```

Proceed to **Step 2**.

---

### Step 2 — Plan Confirmation

**Plan phase only:** During Step 2, no output files are generated or written under any circumstances — not `SKILL.md`, not `welcome.md`, not aux files. The only permitted writes are session entry updates in `{context-file}`. Generation begins exclusively when the user confirms with `go` and Step 3 starts. (See also: Output file prohibition in On Activation — the same rule applies in Step 1.)

All findings, the full plan, and the file list appear here in one block. The user fixes ERRORs, changes anything they want, or confirms. There is no separate analysis step.

Build and display:

```
**[Step 2 of 3]**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Plan — {skill_name or "?"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{if meta_source = "parsed":}
ℹ Values inferred from SKILL.md (no .skill-meta.json found) — verify all fields.

{if skill_name_raw ≠ skill_name:}
⚠ Skill name `{skill_name_raw}` → normalized to: `{skill_name}`

ERRORS  ({count or "None"})
{for each error: one-line explanation}

{if feasibility = "Feasible" and ERRORS count = 0:}
✓ Feasible
{if feasibility = "Needs adjustment":}
⚠ Feasibility: Needs adjustment — {reason}
{if feasibility = "Not feasible as described":}
✗ Not feasible as described — {reason}

{if informational_warnings[] non-empty:}
WARNINGS  ({count})
{for each informational warning: one-line description — review before confirming}

Skill name:     {skill_name}
Output folder:  {output_folder}      ← editable in this reply
Purpose:        {skill_description}
Inputs:
  {for each User input / File:   "  {type:<12} {name} — {description}"}
  {for each Constant / Derived:  "  {type:<12} {name} = {default}"}
  {if skill_inputs[] is empty:   "  none"}
Process:        {skill_process}
Outputs:        {skill_outputs}
Aux files:      {aux_files[].name joined by ", ", or "None"}

{if applied_suggestions[] non-empty:}
AUTO-APPLIED  ({count})
{for each key in applied_suggestions[]:
  — key starts with `reclassify:`: render as "Reclassified input '{name}' as {type}"
  — key starts with `imp-`: render the Title from the fixed checks table (e.g. `imp-read-loop` → "Missing read loop")
  — key starts with `gen-`: render as "Generative: {the improvement title that was applied}"
  — otherwise: render its Display label from the auto-apply table}

Files to be {created (create mode) | overwritten (update mode)}:
  {if skill_inputs[] non-empty: {output_folder}/welcome.md}
  {output_folder}/SKILL.md
  {for each aux_file: {output_folder}/{aux_file.name}.md}
  {output_folder}/.skill-meta.json

{if removed_aux_files[] non-empty (update mode only):}
Files to be deleted (removed from aux files):
  {for each removed: {output_folder}/{removed.name}.md}

{if create mode and aux_files[] non-empty:}
⚠ Stub files — require manual content after generation:
  {list aux_files[].name}

{if update mode and any aux_files[] entry is NOT in original_aux_files[]:}
⚠ New stub files — require manual content after generation:
  {list only aux_files[] entries whose name is not in original_aux_files[]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If any `?` fields remain, list numbered follow-up questions below the plan block.

**If ERRORs or `?` fields exist:**
> Fix the items above — describe your corrections and I'll update the plan.

Parse the user's response as field updates (same logic as interview follow-ups: match each answer to the corresponding field and update the stored value). Re-run Phase 2 analysis silently on the updated values. Append any new auto-apply results to `applied_suggestions[]` — do not reset it; it accumulates across all re-runs. Recompute `output_folder` if `skill_name` changed. In update mode, recompute `removed_aux_files[]` from `original_aux_files[]` and the current `aux_files[]`. Update session entry in `{context-file}` (write pattern) with all current stored values. Redisplay the full plan block. Repeat until no ERRORs and no `?` fields remain.

**If no ERRORs and no `?` fields — create mode only (skip in update mode):**

Run suggestions analysis silently — do not output anything yet.

Generate 2–4 suggestions by combining two sources:

**Fixed rules** — apply when conditions match:

| Key | Condition | Suggestion |
|---|---|---|
| `suggest-dry-run` | `skill_outputs` mentions writing or overwriting files | "Add a dry-run option that previews output without writing" |
| `suggest-file-fallback` | `skill_inputs[]` has a `File` type | "Define what happens if the file is empty or missing — add a fallback message" |
| `suggest-tone-style` | `skill_inputs[]` has free-text that gets embedded in output | "Add a tone/style option (e.g. formal / casual) as a `Constant` with a sensible default" |
| `suggest-progress-indicator` | `skill_process` describes 2+ sequential phases | "Consider a progress indicator between phases so the user knows the skill is working" |
| `suggest-startup-check` | `aux_files[]` has 2+ entries | "Add a startup check that verifies all reference files exist before the first user question" |
| `suggest-overwrite-confirm` | `skill_outputs` mentions overwriting existing content | "Ask the user to confirm before overwriting — prevents accidental data loss" |

**Generative** — beyond fixed rules, reason about the skill's specific purpose, edge cases the current design doesn't cover, and what would make it more robust or flexible for its intended users. Only generate suggestions with genuine value — skip obvious or redundant ones.

**If 1 or more suggestions found**, show:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Suggestions for {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on this skill's design, you might want to consider:

1. {suggestion} — {one-line explanation of why it helps}
2. {suggestion} — {one-line explanation}
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> Integrate any before generating? (list by number, or 'none')

- **Number(s)** → apply selected suggestions to stored values (`skill_inputs[]`, `skill_process`, or `aux_files[]` as needed). Append each selected suggestion's key to `applied_suggestions[]` (do not reset — it accumulates across all analysis re-runs; apply deduplication rule). Update session entry in `{context-file}` (write pattern). Redisplay the updated plan block. Re-evaluate both fixed rules and generative suggestions on the updated values — only surface suggestions whose key is not already in `applied_suggestions[]`. If new suggestions remain, show them and ask again. Then proceed to `go` prompt.
- **'none'** → update session entry in `{context-file}` (write pattern, key = session ID): set `current_step` to `"generate"`. Proceed to Step 3.

**If no suggestions found**, update session entry in `{context-file}` (write pattern, key = session ID): set `current_step` to `"generate"`. Proceed directly to Step 3.

---

> Type `go` to generate, or describe what to change.

- **`go`** (or any affirmative) → update session entry in `{context-file}` (write pattern, key = session ID): set `current_step` to `"generate"`. Proceed to Step 3.
- **Design change** (inputs, process, outputs, output folder, or aux files — e.g. "add an input for target audience", "make the output JSON instead", "add an aux file for validation rules") → update stored values, recompute `output_folder` if `skill_name` changed, re-run Phase 2 analysis silently, append any new auto-apply results to `applied_suggestions[]`, recompute `removed_aux_files[]` from `original_aux_files[]` and current `aux_files[]` (update mode only), update session entry in `{context-file}` (write pattern), redisplay the plan. Repeat.
- **Wording or path correction** (e.g. "fix the typo in the description", "rename the output folder to `my-skill-v2`", "reword the process step") → update inline, redisplay the plan. No re-analysis needed.

---

### Step 3 — Generate and confirm

**Update diff preview (update mode only):**

Before displaying the step counter or generating any files, show a compact summary of what changed from the original loaded values:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Changes: {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Inputs:    added {list or "none"} · removed {list or "none"}
Aux files: added {list or "none"} · removed {list or "none"} · kept {list or "none"}
Process:   {brief one-line summary of what changed, or "unchanged"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Proceed directly to generation.

---

Display `**[Step 3 of 3]**` before beginning any sub-step output.

**3a — Generate welcome.md**

Apply the Welcome pattern from `skill-conventions.md`: match the case based on which input types are present, use the corresponding template, and follow all rules in that section.

Write to `{output_folder}/welcome.md` (skip this sub-step if Case 4 — no inputs of any kind). After writing, update session entry in `{context-file}` (write pattern): append `{output_folder}/welcome.md` to `generated_files[]`.

**3b — Generate SKILL.md**

**Rebuild mode** (session entry has `rebuild_mode: true`):

Do NOT load `skill-template.md`. Generate `SKILL.md` from scratch using `ideal_design` from the session checkpoint as the authoritative step blueprint, combined with the step structure rules in `skill-conventions.md`. For each step in `ideal_design.steps[]`, write a complete, detailed step section that reflects the actual behavior of this skill — not a generic placeholder skeleton. The `## On Activation` section always follows the synthesis rules in the `## On Activation` generation block below.

**Create / Feature / Improvement mode:**

Read `{skill-root}/skill-template.md` using the mandatory read loop. If it cannot be read:
> ⚠ Could not read `skill-template.md` at `{skill-root}`. Check the path and try again.

Use `skill-template.md` as the base. Fill all placeholders using the collected values — `applied_suggestions[]` are already reflected in `skill_inputs[]`, `skill_process`, and other stored values, so no additional data source is needed. Follow step structure rules from `skill-conventions.md`.

Write to `{output_folder}/SKILL.md`. After writing, update session entry in `{context-file}` (write pattern): append `{output_folder}/SKILL.md` to `generated_files[]`.

**`## On Activation` generation — always synthesized, never copied:**

Build this section from the following rules. Do not copy it from `skill-template.md` or from the existing file.

**Always include:**
1. Defaults loading — try to read `{skill-root}/defaults.md`; if found, parse each line as `{key}: {value}` and store in-memory as overrides.
2. Welcome display — read `{skill-root}/welcome.md` in full and display it. Apply the case rules from `skill-conventions.md` Welcome pattern. Skip if Case 4 (no inputs of any kind).
3. Proceed directly to the normal flow — no confirmation prompt, no "get started" language.

**Add if `skill_inputs[]` has `Constant`/`Derived` entries:**
- "change defaults" on-demand trigger: when the user says "change defaults", display the defaults table populated from those inputs with current in-memory values. After each change: update in-memory, persist to `{skill-root}/defaults.md`, echo `✓ {name} → {new-value}`. Repeat until done, then continue from where the skill was interrupted.

**Add if `skill_inputs[]` has `User input`/`File` entries:**
- "show inputs" on-demand trigger: when the user says "show inputs", display the inputs table (name + Required column). Then continue from where the skill was interrupted.

**Add if `skill_process` mentions session state, context file, resume, or checkpoint:**
- Session check step (after defaults loading, before welcome): try to read the context file. If found and valid, show a resume banner and ask whether to resume, start new, or another option as appropriate for this skill's flow.

**Convention rules (create and update mode):**
- Frontmatter must contain only `name` and `description` — strip any extra fields
- Never include a `Stop here` instruction
- Never include "Want to get started?", "Ready to begin?", or "Say go to start" prompts

**3c — Delete removed auxiliary files (update mode only)**

If `removed_aux_files[]` is non-empty, delete each `{output_folder}/{name}.{format}` (use `format` from the entry; default `"md"` if absent). Silently skip any file that does not exist on disk.

**3d — Generate auxiliary files**

For each entry in `aux_files[]`:

Resolve the output path as `{output_folder}/{name}.{format}` (use `format` from the entry; default `"md"` if absent).

**If the file is new** (name not in `original_aux_files[]`) — create a stub at that path:

- **`.md` stub:**
  ```
  # {name}

  {description}

  ## Content

  _{Fill in before the skill is used.}_
  ```
  Add implied sub-sections based on the description:
  - "rules for output format" → `## Rules`, `## Examples`
  - "configuration schema" → `## Fields`, `## Example`
  - "interview questions for X" → `## Questions`, `## Validation notes`

- **`.json` stub:**
  ```json
  {}
  ```

Track as a stub regardless of format.

**If the file already exists** (name present in `original_aux_files[]`):

- **Rebuild mode** — always rewrite the entire file from scratch. Do not attempt to identify and preserve unaffected sections. Use `ideal_design` and current stored values as the authoritative source. Read the existing file content only to extract rules and definitions that remain valid in the ideal design — then discard the old structure entirely.
- **Feature / Improvement mode** — adapt it:
  1. Read the existing `{output_folder}/{name}.{format}` using the mandatory read loop.
  2. Identify which sections of the existing content are affected by the delta from this update session (new inputs, changed process steps, added/removed behavior).
  3. Rewrite only the affected sections. Preserve all content that remains valid — do not blank the file or replace unaffected sections with stubs.
  4. Write the updated content back to `{output_folder}/{name}.{format}`.

After writing each file (stub or adapted), update session entry in `{context-file}` (write pattern): append `{output_folder}/{name}.{format}` to `generated_files[]`.

**3e — Write .skill-meta.json**

Write `{output_folder}/.skill-meta.json`. This is the authoritative data source for future Update Mode runs — always write it, even on update.

**Author block — create mode:** Read `{skill-root}/.skill-meta.json` (skill-builder's own meta). Use `author.name`, `author.email`, and `author.team` if present. If the file is not found or any field is missing, leave those fields as empty strings.

**In update mode:** before writing, read the existing `.skill-meta.json`. Carry forward the `author` block and any other fields not in the standard schema below (e.g. `skill_version`, or any custom fields the skill owner added). Do not drop them. Only overwrite the standard schema fields with the current stored values.

If `skill_version` is present in the existing file, infer the bump level from the delta applied during this update session — do not ask the user:

| Bump | Conditions (any one is sufficient) |
|---|---|
| **major** | Skill renamed; one or more inputs removed; `skill_outputs` type changed (e.g. files → console); `skill_process` restructured with 3+ step changes |
| **minor** | One or more inputs added; one or more aux files added; one or more new process phases or steps added; improvements selected from the Improvement path |
| **patch** | Description or wording changes only; minor process tweaks; no structural changes to inputs, outputs, or aux files |

Apply the highest-matching bump level. If no clear delta is present, default to **patch**.

- **major** → increment the major segment, reset minor and patch (e.g. `1.1.0` → `2.0.0`)
- **minor** → increment the minor segment, reset patch (e.g. `1.1.0` → `1.2.0`)
- **patch** → increment the patch segment (e.g. `1.1.0` → `1.1.1`)

Write the bumped version to `skill_version` in the output file.

**In create mode:** write only the standard schema fields.

Standard schema fields: follow the `.skill-meta.json` structure defined in `skill-conventions.md`. Field group order: identity → authorship → definition → build tracking.

After writing, update session entry in `{context-file}` (write pattern): append `{output_folder}/.skill-meta.json` to `generated_files[]`.

**3f — Mark session as completed**

Update session entry in `{context-file}` (write pattern, key = session ID): set `completed: true`. Then scan for any other entry with `completed: true` — if found, remove the oldest one (remove pattern) so at most 1 completed entry exists at a time. Do not remove the current entry — `skill_name` and `output_folder` inside it power the "Last built" banner on next activation.

**3g — Confirm**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Skill {created (create mode) | updated (update mode)}: {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{if skill_version present:}
Version: {skill_version}

Files written:
  {list all written files with relative paths}

{if removed_aux_files[] non-empty:}
Files deleted:
  {for each removed: {output_folder}/{removed.name}.md}

Invoke with:
  /{skill_name}

{if stub files were created:}
⚠ Stub files need content before the skill is usable:
  {list stub files}

{if mode = "update" and new aux files were created (stub):}
⚠ New stub files need content before the skill is usable:
  {list stub-only files}
```

**Post-generation quality check (silent):**

After the confirm block, read `{skill-root}/improvement-checks.md` using the mandatory read loop and run all checks rated `critical` or `major` against the stored values of the skill just generated. Skip any check whose key already appears in `applied_suggestions[]`.

If findings exist, display using the same severity format as the Improvement path:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Quality check: {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{findings grouped by severity — same display format as Improvement path}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> Integrate any before finishing? (numbers · `critical` · `major` · `all` · `none`)

- **Selection** → apply selected improvements to stored values; append keys to `applied_suggestions[]` (deduplication rule); set `mode = update`; write session entry in `{context-file}` (write pattern); proceed directly to Step 3 (skip Step 2) — only regenerate files affected by the selected improvements.
- **`none`** → proceed to completion menu.

If no findings: proceed directly to completion menu.

Show:

```
Working in: {output_folder}

What's next?
  1. Iterate on `{skill_name}`
  2. Start something new
  3. Done
```

- **1 (Iterate)** → reload all field values from `{output_folder}/.skill-meta.json` (just written). Re-enter the **Update path** at **Intent** — skip the "which skill?" question and the Resolve display, since `skill_name` and `output_folder` are already known. Set `mode = update`.
- **2 (New)** → remove `active_session_key` from `{context-file}` (remove pattern). Set `has_session = false`. Return to the **Create path** (show the brief prompt).
- **3 (Done)** → end.
