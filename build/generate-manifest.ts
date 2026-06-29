import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface SkillMeta {
  skill_name: string
  skill_version?: string
  platforms: string[]
  category?: string
  tags?: string[]
  skill_description?: string
}

interface MarketplaceYaml {
  plugins: Record<string, { skills: string[] }>
}

const SKILLS_DIR = 'skills'

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
  skills: skills.map(skill => ({
    name: skill.skill_name,
    version: skill.skill_version ?? null,
    category: skill.category ?? null,
    tags: skill.tags ?? [],
    description: skill.skill_description ?? null,
    platforms: skill.platforms,
    plugin: skillToPlugin[skill.skill_name] ?? null,
    status: skillToPlugin[skill.skill_name] ? 'published' : 'unpublished',
  })),
}

fs.writeFileSync('skills-manifest.json', JSON.stringify(manifest, null, 2))

console.log(`manifest: ${manifest.skills.length} skills`)
