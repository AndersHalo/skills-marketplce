import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { execSync } from 'child_process'

interface MarketplaceYaml {
  plugins: Record<string, { description?: string; skills: string[] }>
}

const SKILLS_DIR = 'skills'
const DIST_DIR = 'dist'

const date = new Date().toISOString().slice(0, 10)
const gitSha = execSync('git rev-parse --short HEAD').toString().trim()
const version = `${date}-${gitSha}`

const marketplaceYaml = yaml.load(
  fs.readFileSync('platforms/marketplace.yaml', 'utf-8')
) as MarketplaceYaml

const marketplacePlugins: Array<{ name: string; description: string; path: string }> = []

for (const [pluginName, plugin] of Object.entries(marketplaceYaml.plugins)) {
  const pluginDir = path.join(DIST_DIR, 'plugins', pluginName)
  const skillPaths: string[] = []

  for (const skillName of plugin.skills) {
    const skillMdPath = path.join(SKILLS_DIR, skillName, 'SKILL.md')

    if (!fs.existsSync(skillMdPath)) {
      console.warn(`  warn: ${skillName}/SKILL.md not found, skipping`)
      continue
    }

    const destDir = path.join(pluginDir, 'skills')
    fs.mkdirSync(destDir, { recursive: true })
    fs.copyFileSync(skillMdPath, path.join(destDir, `${skillName}.md`))
    skillPaths.push(`skills/${skillName}.md`)
    console.log(`  + ${pluginName}/${skillName}`)
  }

  const pluginJson = {
    schemaVersion: '1.0',
    name: pluginName,
    version,
    description: plugin.description ?? '',
    skills: skillPaths,
  }

  const pluginMetaDir = path.join(pluginDir, '.claude-plugin')
  fs.mkdirSync(pluginMetaDir, { recursive: true })
  fs.writeFileSync(path.join(pluginMetaDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2))

  marketplacePlugins.push({ name: pluginName, description: plugin.description ?? '', path: `plugins/${pluginName}` })
  console.log(`plugin: ${pluginName} v${version} (${skillPaths.length} skills)`)
}

const marketplaceJson = {
  schemaVersion: '1.0',
  name: 'Halo Marketplace',
  description: 'Halo AI skill registry — installable Claude Code plugins.',
  plugins: marketplacePlugins,
}

const topLevelMetaDir = path.join(DIST_DIR, '.claude-plugin')
fs.mkdirSync(topLevelMetaDir, { recursive: true })
fs.writeFileSync(path.join(topLevelMetaDir, 'marketplace.json'), JSON.stringify(marketplaceJson, null, 2))

console.log(`marketplace.json: ${marketplacePlugins.length} plugins`)
