---
name: team-governance
description: Configure your project team, platform tools, and member accounts to generate a team governance document.
---

# Team Governance

Configure your project team, platform tools, and member accounts to generate a team governance document.

## How to invoke

`/team-governance`

Can also be invoked by other skills (roadmap-build, epics-to-tickets) mid-flow.

---

## On Activation

1. **Load defaults** — try to read `{skill-root}/defaults.md`. If found, parse each line as `{key}: {value}` and store in-memory as overrides. Built-in default:
   - `default-hours-per-day`: `8`

2. Read `{skill-root}/welcome.md` in full and display it. Proceed directly to Step 1.

   If the user says **"show inputs"**, display:

   | # | Input | Required |
   |---|-------|----------|
   | 1 | **tools** — Platforms your team uses (Jira, GitHub, Slack, etc.) and their workspace/project URLs | ✅ Required |
   | 2 | **team-members** — Member names, roles, hours per day, and reviewer status | ✅ Required |
   | 3 | **platform-accounts** — Per-member account IDs or usernames for each configured tool | ⬜ Optional |
   | 4 | **constraints** — Team scheduling notes or availability constraints | ⬜ Optional |

   Then continue from where the skill was.

   If the user says **"change defaults"**, display:

   | Setting | Current value | Description |
   |---------|---------------|-------------|
   | `default-hours-per-day` | `{value}` | Default hours per day applied to new members |

   After each change: update in-memory, persist to `{skill-root}/defaults.md`, echo `✓ {name} → {new-value}`. Repeat until done, then continue from where the skill was.

---

## Behavior

**`{skill-root}`** — absolute path to the folder containing this SKILL.md. Resolve it at startup from the path used to load this skill.

**Output file:** always `{skill-root}/governance.md` — fixed name, one file per installation.

---

### Step 1 — Load reference files

Read all three files in full before doing anything else.

- `{skill-root}/tools-reference.json` — tool definitions with project-level and member-level input fields
- `{skill-root}/team-roles-reference.json` — role alias map and reviewer defaults
- `{skill-root}/team-governance-schema.md` — output file format template

Use the mandatory read loop for each file:

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

---

### Step 2 — Locate or create

**2a — Check for an in-progress session**

Try to read `{skill-root}/governance-session.json`. If found and valid JSON, display:
```
Resuming session — step: {current_step}
```
Ask: > Resume, or start fresh? (resume / new)

- **resume:** load `current_step` from session. Read and parse `governance.md` if it exists. Route by `current_step`:

  | `current_step` | Route |
  |---|---|
  | `"resources"` | Step 3 — restore from `pending_tools` / `pending_resources` in session. Skip 3b for tools already in `pending_tools`; resume 3b at the first tool not yet collected. If all selected tools are in `pending_tools`, go to 3c. The tool selection prompt (3a) is not re-displayed on resume — to change the tool list the user must start a new session. |
  | `"members"` | Action menu (2c) — the user picks which member action to continue |
  | `"review"` | Step 5 |

  Resuming at `"members"` always returns to the action menu, not to a specific Step 4 sub-mode. The action menu re-reads `governance.md` before displaying the header.

- **new:** delete `governance-session.json`. Proceed to 2b.

If no session exists, proceed to 2b.

---

**2b — Check for governance.md**

Try to read `{skill-root}/governance.md`.

**Found:** parse it into memory — Project Resources table, Team Members table (columns = active tools), Constraints section. Write session `{ "current_step": "resources" }`. Go to **2c**.

**Not found:** we are starting a new governance file. Write session `{ "current_step": "resources" }`. Go to **2c**.

---

**2c — Action menu**

