# Skills Mesh Architecture

CI/CD pipeline para el Halo Skills Registry — convierte un filesystem con convenciones en un content mesh determinístico y automatizado.

---

## El cambio central

Hoy el repo es un **filesystem con convenciones**. Este plan lo convierte en un **pipeline determinístico** donde publicar un skill funciona igual que hacer un commit: automático, versionado, validado.

```
halo-skills (privado)                    halo-marketplace (privado)
─────────────────────────                ──────────────────────────
Autor edita skills/                      Solo recibe output del CI
       ↓                                 Nunca se edita a mano
validate.yml → Zod check (PR)
       ↓
Merge a main
       ↓
release.yml
  ├─ build:manifest  → dist/skills-manifest.json
  ├─ build:plugins   → dist/plugins/ + dist/.claude-plugin/marketplace.json
  └─ build:bmad      → dist/platforms/bmad/  (Claude API + hashing)
       ↓
push dist/ → halo-marketplace ─────────────────────────────────────
```

Ambos repos son privados en GitHub.

---

## Estructura de repos

### `halo-skills` — donde se trabaja

```
skills/
  {skill-name}/
    SKILL.md
    .skill-meta.json      → metadata del skill (versión, plataformas)
    *.md                  → aux files opcionales

platforms/
  marketplace.yaml        → declara composición de plugins
  bmad.yaml               → declara qué skills van a BMAD y de qué tipo

build/
  skill.schema.ts         → Zod schema
  validate-skills.ts
  generate-manifest.ts
  skill-to-plugin.ts
  skill-to-bmad.ts
  prompts/
    skill-to-bmad.md      → prompt del transform BMAD, versionado como código

.github/
  workflows/
    validate.yml          → corre en cada PR
    release.yml           → corre en cada merge a main

package.json
```

### `halo-marketplace` — output puro, lo que el cliente instala

```
plugins/
  {plugin-name}/
    .claude-plugin/
      plugin.json
    skills/
      {skill-name}.md

.claude-plugin/
  marketplace.json

skills-manifest.json      → discovery: qué skills existen y su estado

platforms/
  bmad/
    modules/
      {skill-name}/
        SKILL.md
    workflows/
      {skill-name}/
        SKILL.md
        customize.toml
        references/
```

> Todo lo que llega a `halo-marketplace` viene de `dist/` en este repo. Los build scripts escriben ahí. El CI pushea `dist/` al repo de destino.

---

## Los tres archivos de declaración

### 1. `.skill-meta.json` — metadata del skill

```json
{
  "schema_version": 1,
  "skill_name": "martech-css",
  "skill_version": "1.3.0",
  "platforms": ["marketplace", "bmad"],
  "skill_description": "General CSS conventions used across all client web projects...",
  "author": {
    "name": "Susan Joo",
    "email": "susan@halopowered.com"
  }
}
```

`platforms` declara a dónde va el skill. `skill_version` es la única versión que el autor controla manualmente. Campos legacy (`output_folder`, `skill_inputs`, `skill_process`, `skill_outputs`, `aux_files`, `applied_suggestions`) se eliminan en la migración.

### 2. `platforms/marketplace.yaml` — composición de plugins

```yaml
plugins:
  martech-foundation:
    description: "Shared web-development conventions for HubSpot, Shopify, WordPress"
    skills:
      - martech-css
      - martech-accessibility
      - martech-analytics
```

Un autor edita este archivo para crear un plugin nuevo o agregar skills a uno existente. El CI genera todo lo demás.

### 3. `platforms/bmad.yaml` — skills que generan artefactos BMAD

```yaml
skills:
  - name: hpm-setup
    type: module          # genera: dist/platforms/bmad/modules/{name}/SKILL.md

  - name: roadmap-build
    type: workflow        # genera: dist/platforms/bmad/workflows/{name}/SKILL.md
                          #          + customize.toml + references/
```

`type: module` → el CI genera solo `SKILL.md`.
`type: workflow` → el CI genera `SKILL.md` + `customize.toml` + carpeta `references/`.

---

## Build scripts

Todos los scripts escriben a `dist/`. El CI pushea `dist/` completo a `halo-marketplace`.

### `validate-skills.ts` — Zod schema check

Lee cada `.skill-meta.json` en `skills/`, valida contra el schema, reporta errores con path. Corre en cada PR. Bloquea el merge si falla.

```typescript
const SkillMetaSchema = z.object({
  schema_version: z.literal(1),
  skill_name: z.string().regex(/^[a-z][a-z0-9-]+$/),
  skill_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  platforms: z.array(z.enum(["marketplace", "bmad"])).min(1),
  skill_description: z.string().min(20).max(500),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
})
```

### `generate-manifest.ts` — dist/skills-manifest.json

Lee todos los `.skill-meta.json` y cruza contra `marketplace.yaml` para determinar el estado de cada skill. Permite discovery desde `halo-marketplace` sin acceso a este repo.

```json
{
  "generated": "2026-06-22T14:00:00Z",
  "skills": [
    {
      "name": "martech-css",
      "version": "1.3.0",
      "platforms": ["marketplace", "bmad"],
      "plugin": "martech-foundation",
      "status": "published"
    },
    {
      "name": "shopify-js",
      "version": "2.0.0",
      "platforms": ["marketplace"],
      "plugin": null,
      "status": "unpublished"
    }
  ]
}
```

