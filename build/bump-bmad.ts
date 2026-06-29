import fs from 'fs'
import yaml from 'js-yaml'

interface Manifest {
  skills: Array<{ name: string; version: string | null }>
}

interface BmadSkillRef {
  skill: string
  [key: string]: unknown
}

interface BmadModule {
  released_version?: string | null
  skill_versions?: Record<string, string>
  skills: BmadSkillRef[]
  [key: string]: unknown
}

interface BmadYaml {
  workflows?: Record<string, Record<string, unknown>>
  modules?: Record<string, BmadModule>
}

// All built-in BMAD skills from https://github.com/bmad-code-org/bmad-method start with "bmad-"
const isBmadBuiltin = (name: string) => name.startsWith('bmad-')

const manifest = JSON.parse(fs.readFileSync('skills-manifest.json', 'utf-8')) as Manifest
const bmadYaml = yaml.load(
  fs.readFileSync('platforms/bmad.yaml', 'utf-8')
) as BmadYaml

const manifestSkills = new Set(manifest.skills.map(s => s.name))
const workflows = bmadYaml.workflows ?? {}
const modules = bmadYaml.modules ?? {}

let changed = false
let needsRelease = false

// Remove workflows for deleted skills
for (const skillName of Object.keys(workflows)) {
  if (!isBmadBuiltin(skillName) && !manifestSkills.has(skillName)) {
    console.log(`removed from bmad.yaml workflows: ${skillName} (no longer in manifest)`)
    delete workflows[skillName]
    changed = true
    needsRelease = true
  }
}

// Remove deleted skills from module skill lists
for (const [moduleCode, mod] of Object.entries(modules)) {
  const removed = mod.skills.filter(s => !isBmadBuiltin(s.skill) && !manifestSkills.has(s.skill))
  if (removed.length > 0) {
    for (const s of removed) {
      console.log(`removed from bmad.yaml module "${moduleCode}": ${s.skill} (no longer in manifest)`)
    }
    mod.skills = mod.skills.filter(s => isBmadBuiltin(s.skill) || manifestSkills.has(s.skill))
    if (mod.skill_versions) {
      for (const s of removed) delete mod.skill_versions[s.skill]
    }
    changed = true
    needsRelease = true
  }

  // Nullify followed-by / preceded-by refs pointing to deleted skills
  for (const s of mod.skills) {
    for (const field of ['followed-by', 'preceded-by'] as const) {
      const val = s[field]
      if (typeof val === 'string') {
        const referencedSkill = val.split(':')[0]
        if (!isBmadBuiltin(referencedSkill) && !manifestSkills.has(referencedSkill)) {
          console.log(`nullified ${field} in module "${moduleCode}" skill "${s.skill}": ${val} (no longer in manifest)`)
          s[field] = null
          changed = true
          needsRelease = true
        }
      }
    }
  }

  if (mod.skills.length === 0) {
    console.log(`removed module "${moduleCode}" — no skills remaining`)
    delete modules[moduleCode]
    changed = true
    needsRelease = true
  }
}

if (changed) {
  fs.writeFileSync(
    'platforms/bmad.yaml',
    yaml.dump(bmadYaml, { lineWidth: -1, noRefs: true, sortKeys: false })
  )
  console.log('updated: platforms/bmad.yaml')
}

if (needsRelease) {
  console.log('⚠ run /bmad-release to publish these removals to the BMAD repo')
} else {
  console.log('bmad.yaml is up to date')
}
