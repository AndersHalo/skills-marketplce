---
name: mercer-develop
description: Context for developing on the Mercer (MMC) client engagement. Use whenever working on Mercer code, repos, infrastructure, or deployments. Covers VDI-only development via Omnissa Horizon, Okta auth everywhere, the closed-network GitHub workflow, HashiCorp Vault access, Polaris/Komodor deployments, the dependency-freshness policy, code-owner approvals, the private Atlas UI library, and the src-only repo structure.
---

# Mercer (MMC) Development Context

Mercer is a Halo client with a **closed, corporate Microsoft/Windows ecosystem**. Almost nothing can be built on a local Halo machine — development happens inside a remote VDI. Read this before doing any Mercer work; the constraints below change how code is written, moved, and deployed.

## The single most important fact

**All Mercer development happens inside a remote VDI (VirtualBox-based, "VDI").** You connect to it with the **Omnissa Horizon** client. Halo machines are outside Mercer's network, so they cannot reach Mercer's GitHub, infrastructure, or the private UI library. Code is authored or finalized inside the VDI.

## Quick Reference

| Topic              | Value                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Dev environment    | Remote VDI (VirtualBox), corporate Windows + Microsoft ecosystem                               |
| VDI access client  | Omnissa Horizon                                                                                |
| Auth provider      | **Okta** for everything — including VDI/Horizon login, dev portal, all services               |
| Developer portal   | https://developer.mmc.com/ (Vault, AWS, Datadog, Komodor, repos, infra)                        |
| GitHub org         | https://github.com/mmctech (reachable only from inside the VDI)                                |
| US support         | +1 502 581 5000 — for VDI password (asks for employee number + office, usually NY)             |
| Secrets            | HashiCorp **Vault** (LDAP auth); read at deploy time and injected into images                  |
| Deploy             | **Polaris** provisions infrastructure; **Komodor** for orchestration/observability             |
| In-VDI AI tooling  | **Microsoft Copilot only** (limited tokens). Claude / other tools are NOT allowed in the VDI   |
| Code movement      | Halo↔VDI only via a Halo GitHub repo + `git pull`/`push` inside VDI (their GitHub is unreachable from outside) |
| Frontend UI lib    | **Atlas** — Mercer's private library; never leaves the VDI ecosystem                           |
| Repo approval      | Code owners must approve PRs                                                                    |
| Repo structure     | Fixed; you inject only your `src/` into their repo                                              |
| Package registry   | **Artifactory mandatory** — `https://mgti-dal-so-art.mrshmc.com/artifactory/api/npm/npm`        |
| FE MFA login       | Add the app in **Okta Preview** (https://mmc.oktapreview.com/enduser/catalog) or you hit the "unassigned" path |
| Stack              | Nx 22 monorepo, Angular (locked at 19 for the auth lib), Okta, Jest, Cypress→Playwright, EKS/Helm |

## Before you can do anything: access

Request **ahead of time, per developer**, from the **project manager** (PM):

1. **VDI credentials** (one set per developer per project).
2. **Developer portal access** (https://developer.mmc.com/) — gates Vault, AWS, Datadog, Komodor, and project/infra resources.

Getting the VDI password is a manual, human process:
- It usually requires **physically calling US support**.
- Support needs **your manager on a live call** to release the password while you are also on the call.

Everything authenticates through **Okta** — VDI/Horizon, the dev portal, and all downstream services. Your **net password is typically reused across all accounts**.

## Top rules and gotchas

1. **Dependency freshness policy (hard rule).** Any dependency whose **latest release is less than 2 days old** will be **rejected** at PR review / deployment. Pin to versions older than 2 days. Applies to `package.json` (Node) and equivalents. All package traffic must go through **Artifactory**; transitive offenders are pinned via the `package.json` `overrides` block. See [dependencies.md](dependencies.md).
2. **Rejected deploy? Get the artifact.** When a deployment is rejected, the project's **Actions page shows a summary with downloadable artifacts** containing the exact error and the offending library. Download it to see precisely what to fix.
3. **Their GitHub is unreachable from Halo.** Move code by pushing to a **Halo repo**, then `git pull` inside the VDI (and the reverse to bring code back). OneDrive / Slack / Teams zip transfers work but are slower and worse — prefer the Git round-trip.
4. **Inject only `src/` into their repos.** Their repos have a **pre-set structure and automatic deployment**. When migrating, drop your `src/` into their fixed structure and **remove everything else** from our code.
5. **Atlas stays in the VDI.** The Atlas UI library is private and not published anywhere. It may be shared *outside* the VDI manually via zip for our convenience, but **must never be spread to Mercer people** — they want Atlas kept inside the VDI ecosystem. Because of this, **most frontend code is written inside the VDI using Copilot**.
6. **Code-owner approvals are a bottleneck.** Required code owners are often unavailable or slow. To keep work flowing you may **make yourself an admin on the repo** you're working on.
7. **No Claude inside the VDI.** Only Microsoft Copilot is permitted there, and token quotas are tight. Do as much design/heavy authoring as possible on the Halo side, then move it in.
8. **Vault namespace prefix can break access.** Opening Vault from the dev portal injects a namespace that may fail — **remove the namespace prefix** to fix it. Authenticate with the **LDAP** method using your username/password.

## Backend vs Frontend

- **Backend:** generally smooth. Main constraint is the dependency-freshness policy (rule 1).
- **Frontend:** same constraints **plus Atlas** (rule 5), so most of it must be done inside the VDI with Copilot — slower and more painful for us.

## Useful links

- Developer portal: https://developer.mmc.com/
- GitHub org: https://github.com/mmctech (only reachable from inside the VDI)

## Additional resources

Load the focused file for the task at hand:

| File | Load when… |
| --- | --- |
| [reference.md](reference.md) | Day-to-day workflows: code round-trip, repo structure, approvals, Vault access (incl. the config screen), service quick-reference. |
| [onboarding.md](onboarding.md) | Setting up a new developer / VDI: GitHub access request flow & groups, WSL enablement, tool installs, Okta Preview, Copilot licenses & tokens. |
| [deployment.md](deployment.md) | Deploying or wiring CI/CD: STG/PRD deploy walkthrough, Unified Pipeline (stages/runners/modes), runtime platform (Docker/Helm/EKS/Vault entrypoint/Datadog), environment-file setup. |
| [auth-okta.md](auth-okta.md) | Implementing or debugging auth: Okta env config, `APP_INITIALIZER` flow, resolution order, gotchas, the `@marsh.com` migration. |
| [dependencies.md](dependencies.md) | Adding/upgrading deps or hitting install/scan blocks: freshness rule, Artifactory/`.npmrc`, `overrides` + JFrog 403 workarounds, Snyk/Wiz/JFrog, Atlas `.tgz` vendoring. |
| [project-structure.md](project-structure.md) | Scaffolding or navigating a Mercer repo: Polaris Blueprint Nx layout, tech stack, scripts, ports, devcontainer, conventions. |
| [troubleshooting.md](troubleshooting.md) | Something is broken: catalog of VDI/WSL/Cloud PC/CI-CD/supply-chain/auth/Atlas/DB/tooling issues with recorded fixes. |

---

**Last updated:** 2026-06-11 by Jonathan Franco
