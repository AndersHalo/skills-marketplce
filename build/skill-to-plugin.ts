import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface MarketplaceYaml {
  plugins: Record<string, { version?: string; description?: string; skills: string[] }>
}

const SKILLS_DIR = 'skills'
const DIST_DIR = 'dist'

// Files that are build metadata, not skill content
const EXCLUDE_FILES = new Set(['.skill-meta.json', 'session.json'])

function copySkillDir(srcDir: string, destDir: string): string[] {
  const copied: string[] = []

  function walk(src: string, dest: string, rel: string) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(
          path.join(src, entry.name),
          path.join(dest, entry.name),
          path.join(rel, entry.name),
        )
      } else {
        if (EXCLUDE_FILES.has(entry.name)) continue
        fs.copyFileSync(path.join(src, entry.name), path.join(dest, entry.name))
        copied.push(path.join(rel, entry.name))
      }
    }
  }

  walk(srcDir, destDir, '')
  return copied
}

const marketplaceYaml = yaml.load(
  fs.readFileSync('platforms/marketplace.yaml', 'utf-8')
) as MarketplaceYaml

const marketplacePlugins: Array<{ name: string; description: string; path: string }> = []

for (const [pluginName, plugin] of Object.entries(marketplaceYaml.plugins)) {
  const pluginDir = path.join(DIST_DIR, 'plugins', pluginName)
  const skillEntrypoints: string[] = []

  for (const skillName of plugin.skills) {
    const skillSrcDir = path.join(SKILLS_DIR, skillName)
    const skillDestDir = path.join(pluginDir, 'skills', skillName)

    if (!fs.existsSync(path.join(skillSrcDir, 'SKILL.md'))) {
      console.warn(`  warn: ${skillName}/SKILL.md not found, skipping`)
      continue
    }

    const files = copySkillDir(skillSrcDir, skillDestDir)
    skillEntrypoints.push(`skills/${skillName}/SKILL.md`)
    console.log(`  + ${skillName} (${files.length} files)`)
  }

  const version = plugin.version ?? '0.0.0'

  const pluginJson = {
    schemaVersion: '1.0',
    name: pluginName,
    version,
    description: plugin.description ?? '',
    skills: skillEntrypoints,
  }

  const pluginMetaDir = path.join(pluginDir, '.claude-plugin')
  fs.mkdirSync(pluginMetaDir, { recursive: true })
  fs.writeFileSync(path.join(pluginMetaDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2))

  marketplacePlugins.push({ name: pluginName, description: plugin.description ?? '', path: `plugins/${pluginName}` })
  console.log(`plugin: ${pluginName} v${version} (${skillEntrypoints.length} skills)`)
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
