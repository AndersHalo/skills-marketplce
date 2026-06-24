import fs from 'fs'
import path from 'path'
import { z } from 'zod'

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

  console.log(`✔ ${label} (v${result.data.skill_version})`)
}

console.log(`\n${skillDirs.length} skills checked — ${errors} error(s)`)

if (errors > 0) process.exit(1)
