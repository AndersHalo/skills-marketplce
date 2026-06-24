# Input Types

Every skill input must be classified as one of four types. The type determines how the skill resolves the value at runtime, whether the user is prompted for it, and which section it appears in in `welcome.md`.

---

## Classification

| Type | How value is resolved | Infer when the brief mentions... |
|------|-----------------------|----------------------------------|
| `User input` | User types or pastes interactively during the skill run | text, a choice, a name, or any value the user must provide each time |
| `File` | User provides a file path; skill reads its contents | a file path, a document the user points to, reading from a file |
| `Constant` | Fixed value baked into the skill; user can override once via `defaults.md` | a fixed value, always the same, a preset — e.g. "always use model X", "max 10 results" |
| `Derived` | Computed at runtime from another input, the current date, or project context; user can override via `defaults.md` | computed at runtime, inferred from context — e.g. "current date", "project root", "from skill name" |

If type is ambiguous, default to `User input`.

---

## Mapping to welcome.md

| Type | Section |
|------|---------|
| `User input` | **Inputs** table — user provides this value each run |
| `File` | **Inputs** table — user provides this value each run |
| `Constant` | **Defaults** table — pre-set, user can override once and save |
| `Derived` | **Defaults** table — pre-set, user can override once and save |

`User input` and `File` entries are things the user must actively supply every time the skill runs.
`Constant` and `Derived` entries have built-in values that work without any action from the user — they only appear in Defaults so the user can change them if needed.

**Do not put a value in both tables.** If a value has a sensible default, it belongs in Defaults — not Inputs.

---

## Resolution order (Constant and Derived)

1. Check in-memory defaults (loaded from `{skill-root}/defaults.md` at activation).
2. Fall back to the built-in default declared in the skill.

Never prompt the user for a `Constant` or `Derived` value during the normal skill flow — it is already resolved at activation.

---

## Persisting overrides

When the user changes a Constant or Derived default during On Activation, write all current defaults (including unchanged ones) to `{skill-root}/defaults.md`:

```
# Defaults
{key}: {value}
{key}: {value}
```

On the next invocation, this file is read first and overrides all built-in defaults.
