# Mercer (MMC) — Project Structure (Polaris Blueprint)

Reference for the **Polaris Blueprint** starter template: a multi-tier app (Angular/React frontend + optional Node.js backend) scaffolded as an **Nx monorepo** and integrated with the MMC developer platform (Unified Pipeline CI/CD, Artifactory, supply-chain scanning, Vault, OSS2/EKS, Okta, Datadog).

Placeholders: `<workspace-name>` (Nx workspace / `package.json` name), `<app-name>` (generated app, usually `ui` or `api`), `<app-short-key>` (platform app code), `<initiative>` / `<business-unit>` (Polaris registration metadata).

---

## 1. Repository layout — Nx monorepo

Powered by **Nx 22** (`nx.json`, `package.json`): cacheable build/test/lint/E2E targets, `affected:*` commands, `defaultBase: main`, `parallel: 3`.

```
<workspace>/
├── apps/
│   ├── <app-name>/            # Frontend application (Angular by default)
│   └── <app-name>-e2e/        # End-to-end test suite
├── libs/
│   └── shared/
│       ├── config/            # @app/config
│       ├── utils/             # Testing and Cypress helpers
│       ├── styles/            # Shared SCSS styles
│       └── angular-utils/     # Shared Angular utilities
├── deployments/               # Docker, Helm, and deployment configs
├── polaris/                   # Polaris schematic configuration
├── .github/                   # Workflows, tech stack docs, Copilot instructions
├── .devcontainer/             # VS Code Remote Development environment
└── <root config files>        # Nx, TSConfig, ESLint, Jest, Prettier, .npmrc, etc.
```

**TypeScript path aliases** (`tsconfig.base.json`): `@app/config`, `@<workspace>/shared-angular-utils/*`, `@<workspace>/common-styles`, `@<workspace>/shared-utils-cypress`, `@<workspace>/shared-utils-testing`.

**Compiler baseline:** Target `ES2022`, Module `ESNext`, decorators enabled, `resolveJsonModule: true`.

---

## 2. Technology stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend Framework | Angular 20.3.18 | Template supports Angular or React |
| State / Reactivity | RxJS 7.8, zone.js | |
| Authentication | Okta (`@okta/okta-angular`, `@okta/okta-auth-js`) | Baseline — see [auth-okta.md](auth-okta.md) |
| Embedded AI Widget | `@mmctech/micro-lenai-webcomponent` | Optional LenAI web component |
| Language / Transpile | TypeScript 5.9, SWC, Babel preset-env | |
| Unit Testing | Jest 30, jest-preset-angular, ts-jest, jest-mock-extended | |
| E2E Testing | Cypress 15 | `<app-name>-e2e` — **migrating to Playwright** |
| Lint / Format | ESLint 9 (Flat Config), eslint-config-polaris-base, Prettier, polaris-prettier-config | |
| Git Hooks | Husky 9 + lint-staged | Auto-runs ESLint + Prettier on staged files |
| Monorepo Tooling | Nx 22 (`@nx/angular`, `@nx/cypress`, `@nx/jest`, `@nx/eslint`, `@nx/web`, `@nx/workspace`) | |
| Runtime Image | Nginx on Ubuntu Jammy | Listens on port 8080 |

> **E2E is migrating to Playwright.** New projects / actively-developed suites should adopt Playwright; treat new Cypress investment as temporary. Example: https://github.com/mmctech/insight-agent/tree/main/playwright

> **Version-drift notice:** `.github/tech-stack/angular.techstack.md` may declare older Angular/Nx versions than the project actually uses. Treat `package.json`, `nx.json`, lock files, and workflow references as the **source of truth**.

---

## 3. Common package scripts

`start:ui`, `start:api`, `test`, `e2e`, `lint`, `prettier:*`, `eslint:*`, `affected:*`.

Serve with polling (helps in the VDI/WSL environment):
```bash
nx serve <app-name> --host 0.0.0.0 --poll 1000
```

---

## 4. Developer environment

Recommended: **`.devcontainer/devcontainer.json`** (VS Code Remote Development, non-root dev user) instead of `docker-compose.local.yml`.

**Forwarded ports:** UI `4200–4202`, API `8080`, MongoDB `27017`, MSSQL `1433`, Misc `8085`.

**Recommended VS Code extensions:** ESLint, Prettier, MongoDB, MSSQL, GitHub Pull Requests, GitLens, Docker, Code Spell Checker, Jest Runner, Todo Tree, Python, Jupyter. Additional guidance in `.github/copilot-instructions.md`.

---

## 5. Conventions worth internalizing

- **Exact dependency pinning** — no `^` / `~` ranges by default (see [dependencies.md](dependencies.md)).
- **Artifactory is mandatory** — all package traffic flows through it, subject to release-age policy.
- **Centralized CI/CD** — build behavior can change due to Unified Pipeline updates even when app code is unchanged.
- **Runtime config is injected via Vault at startup** — do not bake config into bundles.
- **Know your deployment mode** (GitOps vs Legacy) before making deployment changes (see [deployment.md](deployment.md)).
- **Docs can lag reality** — prefer `package.json` / `.npmrc` / workflow references over static tech-stack docs.
- **E2E is migrating to Playwright** — prefer it for new coverage.
- **Use the repo Mercer + Polaris set up**, and always have the Okta libraries installed (eslint, auth, etc.).

---

**Last updated:** 2026-06-11 by Jonathan Franco
