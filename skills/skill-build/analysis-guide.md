# Analysis Guide

Rules for conflict detection, missing piece identification, suggestions, and feasibility assessment. Analysis runs silently during Step 1 extraction; findings surface in the Step 2 Plan Confirmation.

---

## Conflict rules

Flag as a conflict when any of these conditions are true:

| Condition | Conflict message |
|---|---|
| `{output_folder}/SKILL.md` already exists | A skill already exists at `{output_folder}`. Choose a different output folder or rename the skill. |
| The same input name appears in both `User input`/`File` and `Constant`/`Derived` classification | Input `{name}` cannot be in both Inputs and Defaults. Decide: does the user provide it each run, or does it have a built-in default? |
| Two entries in `skill_inputs[]` have the same name | Duplicate input `{name}`. Merge or rename them. |

---

## Missing piece rules

Flag as missing when any of these conditions are true:

| Condition | Missing piece message |
|---|---|
| `skill_inputs` contains only "some files" or "a file" with no format or path details | Inputs are too vague. Specify what type of files, what format, and how the user provides them (typed path, prompted, etc.). |
| `skill_process` contains only "analyze", "process", or "handle" with no explanation of what is produced | Process is undefined. Explain what transformation or analysis happens and what intermediate result it produces. |
| `skill_outputs` does not include a file path pattern, directory, or console output description | Outputs are undefined. Specify where files are written and in what format, or describe the console output. |
| An entry in `aux_files[]` has no description | Auxiliary file `{name}` has no description. Explain what it contains and how the skill uses it. |
| `skill_description` is longer than 200 characters | Description exceeds 200 characters. Shorten it — it is used as an index entry. |
| A `Constant` or `Derived` input has `default: null` in the context file | Input `{name}` is classified as `{type}` but has no default value. Provide the built-in default, or reclassify as `User input` if the user must supply it each time. |

---

## Suggestion rules

Each suggestion has an **Auto-apply** flag. Suggestions marked `yes` are applied automatically to stored values before surfacing findings — the skill-build updates the relevant field and logs the key to `applied_suggestions[]`. Suggestions marked `no` are surfaced as WARNINGs in Step 2 for the user to decide.

| Key | Condition | Display label (shown in AUTO-APPLIED) | What to update | Auto-apply |
|---|---|---|---|---|
| `reclassify:{name}:Constant` | An input description says "always the same", "fixed", "preset", "never changes", or "hardcoded" but is classified as `User input` | `Reclassified input '{name}' as Constant` | `skill_inputs[n].type` → `Constant`; set `default` to a sensible inferred value | yes |
| `reclassify:{name}:Derived` | An input name or description mentions "current date", "today", "project root", "auto-detected", "inferred", "derived from", or "from skill name" but is classified as `User input` | `Reclassified input '{name}' as Derived` | `skill_inputs[n].type` → `Derived`; set `default` to the inferred runtime expression | yes |
| `reclassify:{name}:File` | An input name or description mentions "path to", "file path", "location of", or "file containing" but is classified as `User input` | `Reclassified input '{name}' as File` | `skill_inputs[n].type` → `File` | yes |
| `add-read-loop` | `skill_inputs` mentions reading one or more files | `Added mandatory read loop for file inputs` | Append to `skill_process`: "reads input files using the mandatory read loop" | yes |
| `add-output-dir-confirm` | `skill_outputs` mentions writing files | `Added output directory confirmation step` | Append to `skill_process`: "asks user to confirm output directory before writing" | yes |
| `add-format-menu` | `skill_outputs` mentions 3 or more distinct format options | `Added numbered format selection menu` | Append to `skill_process`: "shows a numbered format selection menu before generating" | yes |
| `add-final-confirm` | The skill produces files in a location derived from user input | `Added final confirmation step listing written files` | Append to `skill_process`: "lists all written files with paths in the final step" | yes |
| `add-sanitize` | `skill_inputs` includes free-text input that will be embedded in file content | `Added input validation and sanitization` | Append to `skill_process`: "validates and sanitizes user-provided text before embedding in output" | yes |
| `add-load-reference-files` | `aux_files[]` is non-empty | `Added reference file loading step` | Prepend to `skill_process`: "loads all auxiliary reference files using the mandatory read loop in Step 1 before any user interaction" | yes |
| — | Two inputs have names or descriptions that refer to the same concept (e.g. "output-folder" and "output-folder-prefix") | These inputs may overlap: `{name-a}` and `{name-b}`. Confirm they are distinct. | — | no |
| — | `skill_process` mentions "interview" or "ask the user" | Ensure each question is asked one at a time and waits for a response. | — | no |
| — | `skill_process` or `skill_outputs` describes more than 3 unrelated operations | Consider splitting into multiple skills — one per distinct operation. | — | no |
| — | `skill_process` describes a classification table, rule set, or template with 5 or more distinct rules/cases written inline | Large inline reference content — consider extracting to an aux file so SKILL.md stays focused on orchestration. | — | no |

---

## Feasibility rules

Assign the feasibility label based on these rules. Apply the most severe label that matches.

### Not feasible as described

Flag when:
- The skill requires outbound network requests not covered by a configured MCP tool (e.g. "fetch data from an external API")
- The skill requires executing arbitrary shell commands beyond reading and writing files
- The skill requires persistent state across sessions without a file-based storage mechanism

### Needs adjustment

Flag when:
- The skill describes more than 3 unrelated operations (suggest splitting; this does not block generation but should be resolved)
- The process is described so vaguely that behavior would be unpredictable at runtime (e.g. "figure out the best structure")
- An auxiliary file is referenced by name in the process but not listed in `aux_files[]`
- The skill's output format depends on user input that has no validation or fallback

### Feasible

Assign when:
- All inputs are file paths, free text, or user menu selections
- The process only involves reading, analyzing, and writing files using standard Claude Code tools
- All outputs are files written to a known directory or clearly described console text
- Behavior steps can be enumerated clearly without ambiguity
