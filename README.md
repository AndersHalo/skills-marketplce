# halo-skills

Private Halo skills repository. Every merge to `main` automatically builds and publishes Claude Code plugins to [marketplace-ai](https://github.com/AndersHalo/marketplace-ai).

---

## How it works

```
skills/          →  build:plugins  →  dist/  →  marketplace-ai
platforms/
```

1. Authors edit skills in `skills/` and declare plugins in `platforms/marketplace.yaml`
2. Every PR runs schema validation
3. Every merge to `main` generates plugins and publishes them automatically

---

## Structure

```
skills/
  {skill-name}/
    SKILL.md              # skill content
    .skill-meta.json      # metadata: version, category, tags, platforms

platforms/
  marketplace.yaml        # declares which skills form each plugin
  bmad.yaml               # declares which skills go to BMAD (pending)

build/
  skill-to-plugin.ts      # generates marketplace plugins
  generate-manifest.ts    # generates skills index
  prompts/                # BMAD transform prompts (pending)
```

---

## Adding a new skill

1. Create the folder `skills/{skill-name}/`
2. Add `SKILL.md` with the skill content
3. Add `.skill-meta.json`:

```json
{
  "schema_version": 2,
  "skill_name": "my-skill",
  "skill_version": "1.0.0",
  "category": "workflow",
  "skill_description": "At least 20 characters describing what this skill does.",
  "author": {
    "name": "Your name",
    "email": "you@halopowered.com"
  }
}
```

`platforms` and `tags` are optional. Add `"platforms": ["marketplace"]` when you're ready to publish the skill to a plugin.

**Categories:**
- Code: `css` · `javascript` · `framework` · `api` · `cms`
- Quality & Delivery: `testing` · `devops` · `security`
- Product & Design: `product` · `design`
- Data & AI: `analytics` · `data` · `ai`
- Team & Process: `process`

**Tags** are optional free-form keywords for finer search within a category (e.g. `["hubspot", "b2b"]`). Add them when the skill targets a specific platform or use-case.

4. Open PR → merge → CI publishes automatically

---

## Publishing a skill to a plugin

Edit `platforms/marketplace.yaml` and add the skill to the relevant plugin:

```yaml
plugins:
  martech-foundation:
    description: "..."
    skills:
      - martech-css
      - my-skill       # add here
```

If the plugin doesn't exist, create a new entry. CI generates everything else.

---

## Versioning

| What | Version | Who |
|------|---------|-----|
| Skill | `skill_version` in `.skill-meta.json` | Author, manual semver |
| Plugin | `version` in `marketplace.yaml` | Patch auto-bumped by CI; minor/major edited manually |

**Patch** bumps automatically when skill files change. For **minor** (new feature) or **major** (breaking), edit `version` in `marketplace.yaml` before merging.

---

## CI/CD

| Workflow | When | What |
|----------|------|------|
| `validate.yml` | Every PR | Validates `.skill-meta.json` schema |
| `release.yml` | Every merge to `main` | Builds plugins and publishes to `marketplace-ai` |

**Required secret:** `MARKETPLACE_DEPLOY_KEY` — SSH deploy key with write access to `marketplace-ai`.
