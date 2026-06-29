import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import yaml from 'js-yaml'

const SKILLS_DIR = 'skills'

// ── Schema ───────────────────────────────────────────────────────────────────

const AuthorSchema = z.object({
  name: z.string().min(1, 'author.name is required'),
  email: z
    .string()
    .email('author.email must be a valid email')
    .endsWith('@halopowered.com', 'author.email must be a @halopowered.com address'),
})

const CATEGORIES = [
  // Code
  'css',          // styling, design tokens, layout conventions
  'javascript',   // JS patterns, vanilla or framework-agnostic utilities
  'framework',    // framework-specific (React, Vue, Astro, Next.js…)
  'api',          // REST, GraphQL, third-party integrations
  'cms',          // CMS platforms (HubSpot, WordPress, Shopify, Webflow…)
  // Quality & Delivery
  'testing',      // QA, test automation, coverage strategies
  'devops',       // CI/CD pipelines, deployment, infrastructure
  'security',     // security audits, auth patterns, OWASP, vulnerability scanning
  // Product & Design
  'product',      // product management — roadmaps, PRDs, prototypes, discovery
  'design',       // UI/UX, design systems, visual specifications
  // Data & AI
  'analytics',    // metrics, dashboards, KPI tracking
  'data',         // data transformation, ETL, pipelines
  'ai',           // AI agents, LLM tools, prompt engineering, Claude integrations
  // Team & Process
  'process',      // dev lifecycle practices — team governance, code review conventions, branching strategy, sprint rituals, release process, documentation standards
] as const

const SkillMetaSchema = z.object({
  schema_version: z.literal(2, {
    errorMap: () => ({ message: 'schema_version must be 2 — run the v2 migration' }),
  }),
  skill_name: z
    .string()
    .regex(/^[a-z][a-z0-9-]+$/, 'skill_name must be kebab-case (e.g. "my-skill")'),
  skill_version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'skill_version must be semver (e.g. "1.0.0")'),
  platforms: z
    .array(z.enum(['marketplace', 'bmad']))
    .optional(),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({
      message: `category must be one of: ${CATEGORIES.join(', ')}`,
    }),
  }),
  tags: z.array(z.string()).optional(),
  skill_description: z
    .string()
    .min(20, 'skill_description must be at least 20 characters')
    .max(500, 'skill_description must be at most 500 characters'),
  author: AuthorSchema,
})

// ── Runner ───────────────────────────────────────────────────────────────────

const skillDirs = fs.readdirSync(SKILLS_DIR).filter(d =>
  fs.statSync(path.join(SKILLS_DIR, d)).isDirectory()
)

let errors = 0
const skillVersionMap = new Map<string, string>()

for (const dir of skillDirs) {
  const metaPath = path.join(SKILLS_DIR, dir, '.skill-meta.json')
  const skillMdPath = path.join(SKILLS_DIR, dir, 'SKILL.md')
  const label = `skills/${dir}`

  // SKILL.md must exist
  if (!fs.existsSync(skillMdPath)) {
    console.error(`✖ ${label}: missing SKILL.md`)
    errors++
    continue
  }

  // .skill-meta.json must exist
  if (!fs.existsSync(metaPath)) {
    console.error(`✖ ${label}: missing .skill-meta.json`)
    errors++
    continue
  }

  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  } catch {
    console.error(`✖ ${label}/.skill-meta.json: invalid JSON`)
    errors++
    continue
  }

  const result = SkillMetaSchema.safeParse(raw)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const loc = issue.path.length ? issue.path.join('.') : 'root'
      console.error(`✖ ${label}/.skill-meta.json [${loc}]: ${issue.message}`)
    }
    errors++
    continue
  }

  // skill_name must match directory name
  if (result.data.skill_name !== dir) {
    console.error(
      `✖ ${label}/.skill-meta.json [skill_name]: "${result.data.skill_name}" does not match directory name "${dir}"`
    )
    errors++
    continue
  }

  skillVersionMap.set(result.data.skill_name, result.data.skill_version)
  console.log(`✔ ${label} (v${result.data.skill_version})`)
}

// ── Manifest version sync check ───────────────────────────────────────────────

