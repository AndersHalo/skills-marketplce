import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface SkillMeta {
  skill_name: string
  skill_version: string
  platforms: string[]
}

interface MarketplaceYaml {
  plugins: Record<string, { skills: string[] }>
}

const SKILLS_DIR = 'skills'
const DIST_DIR = 'dist'

const skillDirs = fs.readdirSync(SKILLS_DIR)
const skills: SkillMeta[] = []

for (const dir of skillDirs) {
  const metaPath = path.join(SKILLS_DIR, dir, '.skill-meta.json')
  if (!fs.existsSync(metaPath)) continue
  skills.push(JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as SkillMeta)
}

const marketplaceYaml = yaml.load(
  fs.readFileSync('platforms/marketplace.yaml', 'utf-8')
) as MarketplaceYaml

const skillToPlugin: Record<string, string> = {}
for (const [pluginName, plugin] of Object.entries(marketplaceYaml.plugins)) {
  for (const skillName of plugin.skills) {
    skillToPlugin[skillName] = pluginName
  }
}

const manifest = {
  generated: new Date().toISOString(),
  skills: skills.map(skill => ({
    name: skill.skill_name,
    version: skill.skill_version,
    platforms: skill.platforms,
    plugin: skillToPlugin[skill.skill_name] ?? null,
    status: skillToPlugin[skill.skill_name] ? 'published' : 'unpublished',
  })),
}

fs.mkdirSync(DIST_DIR, { recursive: true })
fs.writeFileSync(path.join(DIST_DIR, 'skills-manifest.json'), JSON.stringify(manifest, null, 2))

console.log(`manifest: ${manifest.skills.length} skills`)
