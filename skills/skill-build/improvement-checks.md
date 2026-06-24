# Improvement Checks

Fixed checks run during the Improvement path and the post-generation quality check. Each check has a unique key tracked in `applied_suggestions[]` — skip any check whose key already appears there, and skip any whose condition does not apply to this skill.

---

## Fixed checks

| Key | Category | Severity | Condition | Title | Problem | Fix |
|---|---|---|---|---|---|---|
| `imp-file-fallback` | Error Handling | critical | `skill_inputs[]` has a `File` type but no missing-file fallback in `skill_process` | Missing file fallback | No defined behavior when an input file is absent or empty | Add an error message and recovery path for missing or empty input files |
| `imp-overwrite-guard` | Error Handling | critical | `skill_outputs` mentions writing files but no overwrite confirmation in `skill_process` | No overwrite guard | Existing files can be silently overwritten | Add a confirmation step before overwriting any existing output file |
| `imp-fail-fast` | Performance | critical | `skill_inputs[]` has 1+ `File` type and `skill_process` has 3+ phases but no mention of validating inputs before processing begins | Late input validation | Invalid or missing file inputs are discovered mid-flow, after output tokens have already been spent on earlier steps | Validate all `File` inputs at the top of Step 1 — check existence and non-empty content before any processing or user interaction begins |
| `imp-read-loop` | Performance | major | `aux_files[]` non-empty but no read loop mentioned in `skill_process` | Missing read loop | Reference files loaded without chunked reads risk truncation on large files | Add the mandatory read loop (offset + 200-line chunks) for all aux file reads |
| `imp-session-state` | Performance | major | `skill_process` has 2+ phases but no context file or session tracking | No progress state | If interrupted mid-run, the skill restarts from scratch; concurrent executions in the same repo overwrite each other | Add a `sessions.json` checkpoint keyed by auto-generated session ID (see `skill-conventions.md`) so the skill supports resume and concurrent runs |
| `imp-one-at-a-time` | UX / Flow | major | `skill_process` asks multiple questions but no one-at-a-time rule | Bulk questions | Multiple questions in one turn overwhelm the user | Enforce asking one question per turn and waiting for a response |
| `imp-confirm-chain` | UX / Flow | major | `skill_process` has 2+ sequential confirmation or approval prompts for the same action without new information shown between them | Confirmation chain | Multiple prompts ask the user to confirm the same decision — each extra round trip adds latency with no new decision point | Merge confirmation prompts into a single point; the first approval should commit to the action unless new information is presented between prompts |
| `imp-sanitize` | Input Handling | major | `skill_inputs[]` has free-text embedded in output but no sanitization in `skill_process` | No input sanitization | User text embedded in output without sanitization can produce malformed results | Add a validation and sanitization step before embedding free-text inputs |
| `imp-inline-defaults` | Input Handling | major | `skill_process` or `skill_outputs` contains specific hardcoded values (paths, format strings, folder names) that never change across runs but are not declared in `skill_inputs[]` | Inline hardcoded values | Values that are constant across runs are embedded in the process rather than declared as `Constant` inputs — they cannot be reconfigured without editing the skill | Extract each hardcoded value to a `Constant` input with a sensible default in `skill_inputs[]`; reference it by name in the process |
| `imp-startup-check` | Robustness | major | `aux_files[]` has 2+ entries but no startup existence check in `skill_process` | No startup check | Missing reference files cause cryptic mid-flow failures | Add a startup check that verifies all reference files exist before Step 1 |
| `imp-aux-purpose` | Aux Files | major | `aux_files[]` has 2+ entries | Aux file audit | Aux files may mix concerns or duplicate rules from each other or from SKILL.md over time | Interactive audit when selected: read each aux file in full (mandatory read loop), report misplaced sections and duplicated rules, apply user-confirmed changes to the files on disk. Does not modify stored values — operates on aux files directly. |
| `imp-inline-bloat` | Token Cost | major | `aux_files[]` is empty but `skill_process` mentions rules, templates, or classification tables with multiple cases | Inline reference bloat | Reference content embedded in SKILL.md loads into every context window — even runs that never reach that branch pay the token cost | Extract inline rule sets, templates, or classification tables to an aux `.md` file; add it to `aux_files[]`; replace inline content with a read reference |
| `imp-progress-indicator` | UX / Flow | minor | `skill_process` has 3+ steps but no progress indicator | No progress indicator | User has no sense of how far along the flow they are | Add a step counter or phase label between steps |
| `imp-file-listing` | Output & Files | minor | Final step in `skill_process` does not mention listing written files | No file listing | Users don't know what was written or where | Add a final confirmation listing all written file paths |
| `imp-format-menu` | Output & Files | minor | `skill_outputs` includes generated content but no format selection in `skill_process` | No format menu | Output format is fixed — users cannot choose between alternatives | Add a numbered format selection menu before generating |
| `imp-retry-cap` | Robustness | minor | `skill_process` accepts user input in a loop but no maximum retry limit | No retry cap | Invalid input can loop indefinitely with no way to abort | Add a retry cap (e.g. 3 attempts) with an explicit abort option |
| `imp-lazy-load` | Token Cost | minor | `aux_files[]` has 2+ entries and `skill_process` mentions conditional branches, format selection, or mode switching | Eager aux file loading | All aux files are loaded at startup even when some branches never use all of them — every unused file wastes context tokens | Move each aux file read to the step where it is first needed rather than loading all files unconditionally at startup |
| `imp-redundant-reads` | Performance | minor | `aux_files[]` is non-empty and any file name appears to be referenced in more than one step of `skill_process` | Redundant file reads | The same reference file is read in multiple steps — each read reloads the full file into the context window | Load each aux file once (in the startup or first reference step) and keep it in context for the entire run; remove duplicate reads from subsequent steps |
| `imp-unnecessary-confirms` | Performance | minor | `skill_process` has 2+ steps and mentions asking the user to confirm, proceed, or continue between steps that have no user decision point | Unnecessary confirmation turns | Passive "ready to proceed?" prompts between automatic steps add a round trip and output tokens with no user value | Remove confirmation prompts between steps where the user has nothing to decide — proceed automatically after each step completes |
| `imp-skip-existing` | Performance | minor | `skill_outputs` mentions writing files and `skill_process` does not mention checking whether output already exists before regenerating | No output reuse check | The skill regenerates all output on every run even when inputs have not changed — wasting tokens and potentially overwriting content the user edited | Before generating, check if output files already exist; offer to skip or diff-update instead of full regeneration when inputs are unchanged |
| `imp-overgenerate` | Token Cost | minor | `skill_process` mentions generating content that is subsequently summarized, filtered, ranked, or selected from in a later step | Over-generation | Tokens are spent generating content that is then discarded — only the filtered subset appears in the final output | Apply selection criteria before generation: ask the user to narrow scope or define constraints upfront so only relevant content is generated |

---

## Generative checks

Beyond the fixed checks above, reason generatively: given the skill's specific purpose, inputs, and process, identify up to 3 additional improvements in any category that would genuinely increase robustness, clarity, or usefulness. Assign each a unique key (`gen-1`, `gen-2`, `gen-3`). Skip generic suggestions with no specific connection to this skill's design. Skip any that duplicate a fixed check already collected.

---

## No findings message

If no findings exist in any category after running all checks:

> ✓ No improvements flagged for `{skill_name}`. What would you like to change?

Treat the response as a Feature request and proceed to **If Feature**.

---

## Display format

Display findings grouped by severity (critical → major → minor). Omit a severity group entirely if it has no findings. Number items sequentially across all groups.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Improvements for {skill_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

● critical
  {n}. {title}  ·  {category}
     {problem}
     → {fix}

● major
  {n}. {title}  ·  {category}
     {problem}
     → {fix}

○ minor
  {n}. {title}  ·  {category}
     {problem}
     → {fix}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The same format applies in the post-generation quality check — replace the header title with `Quality check: {skill_name}`.