const MANIFEST_PATH = 'skills-manifest.json'

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`\n✖ skills-manifest.json not found — run "npm run build:manifest"`)
  errors++
} else {
  let manifest: { skills: Array<{ name: string; version: string | null }> }
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  } catch {
    console.error(`✖ skills-manifest.json: invalid JSON`)
    errors++
    manifest = { skills: [] }
  }

  const manifestVersions = new Map<string, string | null>(
    manifest.skills.map(s => [s.name, s.version])
  )

  console.log('')
  let manifestErrors = 0

  for (const dir of skillDirs) {
    const metaPath = path.join(SKILLS_DIR, dir, '.skill-meta.json')
    if (!fs.existsSync(metaPath)) continue

    let meta: { skill_name?: string; skill_version?: string }
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    } catch {
      continue
    }

    const { skill_name, skill_version } = meta
    if (!skill_name || !skill_version) continue

    if (!manifestVersions.has(skill_name)) {
      console.error(
        `✖ skills/${dir}: "${skill_name}" is missing from skills-manifest.json — run "npm run build:manifest"`
      )
      errors++
      manifestErrors++
    } else if (manifestVersions.get(skill_name) !== skill_version) {
      const manifestVersion = manifestVersions.get(skill_name) ?? 'null'
      console.error(
        `✖ skills/${dir}: version mismatch — .skill-meta.json v${skill_version} ≠ skills-manifest.json v${manifestVersion} — run "npm run build:manifest"`
      )
      errors++
      manifestErrors++
    }
  }

  if (manifestErrors === 0) {
    console.log(`✔ skills-manifest.json is in sync`)
  }
}

// ── Marketplace cross-check ───────────────────────────────────────────────────

interface MarketplacePlugin {
  version: string
  skill_versions?: Record<string, string>
  skills: string[]
}

interface MarketplaceYaml {
  plugins: Record<string, MarketplacePlugin>
}

const MARKETPLACE_PATH = 'platforms/marketplace.yaml'

if (!fs.existsSync(MARKETPLACE_PATH)) {
  console.error(`\n✖ platforms/marketplace.yaml not found`)
  errors++
} else {
  const marketplace = yaml.load(fs.readFileSync(MARKETPLACE_PATH, 'utf-8')) as MarketplaceYaml
  console.log('')
  let marketplaceErrors = 0

  for (const [pluginName, plugin] of Object.entries(marketplace.plugins)) {
    for (const skillName of plugin.skills) {
      if (!fs.existsSync(path.join(SKILLS_DIR, skillName))) {
        console.error(`✖ marketplace.yaml [${pluginName}]: "${skillName}" not found in skills/`)
        errors++
        marketplaceErrors++
        continue
      }

      const metaPath = path.join(SKILLS_DIR, skillName, '.skill-meta.json')
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { platforms?: string[] }
          if (!meta.platforms?.includes('marketplace')) {
            console.error(
              `✖ marketplace.yaml [${pluginName}]: "${skillName}" is missing platforms: ["marketplace"] in .skill-meta.json`
            )
            errors++
            marketplaceErrors++
          }
        } catch { /* invalid JSON already reported above */ }
      }
    }

    const snapshot = plugin.skill_versions
    if (!snapshot) {
      console.log(`⚠ marketplace.yaml [${pluginName}]: skill_versions snapshot missing — run "npm run build:manifest"`)
    } else {
      for (const skillName of plugin.skills) {
        const current = skillVersionMap.get(skillName)
        if (current && snapshot[skillName] !== current) {
          console.error(
            `✖ marketplace.yaml [${pluginName}]: stale snapshot — ${skillName} changed ${snapshot[skillName] ?? 'null'} → ${current} — run "npm run build:manifest"`
          )
          errors++
          marketplaceErrors++
        }
      }
    }
  }

  if (marketplaceErrors === 0) {
    console.log(`✔ marketplace.yaml is consistent`)
  }
}

// ── BMAD drift check (warning only) ──────────────────────────────────────────

interface BmadYaml {
  workflows?: Record<string, { released_version?: string | null }>
}

const BMAD_PATH = 'platforms/bmad.yaml'

if (fs.existsSync(BMAD_PATH)) {
  const bmad = yaml.load(fs.readFileSync(BMAD_PATH, 'utf-8')) as BmadYaml
  const workflows = bmad.workflows ?? {}
  console.log('')
  let bmadWarnings = 0

  for (const [skillName, workflow] of Object.entries(workflows)) {
    const current = skillVersionMap.get(skillName)
    const released = workflow.released_version

    if (!current || !released) continue

    const toTuple = (v: string): [number, number, number] => {
      const [maj = 0, min = 0, pat = 0] = v.split('.').map(Number)
      return [maj, min, pat]
    }
    const [cMaj, cMin, cPat] = toTuple(current)
    const [rMaj, rMin, rPat] = toTuple(released)
    const isNewer =
      cMaj > rMaj ||
      (cMaj === rMaj && cMin > rMin) ||
      (cMaj === rMaj && cMin === rMin && cPat > rPat)

    if (isNewer) {
      console.log(`⚠ bmad.yaml [${skillName}]: skill updated v${released} → v${current} — run /bmad-release to publish`)
      bmadWarnings++
    }
  }

  if (bmadWarnings === 0) {
    console.log(`✔ bmad.yaml is up to date`)
  }
}

console.log(`\n${skillDirs.length} skills checked — ${errors} error(s)`)

if (errors > 0) process.exit(1)
