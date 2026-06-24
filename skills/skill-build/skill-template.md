# Skill Template

Use this file as the base when generating a new SKILL.md. Replace every `{placeholder}` with real content derived from the interview answers.

---

## Template

```
---
name: {skill-name}
description: {description}
---

# {Title}

{purpose-statement}

## On Activation

{Generate this section at build time following the Welcome pattern rules in skill-conventions.md. Do not copy text from this template — synthesize from the current rules and the skill's input types.}

---

## How to invoke

`/{skill-name}`

## Behavior

### Step 1 — Load reference files

Read all of the following files in full before doing anything else.

{- list aux reference files if any, one per line with a short description}

Use the mandatory read loop for each:

\```
offset = 0; chunks = []
loop:
  read file at offset, limit=200
  append to chunks
  if result < 200 lines → EXIT loop
  else → offset += 200, continue
content = join(chunks)
\```

If any file cannot be read, stop with:
> ⚠ Could not read `{filename}` at `{skill-root}`. Check the path and try again.

---

### Step {N} — {collect-inputs-step-name}

Resolve all inputs before proceeding:

- **User input** — ask one question per input and wait for the response before continuing.
- **File** — ask the user for the file path, then read the file using the mandatory read loop.
- **Constant / Derived** — use the in-memory value confirmed during On Activation. Do not ask again.

---

### Step {N+1} — {process-step-name}

{describe what the skill does internally with the collected inputs}

---

### Step {N+2} — {output-step-name}

{describe what the skill produces: files written, console output, or both}

---

### Step {last} — Confirm

{confirmation message listing everything produced}
```

---

## Placeholder reference

| Placeholder | Source |
|---|---|
| `{skill-name}` | `skill_name` from interview — lowercase kebab-case |
| `{description}` | `skill_description` from interview — one line, under 200 characters |
| `{Title}` | Title-cased version of `skill_name` (replace hyphens with spaces) |
| `{purpose-statement}` | One-sentence expansion of `skill_description` |

---

## Input types

See `{skill-root}/input-types.md` for the complete input type classification, welcome.md section mapping, resolution order, and override persistence rules.

See `{skill-root}/skill-conventions.md` for step structure rules, step count rules, and error message format.
