# halo-skills — context for Claude

Private Halo skills repository. Converts a skills filesystem into Claude Code plugins published automatically via CI.

## Key structure

- `skills/{name}/SKILL.md` — skill content (what gets installed)
- `skills/{name}/.skill-meta.json` — metadata: version, category, tags, platforms
- `platforms/marketplace.yaml` — declares which skills form each plugin
- `platforms/bmad.yaml` — declares which skills go to BMAD and tracks `released_version` per skill
- `build/skill-to-plugin.ts` — generates `dist/` with plugin structure
- `build/generate-manifest.ts` — generates `dist/skills-manifest.json` with skills index
- `dist/skills-manifest.json` — source of truth for current skill versions (generated, do not edit)

## .skill-meta.json schema (v2)

```json
{
  "schema_version": 2,
  "skill_name": "kebab-case",
  "skill_version": "1.0.0",
  "platforms": ["marketplace"],
  "category": "product",
  "tags": ["optional", "discovery", "keywords"],
  "skill_description": "At least 20 characters, max 500.",
  "author": { "name": "...", "email": "...@halopowered.com" }
}
```

### Fields

| Field | Required | Notes |
|---|---|---|
| `schema_version` | ✅ | Must be `2` |
| `skill_name` | ✅ | kebab-case, must match directory name |
| `skill_version` | ✅ | semver (`1.0.0`) |
| `category` | ✅ | See category list below |
| `skill_description` | ✅ | 20–500 characters |
| `author.name` | ✅ | Full name |
| `author.email` | ✅ | Must be `@halopowered.com` |
| `platforms` | ⬜ | Optional. `["marketplace"]`, `["bmad"]`, or both. Omit if not yet published. |
| `tags` | ⬜ | Optional. Free-form keywords for finer search within a category (e.g. `["hubspot", "b2b", "landing-page"]`). Add them when the skill targets a specific platform or use-case. |

### Categories

| Group | Category | Use for |
|---|---|---|
| Code | `css` | Styling, design tokens, layout conventions |
| Code | `javascript` | JS patterns, vanilla or framework-agnostic utilities |
| Code | `framework` | Framework-specific skills (React, Vue, Astro, Next.js…) |
| Code | `api` | REST, GraphQL, third-party integrations |
| Code | `cms` | CMS platforms (HubSpot, WordPress, Shopify, Webflow…) |
| Quality & Delivery | `testing` | QA, test automation, coverage strategies |
| Quality & Delivery | `devops` | CI/CD pipelines, deployment, infrastructure |
| Quality & Delivery | `security` | Security audits, auth patterns, OWASP, vulnerability scanning |
| Product & Design | `product` | Roadmaps, PRDs, prototypes, discovery |
| Product & Design | `design` | UI/UX, design systems, visual specifications |
| Data & AI | `analytics` | Metrics, dashboards, KPI tracking |
| Data & AI | `data` | Data transformation, ETL, pipelines |
| Data & AI | `ai` | AI agents, LLM tools, prompt engineering, Claude integrations |
| Team & Process | `process` | Dev lifecycle practices — team governance, code review conventions, branching strategy, sprint rituals, release process, documentation standards |

Removed legacy fields: `output_folder`, `skill_inputs`, `skill_process`, `skill_outputs`, `aux_files`, `applied_suggestions`.

## platforms/bmad.yaml schema

Source of truth for BMAD exports. Edit this file to declare skills and modules, then run `/bmad-release` to transform and push a PR.

```yaml
workflows:
  # Key = skill directory name. Holds all workflow-level properties.
  roadmap-build:
    released_version: "1.2.0"   # set automatically by /bmad-release
    display-name: Roadmap Builder
    menu-code: RB
    description: Generate a product roadmap from a PRD
    action: run-skill
    args: roadmap-build
    phase: planning
    required: false
    output-location: docs/roadmap
    outputs: roadmap.md

modules:
  # Key = module_code (2–4 lowercase letters). Holds module-level properties only.
  hpp:
    module_name: "Halo Product Module"
    module_description: "Product team toolkit."
    approach: setup-skill
    released_version: "1.0.0"   # set automatically by /bmad-release
    skill_versions: {}          # set automatically by /bmad-release
    skills:
      # skill ref + module-specific ordering overrides only
      - skill: team-governance   # must be a key in workflows; skipped if not declared
        preceded-by: ~
        followed-by: roadmap-build
      - skill: roadmap-build
        preceded-by: team-governance
        followed-by: prototype-build
      - skill: prototype-build
        preceded-by: roadmap-build
        followed-by: ~
```

