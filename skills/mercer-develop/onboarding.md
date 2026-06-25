# Mercer (MMC) — Onboarding & Access Setup

First-time setup for a new developer or a new VDI/Cloud PC. Access provisioning is slow and human-driven, so **start early**. See [reference.md](reference.md) for day-to-day workflows and [SKILL.md](SKILL.md) for the rules summary.

---

## 1. What a Mercer manager must grant you

A manager from Mercer enables these — request them up front:

- **Developer Portal:** https://developer.mmc.com/ (gates Vault, AWS, Datadog, Komodor, repos, infra)
- **Vault:** https://mgti-dal-so-vlt.mrshmc.com/ui/vault/auth?with=ldap
- **WSL** (via a request form) and **elevated developer access**
  - WSL setup doc (Mercer internal): "Setup your local development environment (WSL based)"

Everything authenticates through **Okta**; your **net password is typically reused** across all accounts.

---

## 2. Request GitHub (and Datadog) access

1. Go to **https://accessmanagement.selfservice.mmc.com/v2/users/pages/home**
2. Log in with `MERCER\firstname-lastname` and your network password.
3. Click the green **Request access** button.
4. Request the apps your manager specifies. Common groups:
   - **GitHub:** `MERCER\MERCER-OKTA-GitHub_MMC-Tech-S-G`
   - **Datadog:** `MERCER\MERCER-OKTA-DataDog-S-G`
5. Wait for approval. Check status at **https://accessmanagement.selfservice.mmc.com/v2/users/pages/history**
6. Log into GitHub at **https://github.com/mmctech**. Once your GitHub handle is set up and you've logged in, **repo access can be granted**.

If access isn't granted, request **local admin access** via Mercer's "Technology support contacts" (the `MMCLocalAdmin.exe` tool is used to elevate locally).

---

## 3. Install local / VDI tooling

- **Git for Windows** — https://git-scm.com/downloads/win — accept **Git Credential Manager** during install.
- **VS Code** (latest) with:
  - **GitHub Copilot** extension (installed and activated)
  - **GitHub Copilot Chat** extension
- **NVM for Windows:** `winget install CoreyButler.NVMforWindows`
- **Slack** — useful for transferring files into the VDI.

> Inside the VDI, **only Microsoft Copilot is permitted** for AI assistance (no Claude). Do heavy authoring on the Halo side and move code in — see [reference.md](reference.md) §3.

---

## 4. Okta Preview (required for FE multi-factor login)

To log into the front-end app through MFA:

1. Go to **https://mmc.oktapreview.com/enduser/catalog**
2. Add the app **MMCTech Portal DEV** (or the app your manager specifies) to your app list.

> This ties into the auth flow's loop-prevention: if you are **not** added to the app in the Okta catalog, the app sets the `aip_okta_unassigned` flag and you land on the "unassigned" path instead of logging in. See [auth-okta.md](auth-okta.md).

---

## 5. GitHub Copilot — licenses, tokens & billing

- You need an **active GitHub Copilot subscription** (individual or enterprise). License requests can stall for weeks at manager / BU-delegate approval — escalate through your line manager / BU delegate if stuck.
- Request additional tokens from your manager via the **Copilot Request** portal (manager + cost-center approval required).
- Copilot is moving to **token-based billing** with per-seat monthly budgets. Recommended workflow:
  - Use **free completions** first; do spec / pre-work before agentic sessions.
  - Set Copilot to **Auto mode** for model selection (used in VS Code).
  - Install the **Copilot Spend Tracker** to monitor token consumption/spend in real time (per-model breakdown, configurable warning thresholds).
  - Use the **Caveman skill** in Polaris Launchpad to strip unnecessary context and cut token usage.
  - Offload non-coding work to alternative tools (Lenwork, Lenai, AIDE/Q-AIDE, PersonaAI).

---

## 6. Useful links

| Resource | URL |
| --- | --- |
| Developer Portal | https://developer.mmc.com/ |
| Vault (LDAP) | https://mgti-dal-so-vlt.mrshmc.com/ui/vault/auth?with=ldap |
| Access management (request) | https://accessmanagement.selfservice.mmc.com/v2/users/pages/home |
| Access management (history) | https://accessmanagement.selfservice.mmc.com/v2/users/pages/history |
| GitHub org | https://github.com/mmctech |
| Okta Preview catalog | https://mmc.oktapreview.com/enduser/catalog |
| Polaris Launchpad | https://polaris-launchpad.int.prd.dal.oss2.mrshmc.com/ |

---

**Last updated:** 2026-06-11 by Jonathan Franco
