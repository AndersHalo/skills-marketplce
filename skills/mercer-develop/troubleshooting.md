# Mercer (MMC) — Troubleshooting Catalog

Issues reported against the MMC developer platform and the solution / workaround / status recorded for each. Period covered: **Jan–Jun 2026** (source: `#mercer-all`). Many fixes are **mitigations, not root-cause resolutions** — several patterns recur roughly monthly.

Search here when something breaks. For the underlying systems see [deployment.md](deployment.md), [dependencies.md](dependencies.md), [auth-okta.md](auth-okta.md).

---

## 1. VDI — performance & access

- **Severe slowness on large projects** (1–2s typing lag, WSL disconnects from memory pressure on 32 GB machines) → partial mitigations only: daily clean restart, run only needed services, single VS Code window, set `workbench.editor.limit` below 10. No full fix — treated as a capacity limit.
- **VDI disconnecting repeatedly** (works ~15 min, then drops) → no durable fix; reconnect/restart as a stopgap.
- **Can't copy/paste between VS Code (WSL) and VDI windows** → no confirmed fix; suspected interaction with a local Ubuntu host.
- **VDI password not accepted** → resolved via credential/login retry.
- **No disk space / crashes when running project, test automation, or >2 apps** (Windows retains WSL crash artifacts) → reclaim space by clearing caches/logs (Angular cache, pm2 logs); note: deleting ~15 GB sometimes reclaims only ~4 GB in Windows.
- **"The connection to the remote computer ended"** (plus slowness) → no documented fix; ongoing instability.
- **Broad hardware/UX limits** (~3 fps, input lag, 32 GB RAM insufficient, 8 CPU threads weak single-core, 256 GB cap, no multi-monitor) → raised as a capacity/policy concern; Windows tweaks gave marginal improvement only.
- **Certificate error connecting to the VDI** (multiple users) → **worked:** disable the certificate check under **File → Preference**. (One user still got logged out 5–10s after sign-in.)
- **HTTP 500 / stuck on authentication screen** (several devs blocked at once) → known platform issue with an existing ticket; restored ~40 min later.

---

## 2. WSL — stability & enablement

- **WSL won't start reliably after migration** → no durable fix beyond repeated restarts; tied to VDI/WSL memory/stability limits.
- **WSL crashing every ~5–10 min** (team-wide) → mitigations only (limit memory, fewer VS Code windows/editors, restart). No root-cause fix.
- **Docker Desktop can't run because "Virtual Machine Platform" isn't enabled** → requires the platform feature/permission to be enabled (access/approval route).
- **WSL stopped working company-wide after a new WSL2 approval flow was enforced** → request re-enablement through the new approval flow; provide your **Cloud PC name** to the responsible administrator to be re-added to the WSL2 access groups.

---

## 3. Cloud PC — login

- **Repeated inability to log in / connect** → generally transient: retry, check for account lockout, or wait for the platform-side issue to clear; raise via support if it persists.

---

## 4. CI/CD, Unified Pipeline & GitHub Actions

- **Runners unavailable** ("runners OOO" / no runners) → resolved once runners restored platform-side.
- **Deployment build failing with no code change** (same error across repos) → platform/UP-side change; resolved after a rebuild once DevOps reverted it.
- **GitHub.com no longer accessible directly from laptops** → access GitHub **through the VDI/Island**; direct laptop access was intentionally blocked by a security change.
- **Git push rejected (GH013)** because the author-email regex didn't include `@mmc.com` → set the correct local git author email and amend: `git config --local user.email …` then `git commit --amend --reset-author`.
- **"Non DB Destructive Scripts" check failing due to IP restrictions** → ServiceNow ticket (IP/firewall allowance).
- **No way to undeploy containers via UP** (old Jenkins undeploy job gone) → no clean self-service equivalent; handled case-by-case with platform/DevOps.
- **Deploy failures while pulling images (credential/IAM-looking)** → transient credential/registry-side issue.
- **Developer Portal not listing any apps** / **"ondemand-all" page error** → known platform issue; cleared platform-side.
- **PR-gate automation blocked: runners can't reach the dev3 API on port 443 (firewall)** → needs one of: a firewall rule allowing runners to dev3:443, an externally reachable ingress/proxy, or a runner label with cluster network access — request via ticket.
- **NodeJS apps to be blocked from the Jenkins Pipeline** → advance notice; migrate affected apps off the Jenkins path before cutoff.
- **Intermittent "GitHub is down" / pipeline errors** → upstream GitHub outages; resolved when GitHub recovered (no internal action).

