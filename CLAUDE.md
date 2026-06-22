# halo-skills — contexto para Claude

Repo privado de skills de Halo. Convierte un filesystem de skills en plugins de Claude Code publicados automáticamente via CI.

## Estructura clave

- `skills/{name}/SKILL.md` — contenido del skill (lo que se instala)
- `skills/{name}/.skill-meta.json` — metadata: versión, categoría, tags, plataformas
- `platforms/marketplace.yaml` — declara qué skills forman cada plugin
- `build/skill-to-plugin.ts` — genera `dist/` con la estructura de plugins
- `build/generate-manifest.ts` — genera `dist/skills-manifest.json` con índice de skills

## Schema de .skill-meta.json (v2)

```json
{
  "schema_version": 2,
  "skill_name": "kebab-case",
  "skill_version": "1.0.0",
  "platforms": ["marketplace"],
  "category": "css | javascript | deploy | analytics | design",
  "tags": ["array", "de", "keywords"],
  "skill_description": "Mínimo 20 caracteres, máximo 500.",
  "author": { "name": "...", "email": "...@halopowered.com" }
}
```

Campos legacy eliminados: `output_folder`, `skill_inputs`, `skill_process`, `skill_outputs`, `aux_files`, `applied_suggestions`.

## Comandos

```bash
npm run validate        # valida todos los .skill-meta.json con Zod
npm run build:plugins   # genera dist/plugins/ y dist/.claude-plugin/marketplace.json
npm run build:manifest  # genera dist/skills-manifest.json
npm run release         # corre manifest + plugins + bmad (bmad pendiente)
```

## Versionado de plugins

La versión del plugin se deriva del último commit git que tocó sus archivos — no es global ni manual. Si solo cambia `martech-css`, solo `martech-foundation` recibe una versión nueva.

## CI

- `validate.yml` — corre en PRs que tocan `skills/**` o `platforms/*.yaml`
- `release.yml` — corre en merge a `main`, genera `dist/` y lo pushea a `marketplace-ai` via SSH deploy key (`MARKETPLACE_DEPLOY_KEY`)

## Lo que NO hacer

- No editar `dist/` manualmente — es output del CI
- No editar `marketplace-ai` manualmente — es output puro del CI
- No usar campos del schema v1 en skills nuevos
- El script `build:bmad` no está implementado todavía — no agregar skills a `platforms/bmad.yaml` hasta que esté listo
