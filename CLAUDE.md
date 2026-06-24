# halo-skills — context for Claude

Private Halo skills repository. Converts a skills filesystem into Claude Code plugins published automatically via CI.

## Key structure

- `skills/{name}/SKILL.md` — skill content (what gets installed)
- `skills/{name}/.skill-meta.json` — metadata: version, category, tags, platforms
- `platforms/marketplace.yaml` — declares which skills form each plugin
- `build/skill-to-plugin.ts` — generates `dist/` with plugin structure
- `build/generate-manifest.ts` — generates `dist/skills-manifest.json` with skills index

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

| Category | Use for |
|---|---|
| `css` | Styling, design tokens, layout conventions |
| `javascript` | JS patterns, vanilla or framework-agnostic utilities |
| `framework` | Framework-specific skills (React, Vue, Astro, Next.js…) |
| `api` | REST, GraphQL, third-party integrations |
| `cms` | CMS platforms (HubSpot, WordPress, Shopify, Webflow…) |
| `devops` | CI/CD, deployment pipelines, infrastructure |
| `testing` | QA, test automation, coverage strategies |
| `data` | Data transformation, ETL, reporting |
| `workflow` | Software development lifecycle — git flow, code review, branching strategies, release process, sprint rituals |
| `product` | Product management — roadmaps, PRDs, prototypes, governance |
| `ai` | AI/ML tools, prompt engineering, agent design |
| `design` | UI/UX, design systems, visual specifications |
| `analytics` | Metrics, dashboards, KPI tracking |

Removed legacy fields: `output_folder`, `skill_inputs`, `skill_process`, `skill_outputs`, `aux_files`, `applied_suggestions`.

## Commands

```bash
npm run validate        # validates all .skill-meta.json files with Zod
npm run build:plugins   # generates dist/plugins/ and dist/.claude-plugin/marketplace.json
npm run build:manifest  # generates dist/skills-manifest.json
npm run release         # runs manifest + plugins + bmad (bmad pending)
```

## Plugin versioning

Plugin version is declared in `platforms/marketplace.yaml` (e.g. `version: "1.2.0"`). CI auto-bumps the **patch** number when skill files change and the developer didn't manually update the version. For **minor** (new feature) or **major** (breaking change), edit the version in `marketplace.yaml` before merging.

## CI

- `validate.yml` — runs on PRs touching `skills/**` or `platforms/*.yaml`
- `release.yml` — runs on merge to `main`, generates `dist/` and pushes to `marketplace-ai` via SSH deploy key (`MARKETPLACE_DEPLOY_KEY`)

## Do NOT

- Edit `dist/` manually — it is CI output
- Edit `marketplace-ai` manually — it is pure CI output
- Use schema v1 fields in new skills
- Add skills to `platforms/bmad.yaml` — `build:bmad` is not implemented yet