---

## 5. Supply-chain security (Snyk / Wiz / JFrog)

See [dependencies.md](dependencies.md) for the full set. Highlights: the post-`axios` Snyk new-package block (7 → 2 days), JFrog 403s on un-cached versions, and Wiz scan rejections became a major source of broken builds from late March onward — resolved mostly via version pinning, `overrides`, and documented workarounds.

---

## 6. Authentication, Okta & the `@marsh.com` migration

Covered in depth in [auth-okta.md](auth-okta.md) §3–4. Recurring items: zero-trust adapter breakage, hardcoded email-domain checks breaking across `@mercer.com → @mmc.com → @marsh.com`, Databricks profile/access loss on migration, session-timeout modal freeze (`ngpd-merceros-authentication-fe-components` + Angular 19), S3 bucket timeout in DEV (firewall + Calico PR), SonarQube/Sonarlint in IntelliJ failing to reach the Marsh server.

---

## 7. Atlas Design System — version churn & Angular compatibility

- **Frequent breaking releases over five months** (Angular 20 & 21 upgrades + a Marsh-branding rebrand) forcing repeated migration/re-testing → **pin versions deliberately**; use `~` instead of `^` to get patches without auto-adopting branding/major changes; align local `node_modules` to the tested release (e.g. 12.1.x) and clean-install when versions drift (e.g. if 12.2 is picked up).
- **`ngpd-merceros-authentication-fe-components` not compatible with Angular 20** → stay on **Angular 19** until **`proxima-authentication-ng`** ships.
- **Recurring component defects** (field-select extra click, radio checked/unchecked rendering, dropdown-menu mispositioning) → fixed in successive Atlas patch releases; upgrade to the version with the fix.

---

## 8. Databases & connectivity

- **Widespread MongoDB connection errors** (large incident) → platform/connectivity issue affecting multiple teams.
- **Connecting to dev-environment MongoDB with Compass** → connection method/credentials shared per project.

---

## 9. Tooling access & licenses (GitHub Copilot)

- **Copilot license requests stuck for weeks** at manager / BU-delegate approval → submit via the Copilot license request form, track in the dashboard, escalate via line manager / BU delegate.
- **Token-based billing with per-seat monthly budgets** → see the recommended token workflow in [onboarding.md](onboarding.md) §5.

---

## 10. Other individual issues

- **`proxima-cryptography-nodejs` produces different ciphertext each time** for the same input → compare via the library's verify/compare approach, not by re-encrypting and matching ciphertext.
- **Polaris + Puppeteer/Chromium failing in deploy env** → environment/Chromium configuration.
- **Rotating an API key in `googleService-info.plist`** (Firebase / Google Cloud Console) → rotate via the Google Cloud Console; follow the Mercer request process.
- **Deel 2FA login — code not recognized, account temporarily disabled** (recurs ~monthly) → retry after the temporary lock clears; clearing data didn't reliably help.
- **Can't locate the Mercer support / password-reset site** → support portal link / guide shared in-thread.

---

## Cross-cutting patterns & status

- **VDI + WSL** are the chronic recurring problems (performance, stability, access) — mostly mitigations, recurring ~monthly.
- **Supply-chain controls** (Snyk new-package block, Wiz rejections, JFrog 403s) became a major source of broken builds; resolved via pinning/overrides/workarounds, block window relaxed 7 → 2 days.
- **Zero-trust / `@marsh.com` migration** is a slow cross-cutting driver of breakage and migration work.
- **Atlas version churn** (two Angular majors + a rebrand) created repeated compatibility work; resolved via deliberate version pinning.
- **Resolution mode is overwhelmingly peer-to-peer** (shared workarounds, scripts, tickets) rather than a formal support channel.
- **Open at period end:** WSL in VDI, Datadog log-level/visibility, and the Angular-19 lock pending the new auth library.

---

**Last updated:** 2026-06-11 by Jonathan Franco
