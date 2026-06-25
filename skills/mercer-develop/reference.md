# Mercer (MMC) Development — Reference

Detailed workflows and procedures for the Mercer engagement. See [SKILL.md](SKILL.md) for the quick reference and rules.

---

## 1. Onboarding / access checklist

Do this **before** the project starts — access provisioning is slow and human-driven.

1. **Ask the PM** (project manager) for, per developer:
   - VDI credentials for the project.
   - Developer portal access (https://developer.mmc.com/) covering Vault, AWS, Datadog, Komodor, and the project/infra resources you need.
2. **Get the VDI password** (manual process):
   - Call **US support: +1 502 581 5000**.
   - They verify your identity — be ready with your **employee number** and details like **which office** you're in (usually **NY**, the same location as Halo).
   - Have **your manager join the live call** — support releases the password to the manager while you're on the line.
3. **Okta** is the auth provider for everything (VDI/Horizon, dev portal, all services). Your **net password is usually reused** across accounts.
4. Install / open the **Omnissa Horizon** client and connect to the VDI using your Okta-backed credentials.

---

## 2. Working environment

- The VDI is a **VirtualBox-based remote Windows machine** ("VDI"). Mercer is a **corporate Windows / Microsoft-ecosystem** shop.
- **AI tooling inside the VDI is limited to Microsoft Copilot.** Claude and other tools are not permitted there, and Copilot token quotas per user are tight. Plan to do heavy authoring on the Halo side where possible.
- The VDI is the **only** machine that can reach Mercer's GitHub and internal infrastructure.

---

## 3. Moving code between Halo and the VDI

Mercer's GitHub is **not reachable from outside** their network, so you cannot push/pull their repos from a Halo machine.

**Preferred: Git round-trip via a Halo repo**
- Halo → VDI: push your code to a **Halo GitHub repo**, then `git pull` it **inside the VDI**.
- VDI → Halo: push from inside the VDI to the Halo repo, then `git pull` on the Halo side.

**Fallbacks (slower, avoid when possible):** OneDrive, Slack, or Teams with the code zipped. These are less effective than the Git round-trip — use only if Git isn't an option.

---

## 4. Repo structure & migrating code into Mercer repos

Mercer repos come **pre-set with a fixed structure and an automatic deployment process**.

When moving your code into a Mercer repo:
- **Inject only your `src/` folder** into their repo's fixed structure.
- **Remove everything else** from our code (build scaffolding, configs that don't belong, etc.) — they are locked to their structure and extras break the automated pipeline.

---

## 5. Code review & approvals

- PRs require **code-owner approval**.
- Code owners are frequently **unavailable or slow**, which stalls delivery.
- Workaround to keep things flowing: **make yourself an admin on the repo** you're working on so you aren't blocked waiting on approvals.

---

## 6. Dependency freshness policy (hard rule)

- Any dependency whose **latest published release is less than 2 days old** will cause your **PR / deployment to be rejected**.
- Applies to `package.json` (Node) and equivalent manifests.
- **Pin to versions released more than 2 days ago.**

**When a deploy is rejected:**
- Go to the project's **Actions page** — it shows a **summary with downloadable artifacts**.
- The artifact contains the **exact error and the offending library**, so you can identify and fix the specific dependency.

---

## 7. Secrets — HashiCorp Vault

- Secrets live in **HashiCorp Vault**, accessed through the developer portal.
- **Auth method: LDAP** — use your username and password (typically your net password).
- Vault is **read at deployment time and injected into the container images** at that stage. You don't bake secrets into images yourself.

**Gotcha — namespace prefix:**
- Opening Vault from the dev portal injects a **namespace** that may cause access to fail.
- Fix: **remove the namespace prefix** when it errors.

**Enabling your Vault access (project Vault configuration screen):**
- On the project's Vault configuration screen, **check all the admin checkboxes**, then click **Configure** to enable your access:
  - Add Owning Team Admins
  - Add Developer Team Admins
  - Add Support Team Admins
- Note: these checkboxes are **additive** (they grant, never remove access) and only apply when you press **Configure**.
- This step is **not always required**, but do it if you can't see the Vault.
- See screenshot: [assets/vault-config.png](assets/vault-config.png)

---

## 8. Deployment & infrastructure

- **Polaris** provisions entire infrastructures.
- **Komodor** handles orchestration / observability.
- Other infra/observability services available via the dev portal: **AWS**, **Datadog**.
- Deployments are **automatic** once code is in the correctly structured Mercer repo (see §4).

---

## 9. Frontend & the Atlas UI library

- Mercer's UI stack centers on **Atlas**, their **own private component library** — not published anywhere public.
- Atlas may be shared **outside** the VDI manually via **zip** for our own convenience, **but must never be distributed to Mercer people** — they want Atlas kept inside the VDI ecosystem.
- Because Atlas isn't readily usable outside, **most frontend work is done inside the VDI using Copilot**, which makes the frontend dev process noticeably slower than backend.

---

## 10. Service quick reference

| Service          | Access / notes                                                        |
| ---------------- | --------------------------------------------------------------------- |
| Developer portal | https://developer.mmc.com/ — entry point to everything below          |
| GitHub org       | https://github.com/mmctech — reachable only from inside the VDI       |
| US support       | +1 502 581 5000 — VDI password; asks for employee number + office (NY)|
| Okta             | Auth provider for the entire ecosystem, including Horizon/VDI login   |
| Omnissa Horizon  | Client used to connect to the VDI                                     |
| HashiCorp Vault  | Secrets; LDAP auth; injected into images at deploy (watch namespace)  |
| Polaris          | Infrastructure provisioning                                           |
| Komodor          | Orchestration / observability                                         |
| AWS              | Cloud infra (via dev portal)                                          |
| Datadog          | Monitoring (via dev portal)                                           |

---

**Last updated:** 2026-06-09 by Jonathan Franco
