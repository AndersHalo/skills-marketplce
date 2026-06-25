# Mercer (MMC) — Deployment, CI/CD & Runtime Platform

How code ships at Mercer: the Unified Pipeline, the STG/PRD deploy flow, runtime platform, and environment setup. See [dependencies.md](dependencies.md) for the supply-chain gates that block deploys, and [auth-okta.md](auth-okta.md) for the Okta config that Vault injects.

---

## 1. Deploying to STG / PRD (step by step)

1. In GitHub, go to **Actions** and open the **last action merged into `main`**.
2. Open **"Post Job Run"** and click **"Create Ondemand Ticket"**.
3. Open **"Find Ticket Created"** and click the link **"Please find Camunda Ticket here"** (e.g. `https://developer.mmc.com/unified-pipeline/task/<id>`).
4. The link opens the **Developer Portal deployment view**:
   - Click **stg**.
   - Choose your app (e.g. **COMMERCIAL AI SITE**) in the **SNOW Config Item** dropdown.
   - Click **Deploy Non-Prod**.
   - It shows **running** while in progress and **success** when done.

The deployment view also shows the Commit SHA, App Short Key (e.g. `CMMRCLST`), the approval group (e.g. `MERCER-OKTA-cmmrclst-np-S-G`), the Non-Prod Change Order (e.g. `CHG…`), and the image tag.

---

## 2. Unified Pipeline (UP)

All workflows under `.github/workflows` delegate to reusable workflows hosted in **`mmctech/mmc-tech-unified-pipeline`**. Workflows are **version-pinned** (e.g. `@v2.3`, `@gitOps_poc`).

**Triggers:** Pull Request → `main`, Push, Manual (`workflow_dispatch`).
**Common inputs:** `deployToDev`, `imageScan`, `configRepo`, `runner_choice`.

**Pipeline stages:**
1. Build & Test
2. SecOps Code Scan
3. Container Build & Image Scan
4. GitOps Update **or** Legacy Deployment
5. Database Deployment (optional)
6. Camunda Updaters
7. Post-Deploy Testing
8. Cleanup & Cache Maintenance

**Runners:** `mmc-ubuntu`, `mmc-arc-emea` (ARC = Actions Runner Controller).

**Registry flow:** `submissions.<artifactory-host>` → JFrog Production Repository.

### Deployment modes (two coexist — know which your repo uses)

- **GitOps:** `update_iac_images`, `IAC.json`, `.iac/**`.
- **Legacy Direct Deployment:** deploy-matrix approach, controlled via the `isGitOps` flag.

### Automated Wiz remediation

`cicd_auto_healer_wiz.yml`, when enabled: detects container vulnerabilities → attempts automated remediation → opens a PR with proposed fixes.

---

## 3. Runtime platform (OSS2 / AWS EKS)

**Container runtime** — `deployments/docker/Dockerfile.ui`:
- Internal **nginx-jammy** base image, MPC CLI installation, Vault integration, static bundle serving on **port 8080**, build-metadata labels.

**Helm** — `deployments/helm/aws-ui.yml`: Ingress, TLS, liveness/readiness probes, CPU/memory constraints, node affinity, replica config, **IRSA** integration.

**Secrets — HashiCorp Vault** (`deployments/docker/entrypoint.sh`):
- Auth methods: **Kubernetes JWT** and **AWS Authentication** (`perform-aws-auth`).
- Incremental retry up to **10 attempts**, env-var injection, **runtime JavaScript token replacement** (no image rebuild required).
- Tokens look like `${{ KEY }}`.
- **Vault bypass:** set `IS_VAULT_INTEGRATED=false` — useful for first deployments, UI previews, and local development.

**Observability — Datadog:** `DD_SERVICE`, `DD_VERSION`, `DD_ENV`, `DD_APM_ENABLED`; extra metadata via pod annotations.

**Template deployment descriptors requiring project customization:** `PolarisMetadata.json`, `deploy-config.json`, `polaris/project-configuration.json`. (`CODEOWNERS`, `deployments/config/dev-ui.config`, and `deployments/helm/aws-ui.yml` are also project-owned.)

---

## 4. Environment file setup

> The Vault config files are uploaded by **Polaris**.

1. Ensure each environment file pulls **`oktaConfig`** and **`oktaSignInConfig`** from Vault. Example:
   ```ts
   const oktaConfig = parseEscapedJson('${{ UI_OKTA_CONFIG_ANGULAR_STAGE }}');
   const production = JSON.parse('${{ UI_PRODUCTION }}') || true;
   const baseUrl = new URL(oktaConfig.redirectUri);

   const environment: Environment = {
     appVersion: '${{ UI_APP_VERSION }}',
     production,
     apiMode: 'live' as const,
     apiBaseUrl: '${{ UI_API_BASE_URL }}',
     parentOriginAllowlist: [] as const,
     authBootstrapTimeoutMs: 5000,
     desktopMode: true,
     elementBootstrap: 'auto' as const,
     oktaConfig,
   };
   ```
2. Declare which environment file each environment uses in **`project.json`** via `fileReplacements`:
   ```json
   "stage": {
     "fileReplacements": [
       {
         "replace": "apps/ui/src/environments/environment.ts",
         "with": "apps/ui/src/environments/environment.stg.ts"
       }
     ],
     "outputHashing": "all",
     "vendorChunk": true,
     "optimization": { "fonts": false }
   }
   ```

See [auth-okta.md](auth-okta.md) for how `oktaConfig` / `apiBaseUrl` feed the auth initializer.

---

## 5. Polaris & related

- **Polaris** provisions infrastructure and uploads Vault config files. Docs: "Polaris.aspx" (internal). Launchpad: https://polaris-launchpad.int.prd.dal.oss2.mrshmc.com/
- **Komodor** handles orchestration / observability.

---

**Last updated:** 2026-06-11 by Jonathan Franco
