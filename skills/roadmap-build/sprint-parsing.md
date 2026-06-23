# Sprint File Parsing Rules

Used by Step 2 of roadmap-build to parse any sprint or task board file into a canonical task list.

Do not rely on format detection. Read the full file content and infer its structure using judgment.

---

## Rule 1 — Identify groupings

Look for any structural pattern that clusters tasks together: parent keys in YAML, epic/milestone headers in markdown, Epic Link columns in CSVs, indentation, numbering prefixes (e.g. `1-`, `2-`), or section headings. These become the `epic` field.

## Rule 2 — Identify tasks

Within each group, find the individual work items: child keys in YAML, table rows in markdown/CSV, list items, or named entries. These become `task_name`.

## Rule 3 — Identify status

Find any value that describes progress. Accept any vocabulary and normalize to four canonical values:

| → Canonical | Accept |
|---|---|
| `done` | done, complete, completed, closed, merged, shipped, released |
| `in_progress` | in-progress, in_progress, review, in-review, active, implementing, testing |
| `planned` | backlog, ready-for-dev, todo, planned, open, not-started, queued |
| `at_risk` | blocked, impediment, at-risk, on-hold, stalled |

## Rule 4 — Identify story points

Any numeric field named `points`, `sp`, `effort`, `estimate`, or `story_points`. Leave blank if not present.

---

## Output format

```
sprint_tasks = [
  { task_name, status, epic, story_points },
  ...
]
```

Matching sprint task groups to PRD initiatives is done in Step 3 (Analyze), where the full initiative list is available.
