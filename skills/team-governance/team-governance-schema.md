# Team Governance Document Schema

Defines the format for the team governance file. This file is the single source of truth for team composition, platform identifiers, and project resources.

**Canonical location:** `{skill-root}/governance.md`  
**Managed by:** `/team-governance`

---

## Full format

The file is written dynamically — columns in the Team Members table reflect only the tools selected during setup. The template below shows all possible sections; the actual file will have only the rows and columns relevant to the project.

```markdown
---
document: team-governance
updated: {date}
---

# Team Governance

## Project Resources

| Resource         | Identifier |
|------------------|------------|
| {Resource name}  | {value}    |

<!-- One row per collected project_resource key-value pair.
     Keys come from tools-reference.json project_inputs[].extracts field names.
     Examples: Jira Project Key, GitHub Owner, GitHub Repo, Slack Channel, etc.
     Add rows for any custom tool your team uses. -->

## Team Members

| Name | Role | Reviewer | Hours/Day | {Tool account column...} | Notes |
|------|------|----------|-----------|--------------------------|-------|
| {Full Name} | {role_key} | Yes/No | {n} | {account value} | {notes} |

<!-- Tool account columns are inserted for each tool that has member_inputs defined
     in tools-reference.json, in the order tools were added during setup.
     Custom tool columns (added via "Other") appear after standard tool columns. -->

## Constraints
{Freeform text — capacity limits, freeze periods, onboarding notes. Leave empty if none.}
```

---

## Section definitions

### Project Resources

Each row is a key-value pair for a project-level resource. Rows are free-form — add or remove any platform your project uses. The skill reads every row and stores it in `project_resources` for use by calling skills (e.g., Jira project key is used by `epics-to-tickets`).

**Supported keys (recognized and used by skills):**

| Key | Used by |
|---|---|
| Jira Cloud ID | epics-to-tickets, sprint tracking |
| Jira Project Key | epics-to-tickets |
| Jira Board URL | sprint file detection |
| GitHub Owner | PR automation |
| GitHub Repo | PR automation |
| GitHub Repo URL | documentation links |
| Figma Team ID | design asset linking |
| Figma File URL | design asset linking |
| Slack Workspace | notifications |
| Slack Channel | notifications |
| Confluence Space | documentation linking |
| Linear Team ID | ticket sync |
| Notion Workspace | documentation linking |

Unknown keys are stored as-is and passed through to calling skills without modification.

---

### Team Members

Each row is one person. All columns except **Name** and **Role** are optional but recommended.

| Column | Description |
|---|---|
| **Name** | Full name (required) |
| **Role** | Primary role key (mapped from freeform input using `team-roles-reference.json`; unrecognized roles stored as `other`) |
| **Reviewer** | `Yes` if this person reviews code; `No` otherwise |
| **Hours/Day** | Availability in hours per working day (default: value of `default-hours-per-day` from defaults.md, or `8` if not set) |
| **GitHub** | GitHub username (no `@`) |
| **Jira ID** | Jira account ID — format varies: `712020:uuid` (Atlassian ID) or hex string |
| **Figma** | Figma username or email |
| **Slack** | Slack handle without `@` |
| **Confluence** | Confluence username or email |
| **Notes** | Part-time schedule, join date, role overlap, constraints |

Additional platform columns can be added freely. Any unrecognized column is stored as a custom account field.

---

### Constraints

Freeform text. Examples:
- "Anderson is part-time Wednesday–Friday"
- "Franklin joins sprint 3 (week 5)"
- "Code freeze from 2026-07-01 to 2026-07-14"
- "QA available only after sprint 2"

---

## Minimum viable file

A file with only Name, Role, and Reviewer columns is valid. All other columns are optional and completed over time via the skill's completion flow.

```markdown
---
document: team-governance
updated: 2026-06-04
---

# Team Governance

## Project Resources

| Resource         | Identifier                        |
|------------------|-----------------------------------|
| Jira Project Key | RP                                |
| GitHub Owner     | my-org                            |
| GitHub Repo      | my-repo                           |

## Team Members

| Name             | Role             | Reviewer | Hours/Day | GitHub   | Jira ID      | Notes |
|------------------|------------------|----------|-----------|----------|--------------|-------|
| Franklin Lee     | senior_developer | Yes      | 8         | franklee | 712020:abc   |       |
| Anderson Monroy  | tech_lead        | Yes      | 8         | andersonm| 712020:xyz   |       |

## Constraints
Franklin joins sprint 3 (week 5).
```
