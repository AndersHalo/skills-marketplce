import fs from 'fs'
import yaml from 'js-yaml'

interface Manifest {
  skills: Array<{ name: string; version: string | null }>
}

interface PluginEntry {
  version: string
  description?: string
  skill_versions?: Record<string, string>
  skills: string[]
}

interface MarketplaceYaml {
  plugins: Record<string, PluginEntry>
}

const manifest = JSON.parse(fs.readFileSync('skills-manifest.json', 'utf-8')) as Manifest
const marketplaceYaml = yaml.load(
  fs.readFileSync('platforms/marketplace.yaml', 'utf-8')
) as MarketplaceYaml

const currentVersions = new Map<string, string>(
  manifest.skills
    .filter(s => s.version !== null)
    .map(s => [s.name, s.version as string])
)

let changed = false

for (const [pluginName, plugin] of Object.entries(marketplaceYaml.plugins)) {
  // Remove skills that no longer exist in the manifest
  const removed = plugin.skills.filter(s => !currentVersions.has(s))
  if (removed.length > 0) {
    for (const s of removed) {
      console.log(`removed from ${pluginName}: ${s} (no longer in manifest)`)
    }
    plugin.skills = plugin.skills.filter(s => currentVersions.has(s))
    if (plugin.skill_versions) {
      for (const s of removed) delete plugin.skill_versions[s]
    }
    changed = true
  }

  if (plugin.skills.length === 0) {
    console.log(`removed plugin "${pluginName}" — no skills remaining`)
    delete marketplaceYaml.plugins[pluginName]
    changed = true
    continue
  }

  // Bump patch version if any skill version changed since last snapshot
  const snapshot = plugin.skill_versions ?? {}
  const newSnapshot: Record<string, string> = {}
  let needsBump = false

  for (const skillName of plugin.skills) {
    const current = currentVersions.get(skillName)
    if (!current) continue
    newSnapshot[skillName] = current
    if (snapshot[skillName] !== current) needsBump = true
  }

  if (!plugin.skill_versions) {
    marketplaceYaml.plugins[pluginName] = {
      version: plugin.version,
      description: plugin.description,
      skill_versions: newSnapshot,
      skills: plugin.skills,
    }
    changed = true
    console.log(`snapshot init: ${pluginName}`)
  } else if (needsBump) {
    const parts = plugin.version.split('.').map(Number)
    parts[2] = (parts[2] ?? 0) + 1
    const newVersion = parts.join('.')
    marketplaceYaml.plugins[pluginName] = {
      version: newVersion,
      description: plugin.description,
      skill_versions: newSnapshot,
      skills: plugin.skills,
    }
    changed = true
    console.log(`plugin bump: ${pluginName} v${plugin.version} → v${newVersion}`)
  }
}

if (changed) {
  fs.writeFileSync(
    'platforms/marketplace.yaml',
    yaml.dump(marketplaceYaml, { lineWidth: -1, noRefs: true, sortKeys: false })
  )
  console.log('updated: platforms/marketplace.yaml')
} else {
  console.log('all plugins up to date')
}
