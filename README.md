# halo-skills

Repositorio privado de skills de Halo. Cada merge a `main` genera y publica automáticamente los plugins de Claude Code a [marketplace-ai](https://github.com/AndersHalo/marketplace-ai).

---

## Cómo funciona

```
skills/          →  build:plugins  →  dist/  →  marketplace-ai
platforms/
```

1. Los autores editan skills en `skills/` y declaran plugins en `platforms/marketplace.yaml`
2. Cada PR corre validación de schema
3. Cada merge a `main` genera los plugins y los publica automáticamente

---

## Estructura

```
skills/
  {skill-name}/
    SKILL.md              # contenido del skill
    .skill-meta.json      # metadata: versión, categoría, tags, plataformas

platforms/
  marketplace.yaml        # declara qué skills forman cada plugin
  bmad.yaml               # declara qué skills van a BMAD (pendiente)

build/
  skill-to-plugin.ts      # genera plugins para marketplace
  generate-manifest.ts    # genera índice de skills
  prompts/                # prompts de transform BMAD (pendiente)
```

---

## Agregar un skill nuevo

1. Crear la carpeta `skills/{skill-name}/`
2. Agregar `SKILL.md` con el contenido del skill
3. Agregar `.skill-meta.json`:

```json
{
  "schema_version": 2,
  "skill_name": "my-skill",
  "skill_version": "1.0.0",
  "platforms": ["marketplace"],
  "category": "css",
  "tags": ["css", "responsive"],
  "skill_description": "Descripción de mínimo 20 caracteres.",
  "author": {
    "name": "Tu nombre",
    "email": "tu@halopowered.com"
  }
}
```

4. Abrir PR → merge → el CI publica automáticamente

---

## Publicar un skill en un plugin

Editar `platforms/marketplace.yaml` y agregar el skill al plugin correspondiente:

```yaml
plugins:
  martech-foundation:
    description: "..."
    skills:
      - martech-css
      - my-skill       # agregar aquí
```

Si el plugin no existe, crear una nueva entrada. El CI genera todo lo demás.

---

## Versionado

| Qué | Versión | Quién |
|-----|---------|-------|
| Skill | `skill_version` en `.skill-meta.json` | Autor, manual |
| Plugin | `YYYY-MM-DD-{git-sha}` del último cambio | CI automático |

La versión del plugin solo cambia cuando cambian sus skills — no en cada merge.

---

## CI/CD

| Workflow | Cuándo corre | Qué hace |
|----------|-------------|---------|
| `validate.yml` | Cada PR | Valida schema de `.skill-meta.json` |
| `release.yml` | Cada merge a `main` | Genera plugins y publica a `marketplace-ai` |

**Secret requerido:** `MARKETPLACE_DEPLOY_KEY` — SSH deploy key con write access a `marketplace-ai`.
