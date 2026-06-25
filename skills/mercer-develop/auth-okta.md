# Mercer (MMC) — Okta Authentication

Wiring Okta into a Mercer front-end app, the auth bootstrap flow, and the `@mmc.com → @marsh.com` identity migration. See [deployment.md](deployment.md) §4 for the environment/Vault config this depends on, and [onboarding.md](onboarding.md) §4 for the Okta Preview catalog step.

---

## 1. Prerequisites (mostly from environment setup)

Before the auth initializer can work:

- **`OKTA_AUTH` provided** via `@okta/okta-angular`. The initializer injects it inside a `try/catch` — if it isn't provided, it silently falls back to the postMessage flow, so make sure the Okta provider is actually wired up.
- **`environment.oktaConfig`** (and `oktaSignInConfig`) populated from Vault. Without `oktaConfig`, the auto-redirect never fires.
- **`environment.apiBaseUrl`** pointing at the backend — required to exchange the Okta token for our app token. If it's `null`, the exchange step is skipped entirely.
- A **`/login/callback`** route with `OktaCallbackComponent` mounted.
- **`parentOriginAllowlist`** with valid origins (each entry must equal its `URL.origin` — no trailing slash, no path, lowercase scheme). It's only used by the postMessage fallback, but `validateAuthConfig` runs at module load and will **throw at bootstrap** if it's malformed.

---

## 2. The auth initializer

Register an `APP_INITIALIZER` that resolves auth state **before** the app bootstraps, so nothing renders until we know whether the user is authenticated:

```ts
{
  provide: APP_INITIALIZER,
  useFactory: authInitializer,
  multi: true,
}
```

### Resolution order (production) — stops at the first branch that applies

1. **On the Okta callback** (`oktaAuth.isLoginRedirect()`) → do nothing; `OktaCallbackComponent` handles the token exchange.
2. **Okta already has an access token** → call `getUser()`, read the email (`email` or `preferred_username`), and exchange the Okta token for our app token via `auth.login(email, oktaToken)` → `auth.setToken(...)`. Profile populated with `setProfileFromOktaUser`.
3. **No token yet** → call `signInWithRedirect()` to send the user to the Okta hosted login.
4. **Otherwise** → fall back to **postMessage** (iframe / embedded case), validating `event.origin` against `parentOriginAllowlist` until the JWT arrives or `authBootstrapTimeoutMs` expires.

**New-user end-to-end flow:** no token → step 3 redirects to Okta → user returns to `/login/callback` → step 1 lets the callback store the Okta token → on the next bootstrap, step 2 exchanges it for our app token.

### Gotchas

- **Loop prevention:** the `aip_okta_unassigned` sessionStorage flag blocks the auto-redirect for users **not assigned to the app in Okta**, so they don't get stuck in a redirect loop. This ties into the Okta Preview catalog step — if you haven't added yourself to the app in the catalog ([onboarding.md](onboarding.md) §4), you'll hit the unassigned path.
- **Strip debug logs before PRD:** the initializer has several `console.log` calls (including one that logs the Okta token) — remove them before shipping to production.

---

## 3. Zero-trust & the `@mmc.com → @marsh.com` migration

Identities are migrating `@mercer.com → @mmc.com → @marsh.com`, which is a slow, cross-cutting source of breakage. Plan ahead:

- **Don't hardcode email-domain checks** — they break as identities move. Plan for the `@marsh.com` domain.
- **Zero-trust adapters** (document/communication/authorization) break on migration — follow the Zero Trust migration guide and add the required config entries (e.g. OPA / communication-adapter repo entries), then migrate affected services.
- **`ngpd-merceros-documents-adapter` 2.5.1+** had a `tokenPath` config issue — resolved via corrected adapter configuration.
- **Databricks migration to `@marsh.com`** creates new profiles with no access to existing objects. Before migrating: save all work, transfer ownership of all created objects (tables, views, jobs, models, endpoints, etc.), and document group memberships; after migrating, open a ServiceNow ticket to restore group access. Expect a temporary outage.
- **Service-account passwords / disabled permissions:** use the corporate identity/secrets tooling (CyberArk safe / Identity Manager); account & permission resets are handled by the responsible TPM/support.

---

## 4. Auth library churn

- **`ngpd-merceros-authentication-fe-components`** (7.2.15 + Angular 19) — session-timeout modal intermittently freezes; not fixed during the period, superseded by the move to the new auth library.
- This library is **not compatible with Angular 20**. Stay on **Angular 19** until the replacement **`proxima-authentication-ng`** is released (session management expected to be largely similar, limiting migration effort). See [project-structure.md](project-structure.md) for the Angular-version situation.

---

**Last updated:** 2026-06-11 by Jonathan Franco
