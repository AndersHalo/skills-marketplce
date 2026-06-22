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
  "category": "css | javascript | deploy | analytics | design",
  "tags": ["array", "of", "keywords"],
  "skill_description": "At least 20 characters, max 500.",
  "author": { "name": "...", "email": "...@halopowered.com" }
}
```

Removed legacy fields: `output_folder`, `skill_inputs`, `skill_process`, `skill_outputs`, `aux_files`, `applied_suggestions`.

## Commands

```bash
npm run validate        # validates all .skill-meta.json files with Zod
npm run build:plugins   # generates dist/plugins/ and dist/.claude-plugin/marketplace.json
npm run build:manifest  # generates dist/skills-manifest.json
npm run release         # runs manifest + plugins + bmad (bmad pending)
```

## Plugin versioning

Plugin version is derived from the last git commit that touched its files — not global, not manual. If only `martech-css` changes, only `martech-foundation` gets a new version.

## CI

- `validate.yml` — runs on PRs touching `skills/**` or `platforms/*.yaml`
- `release.yml` — runs on merge to `main`, generates `dist/` and pushes to `marketplace-ai` via SSH deploy key (`MARKETPLACE_DEPLOY_KEY`)

## Do NOT

- Edit `dist/` manually — it is CI output
- Edit `marketplace-ai` manually — it is pure CI output
- Use schema v1 fields in new skills
- Add skills to `platforms/bmad.yaml` — `build:bmad` is not implemented yet