Always shown — for both new and existing files. Always re-reads `governance.md` (if it exists) before rendering the header, so counts and tool lists are current after any write operation.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  governance.md
  {n} members · {tools or "no tools yet"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What do you want to do?
  1  {Set up | Update} project resources{  ← start here  (if no tools yet)}
  2  Register multiple members
  3  Update my own info
  4  Edit a specific member{              (no members yet)}
  5  Review & finalize
```

Options 4 and 5 show `(no members yet)` as a hint if `members` is empty. If picked anyway:
> No members yet — add at least one member first via option 2 or 3.

Write session before routing — overwrite the full session, clearing any `pending_tools` or `pending_resources` left from a previous interrupted Step 3. `current_step` by choice:

| Choice | `current_step` | Route |
|---|---|---|
| 1 | `"resources"` | Step 3 (loops at 3a until enter). New file → action menu after; existing file → Step 5 after |
| 2 | `"members"` | §4-bulk → Step 5 |
| 3 | `"members"` | §4-self → action menu |
| 4 | `"members"` | single-edit → Step 5 |
| 5 | `"review"` | Step 5 |

**If `governance.md` does not exist when a member-related choice (2, 3, or 4) is made:** create it immediately using the template from `team-governance-schema.md` with empty Project Resources and Team Members tables (header row only, no tool account columns yet). Resources can be added later via "update resources" in Step 5. Then proceed with the chosen action.

---

### Step 3 — Project resources

**Source of truth:** `governance.md` Project Resources table. All changes in this step write to that file immediately on confirmation. Before `governance.md` exists, changes buffer in the session under `pending_tools` and `pending_resources`.

---

**3a — Tool selection**

**New file (no existing resources):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Resources
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Which tools does your team use?
  1  Jira
  2  GitHub
  3  Figma
  4  Slack
  5  Confluence
  6  Linear
  7  Notion
  8  Environments  (staging / production URLs)
  9  Other         (custom tool)

Enter numbers separated by spaces, or "all":
```

At least one tool must be selected for a new file. Pressing enter alone without a selection is not valid — re-display the prompt.

**Existing file (has resources):**

Show current resources with status, then offer targeted updates:
```
  Current resources:
    ✓ Jira    workspace: myorg · project: RP
    ✓ GitHub  myorg/my-repo
    ⚠ Slack   channel missing

Add a tool or fix a gap? (tool names or numbers space-separated, or press enter to skip)
```

Pressing enter exits Step 3: write session `{ "current_step": "review" }` and go to Step 5 — whether or not there are `⚠` gaps (gaps will appear in Step 5 and can be fixed from there).

After 3b + 3c confirm a tool, return here so the user can add more tools or press enter to exit.

---

**3b — Per-tool input collection**

For each selected tool, show its inputs one tool at a time. No URL pattern matching — inputs are asked explicitly in context of the known tool.

After each tool's inputs are confirmed, write the tool slug and its collected values to the session as `pending_tools` and `pending_resources`. This ensures resume during Step 3 restores progress if interrupted.

Read prompt labels and `extracts` field names from `tools-reference.json` for the selected tool. Collect per-tool inputs in the format shown below.

```
── Jira ──────────────────────────────────────────────
  Project URL:                    →
  Cloud ID (optional):            →
```

```
── GitHub ────────────────────────────────────────────
  Repository URL:                 →
```

```
── Slack ─────────────────────────────────────────────
  Workspace URL (optional):       →
  Main channel name (without #):  →
```

For URL fields: extract identifiers in context of the known tool using the `extracts` field names defined in `tools-reference.json`.

For **Environments** (option 8):
```
── Environments ──────────────────────────────────────
  Staging URL (primary):          →
  Staging URL (secondary, opt):   →
  Production URL:                 →
```

For **Other** (option 9):
```
Tool name:                        →
Does each member have an account? (yes / no)
```
- **yes:** ask `Account field label (e.g. "email", "username"):` — adds a member column.
- **no:** project-level only — no member column.

Slug generated as: lowercase name, spaces → underscores.

Repeat until all selected tools are collected.

---

**3c — Confirm and write**

```
  Project Resources — confirmed
  ✓ Jira    workspace: myorg · project: RP
  ✓ GitHub  myorg/my-repo
  ⚠ Slack   channel missing

Looks good? (yes / re-enter {tool name})
```

If re-entering a tool: repeat 3b for that tool only, then show this summary again.

**On yes:**

- If `governance.md` does not exist: create it now using the template from `team-governance-schema.md`. Write the Project Resources table and the Team Members table header (columns = Name, Role, Reviewer, Hours/Day, {account columns for all tools with non-empty `member_inputs` in `tools-reference.json`, plus any custom tools added in Step 3b with `has_member_accounts: yes`}, Notes). Write Constraints section as empty.
- If `governance.md` exists: patch the Project Resources table rows. Match rows by tool slug — replace matched rows with the new values, append rows for any new tool. If new tools with account columns were added, insert their column into the Team Members table header and fill existing member rows with empty cells for that column.

Remove `pending_tools` and `pending_resources` from the session — no longer needed once the file is written.

Then route based on mode:
- **New file** (governance.md did not exist before this step): write session `{ "current_step": "members" }`, return to **action menu (2c)** re-reading `governance.md` first.
- **Update mode** (governance.md already existed): write session `{ "current_step": "review" }`, return to **Step 3a** so the user can add more tools or press enter to exit to Step 5. Do not return to the action menu after each individual tool confirmation — keep the user inside Step 3 until they explicitly exit via enter.

---

### Step 4 — Team members

**Source of truth:** `governance.md` Team Members table. Every member save in this step writes a row to that table immediately. The accounts section of every member card reflects the current tool columns in the table — no separate backfill step.

---

**§4-bulk — Register multiple members (menu choice 2)**

Show existing members from `governance.md` to avoid duplicates:
```
Already registered: Anderson, Luis  (or "none yet")
```

Then:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Register Multiple Members
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Paste a list — one member per line:
  Name, Role
  Name — Role
  Name (Role)
  Name only  (role asked during preview)

Or paste a table: Name | Role | Hours | {tool column} | ...
  (columns can be in any order; unrecognized columns are ignored)
```

Process:

1. Parse Name and Role from each line. Map Role using `team-roles-reference.json` aliases (case-insensitive).
2. Show parsed preview:
   ```
   Parsed:
     ✓  Anderson Monroy  →  tech_lead
     ✓  Luis Perez       →  senior_developer
     ⚠  Sara             →  no match for "Sr UX" — clarify:  →
   ```
3. Resolve all `⚠` roles inline before continuing.
4. Apply defaults: `hours = {default-hours-per-day}`, Reviewer per `reviewer_default` in `team-roles-reference.json`, `notes = ""`.
5. Collect accounts — one batched prompt per tool that has an account column in `governance.md`, skipping members who already have a value for that column:
   ```
   ── Jira accounts ──────────────────────────────────
     Anderson   Jira account ID →
     Luis       Jira account ID →
   ── GitHub accounts ────────────────────────────────
     Anderson   GitHub username →
   ```
   Leave blank to skip.
6. After each tool's batch prompt is confirmed, immediately update that column's cells for all members in `governance.md`. Do not wait until all tools are done — write after each tool batch so a mid-session interruption only loses the current tool's unconfirmed input. If the write fails, stop and display: `⚠ Could not save accounts to governance.md. Check disk space and permissions, then try again.` Do not proceed to the next tool until the write succeeds.
7. After the last member:
   > {n} members saved. Proceed to review? (yes / add more)
   - **yes:** write session `{ "current_step": "review" }`, go to Step 5.
   - **add more:** session remains `{ "current_step": "members" }` — return to the paste prompt.

---

**§4-self — Update my own info (menu choice 3)**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Update My Info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your name (or partial match):  →
```

- **Exact match** in `governance.md`: show full member card with current values pre-filled.
- **Multiple partial matches:** list them and ask the user to pick one by number.
- **Single partial match:** show that member's card.
- **No match:** treat as a new member — fresh card from Name.

Press enter to keep any field's current value, or type to replace.

After saving: write/update the member row in `governance.md`. Confirm: `✓ {Name} saved.`

Then ask:
```
  Go to review → "review"
  Update more  → enter
```
- **review:** write session `{ "current_step": "review" }`, go to Step 5.
- **enter:** return to action menu (2c will overwrite session based on the next menu choice).

---

**Member card (used in single-edit and §4-self):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {Member name | New member}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name              →  (current: {value})
Role              →  (current: {value}) — freeform, mapped automatically
Hours/day         →  (current: {value}, default: {default-hours-per-day})
Reviewer          →  (current: {value}, default per role)
Notes             →  (current: {value}) — optional
── Platform accounts ──────────────────────────────────
  {Tool label}    {field prompt}   (current: {value or —}) →
  ...
  Press enter to keep current value, or type to replace.
```

Account fields are determined exclusively from the `governance.md` Team Members table column headers. Any column that is not one of the five standard fields (`Name`, `Role`, `Reviewer`, `Hours/Day`, `Notes`) is treated as an account field and shown in the accounts section. Custom tools with `has_member_accounts: no` were never added as columns in Step 3c and will not appear here.

**Role mapping:** look up input against `aliases` in `team-roles-reference.json`, case-insensitive. Confirm: `Role → tech_lead ✓`. No match: offer closest, or store as `"other"`.

**Reviewer default:** check `reviewer_default.yes` list in `team-roles-reference.json`. User can override.

**On save:** write/update the member's row in `governance.md` — replace row if name matches existing, append if new.

---

**Single-edit (menu choice 4):**

List members from `governance.md`:
```
Current members:
  1. Anderson Monroy — tech_lead
  2. Luis Perez — senior_developer

Enter a number to edit, "new" to add, or "done" to finish:
```

- **Number:** show the full member card for that member with current values pre-filled. On save, write the updated row to `governance.md` and return to the member list.
- **"new":** show a fresh member card. On save, append the new row to `governance.md` and return to the member list.
- **"done":** write session `{ "current_step": "review" }`, go to Step 5.

---

### Step 5 — Review & finalize

Read `governance.md` and display a summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  governance.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Name | Role | Rev | Hrs | Jira | GitHub | Notes |
|------|------|-----|-----|------|--------|-------|
| Anderson | tech_lead | ✓ | 8 | 712020:abc | andersonm | |
| Luis | senior_developer | ✓ | 8 | ⚠ | luisp | |

⚠ Missing accounts: Luis → Jira

Constraints: {text or "(none)"}
```

```
What do you want to do?
  • Edit a member          → name or number
  • Add a member           → "new"
  • Remove a member        → "remove {name}"
  • Fill missing accounts  → "fill"
  • Update resources       → "resources"
  • Edit constraints       → "constraints"
  • Done                   → "done" or any affirmative
```

**Routing:**

- **Edit / Add:** show member card. On save, write row to `governance.md`. Re-display summary.
- **Remove:** delete member row from `governance.md`. Re-display summary.
- **Fill missing accounts:** for each account-field column that has at least one empty cell, show the batched account prompt (same format as the accounts collection block in §4-bulk), listing only the members who have an empty cell for that column. Skip members who already have a value. Write updated rows to `governance.md`. Re-display summary.
- **Update resources:** write session `{ "current_step": "resources" }`, go to Step 3a. The session is restored to `{ "current_step": "review" }` automatically when the user exits Step 3 (pressing enter at 3a), at which point control returns to Step 5. If interrupted inside Step 3, resume correctly returns to Step 3.
- **Edit constraints:**
  ```
  Constraints (press enter to clear):
  Current: {value or "(none)"}
  →
  ```
  Write Constraints section in `governance.md`. Session is not modified — user remains at `current_step: "review"`. Re-display summary.
- **Done:** proceed to 5a.

---

**5a — Finalize**

`governance.md` is already up to date — no bulk write needed. Only two actions:

1. Delete `{skill-root}/governance-session.json`. If deletion fails:
   > ⚠ Could not delete governance-session.json — remove it manually to avoid a stale resume prompt next run.

2. Build and return:

`project_resources` — parse from `governance.md` Project Resources table as a flat key-value object. Keys must be the machine-readable identifiers from `tools-reference.json` (e.g., `jira_project_key`, `github_owner`, `github_repo`, `slack_channel`), not the display names stored in the file. Derive the identifier key by matching each row's display name to the `extracts` field names in `tools-reference.json`. Rows with unrecognized display names (custom tools, environments) are stored using the row's display name lowercased and underscored as the key.

`team_profile`:
```json
{
  "members": [
    {
      "name": "Anderson Monroy",
      "role": "tech_lead",
      "hours_per_day": 8,
      "reviewer": true,
      "notes": "",
      "accounts": { "jira": "712020:abc", "github": "andersonm" }
    }
  ],
  "roles": { "tech_lead": 1, "senior_developer": 1 },
  "constraints": "Anderson is part-time Wed–Fri"
}
```

`roles` includes only keys with count > 0. Unmapped roles count under `"other"`.

Display:
```
✓ governance.md finalized
  Members:     {n}
  Tools:       {list}
  Roles:       {role}: {n}, ...
  Constraints: {summary or "none"}
```

The calling skill receives `team_profile` and `project_resources` in-context and continues its own flow.
