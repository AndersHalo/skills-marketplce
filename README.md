# halo-skills

Private Halo skills repository. Every merge to `main` automatically builds and publishes Claude Code plugins to [marketplace-ai](https://github.com/AndersHalo/marketplace-ai). BMAD releases are done manually via `/bmad-release` in Claude Code.

---

## How it works

```
skills/          →  build:plugins   →  dist/   →  marketplace-ai
platforms/
  marketplace.yaml                                (CI, automatic)

skills/          →  /bmad-release   →  workflows/  →  halo-BMAD
platforms/                              modules/
  bmad.yaml                                       (manual, via skill)
```

1. Authors edit skills in `skills/` and declare targets in `platforms/`
2. Every PR runs schema validation
3. Every merge to `main` generates marketplace plugins and publishes them automatically
4. BMAD releases are triggered manually with `/bmad-release`

---

## Structure

```
skills/
  {skill-name}/
    SKILL.md              # skill content
    .skill-meta.json      # metadata: version, category, tags, platforms

platforms/
  marketplace.yaml        # declares which skills form each plugin
  bmad.yaml               # declares which skills go to BMAD + released_version

build/
  skill-to-plugin.ts      # generates marketplace plugins
  generate-manifest.ts    # generates skills index

dist/
  skills-manifest.json    # generated index — source of truth for skill versions
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

`platforms` and `tags` are optional. Add `"platforms": ["marketplace"]` when ready to publish to a plugin, or `"platforms": ["bmad"]` when ready to release to BMAD.

**Categories:**
- Code: `css` · `javascript` · `framework` · `api` · `cms`
- Quality & Delivery: `testing` · `devops` · `security`
- Product & Design: `product` · `design`
- Data & AI: `analytics` · `data` · `ai`
- Team & Process: `process`

**Tags** are optional free-form keywords for finer search within a category (e.g. `["hubspot", "b2b"]`).

4. Open PR → merge → CI publishes to marketplace automatically

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

## Publishing a skill to BMAD

1. Add the skill to `platforms/bmad.yaml`:

```yaml
skills:
  - name: my-skill
    type: workflow     # workflow | module
```

2. Run `npm run build:manifest` to regenerate `dist/skills-manifest.json`
3. Run `/bmad-release` in Claude Code — it will detect the new entry, transform the skill, write output files to `workflows/` or `modules/`, and update `released_version` in `bmad.yaml`
4. Commit and push

For subsequent updates: bump `skill_version` in `.skill-meta.json`, run `build:manifest`, then `/bmad-release` again.

---

## Versioning

| What | Version | Who |
|------|---------|-----|
| Skill | `skill_version` in `.skill-meta.json` | Author, manual semver |
| Plugin (marketplace) | `version` in `marketplace.yaml` | Patch auto-bumped by CI; minor/major edited manually |
| BMAD release | `released_version` in `bmad.yaml` | Set automatically by `/bmad-release` — do not edit manually |

**Patch** bumps automatically when skill files change. For **minor** (new feature) or **major** (breaking), edit `version` in `marketplace.yaml` before merging.

---

## CI/CD

| Workflow | When | What |
|----------|------|------|
| `validate.yml` | Every PR | Validates `.skill-meta.json` schema |
| `release.yml` | Every merge to `main` | Builds plugins and publishes to `marketplace-ai` |
| `/bmad-release` | Manual | Transforms skills and releases to `halo-BMAD` |

**Required secret:** `MARKETPLACE_DEPLOY_KEY` — SSH deploy key with write access to `marketplace-ai`.
