import fs from 'fs'
import yaml from 'js-yaml'
import { execSync } from 'child_process'

interface Plugin {
  version?: string
  description?: string
  skills: string[]
}

interface MarketplaceYaml {
  plugins: Record<string, Plugin>
}

function bumpPatch(version: string): string {
  const parts = version.split('.').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: "${version}"`)
  }
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
}

function skillFilesChanged(skillNames: string[]): boolean {
  const paths = skillNames.map(s => `skills/${s}`).join(' ')
  try {
    const out = execSync(`git diff --name-only HEAD~1 HEAD -- ${paths}`).toString().trim()
    return out.length > 0
  } catch {
    return false
  }
}

function previousPluginVersion(pluginName: string): string | null {
  try {
    const oldYaml = execSync('git show HEAD~1:platforms/marketplace.yaml').toString()
    const old = yaml.load(oldYaml) as MarketplaceYaml
    return old.plugins[pluginName]?.version ?? null
  } catch {
    // No HEAD~1 (initial commit) or plugin is new
    return null
  }
}

const yamlPath = 'platforms/marketplace.yaml'
const raw = fs.readFileSync(yamlPath, 'utf-8')
const data = yaml.load(raw) as MarketplaceYaml

let anyBumped = false

for (const [name, plugin] of Object.entries(data.plugins)) {
  if (!plugin.version) {
    console.log(`${name}: no version field — skipping`)
    continue
  }

  const prevVersion = previousPluginVersion(name)
  const filesChanged = skillFilesChanged(plugin.skills)
  const devBumped = prevVersion !== null && prevVersion !== plugin.version

  if (!filesChanged) {
    console.log(`${name}: no changes — ${plugin.version}`)
  } else if (devBumped) {
    console.log(`${name}: manual bump ${prevVersion} → ${plugin.version}`)
  } else {
    const next = bumpPatch(plugin.version)
    console.log(`${name}: auto-bump ${plugin.version} → ${next}`)
    plugin.version = next
    anyBumped = true
  }
}

if (anyBumped) {
  fs.writeFileSync(yamlPath, yaml.dump(data, { lineWidth: -1, quotingType: '"', forceQuotes: false }))
  console.log('marketplace.yaml updated')
} else {
  console.log('no bumps needed')
}
