# Mercer (MMC) — Dependencies & Supply-Chain Controls

Mercer enforces strict package-security policies directly in the repo config. These are the **most common source of broken builds** — read this before adding or upgrading any dependency. See [reference.md](reference.md) §6 for the short version of the freshness rule.

---

## 1. The package-freshness rule (hard gate)

- A dependency whose **latest published release is too new is automatically blocked** at PR review / deployment.
- **Current window: 2 days.** It started at **7 days** (introduced after a supply-chain attack on `axios` 1.14.1, which blocked nearly every repo) and was later shortened to 2 days.
- **Pin to versions older than the window.** Applies to `package.json` (Node) and equivalents.
- New Atlas (and other) package versions are therefore **unavailable for download for ~2–3 days** after release — plan upgrades around that window.
- **When a deploy is rejected:** open the project's **Actions page** — it shows a summary with **downloadable artifacts** containing the exact error and the offending library.

---

## 2. Artifactory is mandatory

All package traffic flows through **Artifactory** and is subject to release-age policies. Point npm at the internal registry:

```bash
npm config set registry https://mgti-dal-so-art.mrshmc.com/artifactory/api/npm/npm
```

Typical `.npmrc`:

```
registry=https://<artifactory-host>/artifactory/api/npm/npm
save-exact=true
legacy-peer-deps=true
min-release-age=2
```

Key controls: all downloads proxied through Artifactory; **exact** versions enforced; packages younger than 2 days auto-blocked.

---

## 3. Dependency overrides & the JFrog 403 workaround

`package.json` uses an `overrides` block to pin vulnerable or blocked **transitive** dependencies:

```json
{
  "overrides": {
    "axios": "<allowed-version>",
    "picomatch@^4.0.0": "<allowed-version>",
    "path-to-regexp@^8.2.0": "<allowed-version>",
    "file-type": "<allowed-version>",
    "@babel/runtime": "<allowed-version>",
    "@emnapi/core": "<allowed-version>",
    "@emnapi/runtime": "<allowed-version>"
  }
}
```

**`npm install` failing with 403 from JFrog Artifactory** (version not yet cached/whitelisted) — options:
- Use a script that detects 403-blocked packages, resolves the latest **allowed** version from JFrog, and pins them in the `overrides` block; **commit the overrides** so others don't repeat the work.
- Or upgrade **npm to `^11`** to pass the 403s.
- Or install skipping too-new packages: `npm install --before=$(date -d '2 days ago' +%Y-%m-%d)`.
- Or temporarily target an internal library as a local `file:` dependency.

> ⚠ These are **bypasses of an enforced control**. The team's guidance: escalate them as blockers rather than hiding them.

---

## 4. Security scanning (CI-integrated)

- **Snyk**, **GitGuardian**, **SonarQube**, **Wiz** (container image scanning).
- An optional automated remediation workflow can patch Wiz findings and open a PR (`cicd_auto_healer_wiz.yml` — see [deployment.md](deployment.md)).

Common scan issues & fixes:
- **Wiz rejects a transitive/npm-bundled dep** (e.g. `picomatch`) even when the version is already pinned → align/override the bundled dependency to an allowed version; escalate where the bundled version can't be controlled directly.
- **Wiz HTTP 400 "no scan job nor result exists for this image"** → re-submit / re-trigger the scan (transient state).
- **Wiz grace period ending** (e.g. `lodash`) → update/remediate the flagged dependency before it expires.
- **Vulnerabilities from Mercer base images** → track against the base-image owners; remediate via updated base images.
- **`Non DB Destructive Scripts` check failing due to IP restrictions** → tracked via a ServiceNow ticket (IP/firewall allowance).
- **Snyk project import blocked by insufficient privileges** → raise a ServiceNow ticket to the appropriate group.

---

## 5. Exact pinning convention

Versions are intentionally pinned. **Do not casually introduce `^` or `~` ranges.** Prefer the working `package.json` / `.npmrc` / workflow references over static tech-stack docs, which can lag reality.

For Atlas specifically, pin exact and use `~` (not `^`) only when you want patches without auto-adopting branding/major changes — see [troubleshooting.md](troubleshooting.md) §Atlas.

---

## 6. Using Atlas outside the VDI (vendoring cheat)

Atlas is only installable **inside the VDI**. To build against it on the Halo side, vendor the packages as `.tgz` files (generated from the `node_modules` installed in the VDI) and reference them in `package.json`:

```json
"atlas-accordion": "file:./vendor/atlas/atlas-accordion-12.0.0.tgz",
"atlas-alert":     "file:./vendor/atlas/atlas-alert-12.0.0.tgz",
"atlas-button":    "file:./vendor/atlas/atlas-button-12.0.0.tgz",
"atlas-cdk":       "file:./vendor/atlas/atlas-cdk-12.0.0.tgz",
"atlas-field":     "file:./vendor/atlas/atlas-field-12.0.0.tgz",
"atlas-icon":      "file:./vendor/atlas/atlas-icon-12.0.0.tgz"
```

(The full set covers accordion, alert, avatar, badge, button, cdk, checkbox, chips, divider, drawer, field, icon, link, list, menu, tooltip, …) Keep these under `vendor/atlas/`.

> ⚠ Atlas is private — it may be zipped **out** of the VDI for our convenience, but **must never be distributed to Mercer people**; they want Atlas kept inside the VDI ecosystem. See [SKILL.md](SKILL.md) rule on Atlas.

---

**Last updated:** 2026-06-11 by Jonathan Franco