### `skill-to-plugin.ts` — genera plugins/ sin Claude API

100% determinístico. Lee `platforms/marketplace.yaml` y los `skills/*/SKILL.md`, escribe a `dist/`:

```
dist/plugins/{plugin-name}/.claude-plugin/plugin.json
dist/plugins/{plugin-name}/skills/{skill-name}.md
dist/.claude-plugin/marketplace.json
```

Versión del plugin generada automáticamente — trazable al commit, sin conflictos:

```typescript
const date   = new Date().toISOString().slice(0, 10)        // "2026-06-22"
const gitSha = execSync('git rev-parse --short HEAD').trim() // "a1b2c3d"
const version = `${date}-${gitSha}`                          // "2026-06-22-a1b2c3d"
```

### `skill-to-bmad.ts` — genera artefactos BMAD con Claude API + hashing

El único script que llama a la API. Usa content hashing para no regenerar skills sin cambios:

```typescript
const skills = yaml.load(readFile('platforms/bmad.yaml')).skills

for (const { name, type } of skills) {
  const content     = readFile(`skills/${name}/SKILL.md`)
  const contentHash = md5(content)
  const promptHash  = md5(readFile('build/prompts/skill-to-bmad.md'))

  const cached = readCachedHashes(name)
  if (cached.content === contentHash && cached.prompt === promptHash) {
    console.log(`${name}: unchanged, skip`)
    continue
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    system: readFile('build/prompts/skill-to-bmad.md'),
    messages: [{ role: 'user', content: `type: ${type}\n\n${content}` }]
  })

  if (type === 'module') {
    writeModule(name, validated)  // → dist/platforms/bmad/modules/{name}/SKILL.md
  } else {
    writeWorkflow(name, validated) // → dist/platforms/bmad/workflows/{name}/SKILL.md
  }                                //    + customize.toml + references/

  writeCachedHashes(name, { content: contentHash, prompt: promptHash })
}
```

Si el prompt cambia, el hash no coincide y todos los skills se regeneran en ese release.

---

## Versionado por artefacto

| Artefacto | Versión | Quién la controla |
|-----------|---------|-------------------|
| Skill | `skill_version` en `.skill-meta.json` | Autor del skill, manual |
| Plugin marketplace | `YYYY-MM-DD-{git-sha}` | CI automático |
| Módulo BMAD | Hereda `skill_version` del skill | El skill (indirecto) |
| Workflow BMAD | Hereda `skill_version` del skill | El skill (indirecto) |
| Transform BMAD | `transform_version` en frontmatter del prompt | Platform team, manual |

---

## Consumo de tokens

Con content hashing, solo se regeneran los skills cuyos archivos cambiaron:

```
Sin hashing: 100 merges/día × 28 skills × ~8,000 tokens = 22,400,000 tokens/día
Con hashing: 100 merges/día × ~2 skills cambiados × ~8,000 tokens = 1,600,000 tokens/día
Con Haiku: ~$1.30/día
```

---

## GitHub Actions

### `validate.yml` — en cada PR

```yaml
on:
  pull_request:
    paths:
      - 'skills/**'
      - 'platforms/*.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run validate
```

### `release.yml` — en cada merge a main

```yaml
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build:manifest
      - run: npm run build:plugins
      - run: npm run build:bmad
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - name: Push to marketplace-ai
        uses: cpina/github-action-push-to-another-repository@v1.7.4
        env:
          SSH_DEPLOY_KEY: ${{ secrets.MARKETPLACE_DEPLOY_KEY }}
        with:
          source-directory: 'dist/'
          destination-github-username: 'AndersHalo'
          destination-repository-name: 'marketplace-ai'
          target-branch: main
          commit-message: 'release: ${{ github.sha }}'
```

---

## Orden de implementación

| Paso | Qué | Notas |
|------|-----|-------|
| 1 | Corregir paths en `validate.yml` (`skills/**`, `platforms/*.yaml`) | Fixes CI trigger roto |
| 2 | Limpiar `.skill-meta.json` de `martech-css` — eliminar campos legacy, agregar `skill_version` | Base para el schema |
| 3 | `build/skill.schema.ts` + `build/validate-skills.ts` | Zod validation funcional |
| 4 | `build/generate-manifest.ts` → `dist/skills-manifest.json` | Discovery entre repos |
| 5 | `build/skill-to-plugin.ts` → `dist/plugins/` + `dist/.claude-plugin/` | Automatiza publicación marketplace |
| 6 | `build/prompts/skill-to-bmad.md` + `build/skill-to-bmad.ts` | BMAD automático en CI |

Pasos 1–2 son prerequisitos sin dependencias entre sí. Paso 3 desbloquea todo lo demás.

---

## Qué resuelve cada pieza

| Problema | Solución |
|---|---|
| CI no se triggerea (paths stale) | `validate.yml` actualizado a `skills/**` |
| ¿Qué skills tengo disponibles? | `skills-manifest.json` en `halo-marketplace` |
| Publicación manual y olvidadiza | CI corre en merge, genera todo a `dist/` |
| BMAD que nadie actualiza | Claude API en CI con hashing por tipo |
| Versiones manuales en plugin.json | `date-sha` automático desde git |
| 20 devs × muchos pushes = tokens desbordados | Content hashing en `skill-to-bmad.ts` |
| ¿Quién puede cambiar el transform? | CODEOWNERS en `build/prompts/` |