### workflows fields

| Field | Required | Notes |
|---|---|---|
| key | ✅ | Skill directory name in `skills/` |
| `released_version` | ⬜ | Set automatically by `/bmad-release` |
| `display-name` | ⬜ | Label shown in BMAD menu. Auto-inferred if absent. |
| `menu-code` | ⬜ | Short selection code (e.g. `RB`). Auto-inferred if absent. |
| `description` | ⬜ | One-line description. Auto-inferred if absent. |
| `action` | ⬜ | BMAD action (e.g. `run-skill`). Auto-inferred if absent. |
| `args` | ⬜ | Arguments passed to the action. Auto-inferred if absent. |
| `phase` | ⬜ | Workflow phase (e.g. `planning`, `design`, `setup`). Auto-inferred if absent. |
| `required` | ⬜ | `true` or `false`. Default: `false`. |
| `output-location` | ⬜ | Relative path where outputs are written. Auto-inferred if absent. |
| `outputs` | ⬜ | Output file names. Auto-inferred if absent. |

### modules fields

| Field | Required | Notes |
|---|---|---|
| key | ✅ | Module code — 2–4 lowercase letters, e.g. `hpp` |
| `module_name` | ✅ | Human-friendly display name |
| `module_description` | ✅ | One-line summary |
| `approach` | ⬜ | `setup-skill` (2+ skills) or `standalone` (1 skill). Inferred if absent. |
| `released_version` | ⬜ | Set automatically by `/bmad-release` |
| `skill_versions` | ⬜ | Per-skill version snapshot at last release; set automatically by `/bmad-release` |
| `skills[].skill` | ✅ | Must match a key in `workflows`. Skipped if not declared. |
| `skills[].preceded-by` | ⬜ | Skill that must run before this one in the module (`~` for none) |
| `skills[].followed-by` | ⬜ | Skill that typically follows in the module (`~` for none) |

### module-help fields (per skill in a module)

| Field | Description |
|---|---|
| `display-name` | Label shown in the BMAD menu |
| `menu-code` | Short selection code (e.g. `RB`) |
| `description` | One-line description |
| `action` | BMAD action (e.g. `run-skill`) |
| `args` | Arguments passed to the action |
| `phase` | Workflow phase (e.g. `planning`, `design`, `setup`) |
| `preceded-by` | Skill that must run before this one (`~` for none) |
| `followed-by` | Skill that typically follows (`~` for none) |
| `required` | `true` or `false` |
| `output-location` | Relative path where outputs are written |
| `outputs` | Comma-separated list of output file names |

## Commands

```bash
npm run validate        # validates all .skill-meta.json files with Zod
npm run build:plugins   # generates dist/plugins/ and dist/.claude-plugin/marketplace.json
npm run build:manifest  # generates dist/skills-manifest.json
npm run release         # runs manifest + plugins
```

To release skills to BMAD, run `/bmad-release` in Claude Code. It reads `platforms/bmad.yaml`, compares `released_version` against `dist/skills-manifest.json`, transforms changed skills, and updates `released_version` in `platforms/bmad.yaml` after a successful release.

## Plugin versioning

Plugin version is declared in `platforms/marketplace.yaml` (e.g. `version: "1.2.0"`). CI auto-bumps the **patch** number when skill files change and the developer didn't manually update the version. For **minor** (new feature) or **major** (breaking change), edit the version in `marketplace.yaml` before merging.

## BMAD versioning

`platforms/bmad.yaml` is the source of truth for what gets published to BMAD. Add or remove entries by editing it directly, then run `/bmad-release`.

- **Workflow** `released_version` — tracks the skill's `skill_version` from the manifest at last release.
- **Module** `released_version` — the module's own version (patch-bumped on any constituent skill change). `skill_versions` tracks per-skill versions at last release.
- Both fields are set automatically by `/bmad-release` — do not edit them manually.

## CI

- `validate.yml` — runs on PRs touching `skills/**` or `platforms/*.yaml`
- `release.yml` — runs on merge to `main`, generates `dist/` and pushes to `marketplace-ai` via SSH deploy key (`MARKETPLACE_DEPLOY_KEY`)

## Do NOT

- Edit `dist/` manually — it is CI output
- Edit `marketplace-ai` manually — it is pure CI output
- Edit `released_version` in `platforms/bmad.yaml` manually — it is set by `/bmad-release`
- Use schema v1 fields in new skills
