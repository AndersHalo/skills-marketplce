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
  if (!manifestSkills.has(skillName)) {
    console.log(`removed from bmad.yaml workflows: ${skillName} (no longer in manifest)`)
    delete workflows[skillName]
    changed = true
    needsRelease = true
  }
}

// Remove deleted skills from module skill lists
for (const [moduleCode, mod] of Object.entries(modules)) {
  const removed = mod.skills.filter(s => !manifestSkills.has(s.skill))
  if (removed.length > 0) {
    for (const s of removed) {
      console.log(`removed from bmad.yaml module "${moduleCode}": ${s.skill} (no longer in manifest)`)
    }
    mod.skills = mod.skills.filter(s => manifestSkills.has(s.skill))
    if (mod.skill_versions) {
      for (const s of removed) delete mod.skill_versions[s.skill]
    }
    changed = true
    needsRelease = true
  }

  if (mod.skills.length === 0) {
    console.log(`⚠ module "${moduleCode}" has no skills — consider removing it from bmad.yaml`)
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
