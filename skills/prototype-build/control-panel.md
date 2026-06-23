# control-panel

HTML structure, JS behavior, layout rules, and the Scenario model for the floating State panel. Used by prototype-build in Step 7.

## Purpose

The State panel is a floating overlay — not a screen, not part of the prototype UX. It is **embedded in every screen file including `login.html`**.

It gives the viewer one-click access to named demo scenarios — without those controls appearing inside the prototype content itself. Each scenario pre-configures both the role and the dataset, so one click puts the prototype in a specific, meaningful demo context.

---

## Scenario model

A **scenario** is a named, pre-configured demo context. It encodes:
- **Role** — which user type is active
- **Dataset** — the specific data that makes the scenario's FRs visible and demonstrable
- **Story** — a human-readable label describing what the viewer is looking at

The State panel's primary section is a list of scenario buttons. Clicking one calls `setScenario(key)`, which sets both `S.scenario` and `S.role` from the scenario definition and re-renders the screen. One click = complete context, no manual role + state combination required.

A **Role override** section (secondary, smaller buttons) lets the viewer switch role within the current dataset — useful for comparing what different roles see on the same data without switching scenarios.

---

## Two-tier interactivity model

All prototype interactions fall into one of two tiers:

| Tier | Lives in | Controls |
|---|---|---|
| **State panel** | `renderPanel()` + floating overlay | Scenario switching (sets role + dataset) · Role override (changes role within current dataset) |
| **Mockup** | `renderScreen()` + inline JS handlers | All local UI: tab switching, filter pills, search inputs, sort controls, accordion, pagination, row selection, modal triggers |

**Rule:** if a user can reach a state by interacting with the UI normally (clicking a filter, typing a search), it lives in the mockup as a real JS handler. The State panel is for pre-configured data stories that require a specific dataset to be meaningful.

**Local UI interactions must be functional:** every tab set, filter pill, search input, sort header, accordion, or pagination control rendered by `renderScreen()` must have a working JS event handler. Passive-looking interactive elements are a generation error.

---

## Strict content rules

- **Scenario-driven only.** Every button in the panel comes directly from `SCENARIOS[]` — the confirmed scenarios from Step 6. Nothing is added that does not have a corresponding entry in `SCREEN_DATA`.
- **Never add:** debug controls, seed data buttons, config toggles, feature flags, navigation links, or anything not in confirmed scenarios.
- **Never invent** a scenario not confirmed in Step 6.

---

## renderScreen() contract

`renderScreen()` must return **presentational HTML**. It may never contain scenario-switching or role controls. All of the following are forbidden inside `renderScreen()` and inside any static HTML in `#screen-content`:

| Forbidden element | Correct location |
|---|---|
| Scenario buttons or scenario `<select>` | `renderPanel()` → Scenarios section |
| Role buttons or role `<select>` | `renderPanel()` → Role override section |
| "Switch to X" links calling `setScenario()`, `overrideRole()`, or `switchRole()` | `renderPanel()` |
| Any `onclick="setScenario..."`, `onclick="overrideRole..."`, or `onclick="switchRole..."` in mockup HTML | `renderPanel()` |
| A "control panel" or "dev settings" screen rendered as mockup content | The floating State panel only |

**What IS allowed in renderScreen():** local UI handlers (tab clicks, filter toggles, search, sort, accordion) — these operate on already-loaded data from `getData()`.

**Locked / restricted screen pattern:**
```html
<p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0">
  This screen is restricted to [Role]. Use the <strong>⚙ State</strong> panel to switch scenarios.
</p>
```

**Pre-write self-check (run before writing each .html file):**

1. Search `renderScreen()` body for: `setScenario(`, `overrideRole(`, `switchRole(`, any `onclick` targeting scenario/role switching
2. Search all static HTML outside `#state-panel` and `#state-panel-toggle` for the same patterns
3. Verify every tab bar, filter pill, search input, sort control, accordion, and pagination element has a real JS event handler
4. If any violation: move controls to `renderPanel()`, add missing handlers inline, re-run steps 1–3
5. Write the file only after all checks pass

---

## Panel sections

Two sections, top to bottom:

1. **Scenarios — {ScreenName}** — one button per scenario from `SCENARIOS[]`. Active button = `S.scenario`. On click: `setScenario(key)`.

2. **Role override** — one smaller button per role from `ROLE_LABELS`. Active = `S.role`. On click: `overrideRole(role)`. **Omit on `login.html`** and on single-role prototypes.

No Navigate section. Navigation happens through the app's own sidebar or bottom nav links.

---

## HTML structure

Embed directly in `<body>` of **every screen file including `login.html`**, before `#screen-content`.

```html
<!-- STATE PANEL TOGGLE -->
<button id="state-panel-toggle" onclick="togglePanel()"
  title="State Panel"
  style="position:fixed; top:50%; right:0; transform:translateY(-50%);
         background:#1a1a2e; color:#e5e7eb; border:none;
         border-radius:8px 0 0 8px; padding:10px 14px;
         cursor:pointer; z-index:9999;
         font-size:12px; font-family:system-ui,sans-serif;
         font-weight:600; letter-spacing:0.04em;
         box-shadow:-2px 0 8px rgba(0,0,0,0.3)">
  ⚙ State
</button>

<!-- STATE PANEL -->
<div id="state-panel"
  style="display:none; position:fixed; top:0; right:0; width:280px; height:100vh;
         background:#1a1a2e; color:#e5e7eb; overflow-y:auto; z-index:9998;
         box-shadow:-4px 0 24px rgba(0,0,0,0.35); padding:16px 14px;
         font-family:system-ui,sans-serif; box-sizing:border-box;
         transition:transform 0.2s ease">

  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
    <span style="font-weight:600; font-size:13px; color:#f9fafb">⚙ State Panel</span>
    <button onclick="togglePanel()"
      style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:20px; line-height:1">×</button>
  </div>

  <!-- Scenarios -->
  <div style="margin-bottom:20px">
    <p style="font-size:10px; color:#6b7280; text-transform:uppercase;
              letter-spacing:.08em; margin-bottom:8px; font-weight:600">
      Scenarios — {ScreenName}
    </p>
    <div id="panel-scenarios" style="display:flex; flex-direction:column; gap:4px">
      <!-- Populated by renderPanel() -->
    </div>
  </div>

  <!-- Role override — omit on login.html and single-role prototypes -->
  <div style="margin-bottom:20px">
    <p style="font-size:10px; color:#6b7280; text-transform:uppercase;
              letter-spacing:.08em; margin-bottom:8px; font-weight:600">Role override</p>
    <div id="panel-roles" style="display:flex; flex-direction:row; flex-wrap:wrap; gap:4px">
      <!-- Populated by renderPanel() -->
    </div>
  </div>

</div>
```

---

## JS functions (embed in each screen's `<script>` block)

```js
var panelOpen = false

function togglePanel() {
  panelOpen = !panelOpen
  document.getElementById('state-panel').style.display = panelOpen ? 'block' : 'none'
}

function renderPanel() {
  /* Scenarios */
  var scenariosEl = document.getElementById('panel-scenarios')
  if (scenariosEl) {
    scenariosEl.innerHTML = SCENARIOS.map(function(sc) {
      var active = sc.key === S.scenario
      return '<button onclick="setScenario(\'' + sc.key + '\')" style="' +
        'padding:8px 11px; border-radius:6px; border:none; cursor:pointer;' +
        'font-size:12px; text-align:left; width:100%; line-height:1.4;' +
        (active
          ? 'background:rgba(255,255,255,0.15); color:#f9fafb; font-weight:600'
          : 'background:transparent; color:#9ca3af') +
        '">' + sc.label + '</button>'
    }).join('')
  }

  /* Role override — skip on login (no panel-roles element) */
  var rolesEl = document.getElementById('panel-roles')
  if (rolesEl) {
    rolesEl.innerHTML = Object.keys(ROLE_LABELS).map(function(r) {
      var active = r === S.role
      return '<button onclick="overrideRole(\'' + r + '\')" style="' +
        'padding:5px 9px; border-radius:5px; border:1px solid; cursor:pointer; font-size:11px;' +
        (active
          ? 'background:rgba(255,255,255,0.15); color:#f9fafb; border-color:rgba(255,255,255,0.2); font-weight:600'
          : 'background:transparent; color:#6b7280; border-color:rgba(255,255,255,0.08)') +
        '">' + ROLE_LABELS[r] + '</button>'
    }).join('')
  }
}

function setScenario(key) {
  var sc = SCREEN_DATA[key]
  if (!sc) return
  S.scenario = key
  S.role = sc.role
  localStorage.setItem('rp_role', sc.role)
  history.replaceState(null, '', '?scenario=' + key)
  renderPanel()
  renderScreen()
}

function overrideRole(role) {
  S.role = role
  localStorage.setItem('rp_role', role)
  renderPanel()
  renderScreen()
}

function switchRole(role) {
  /* Used by navigation links only — redirects to DEFAULT_PAGE[role] */
  localStorage.setItem('rp_role', role)
  S.role = role
  location.href = DEFAULT_PAGE[role] || 'login.html'
}
```

**SCENARIOS array format** — one entry per confirmed scenario from Step 6:

```js
const SCENARIOS = [
  { key: 'manager_active_day', label: 'Manager — Active day',  role: 'manager'  },
  { key: 'director_overview',  label: 'Director — Overview',   role: 'director' },
  { key: 'empty_state',        label: 'Empty state',           role: 'manager'  }
]
```

---

## Init sequence (each screen)

```js
/* Read current scenario from URL; fall back to first scenario in SCREEN_DATA */
const params = new URLSearchParams(location.search)
let S = {
  scenario: params.get('scenario') || Object.keys(SCREEN_DATA)[0],
  role: null
}
var _sc = SCREEN_DATA[S.scenario] || SCREEN_DATA[Object.keys(SCREEN_DATA)[0]]
S.role = localStorage.getItem('rp_role') || (_sc ? _sc.role : Object.keys(ROLE_LABELS)[0])

document.addEventListener('DOMContentLoaded', function() {
  renderPanel()
  renderScreen()
})
```

---

## login.html special case

No Role override section. Each scenario = logging in as a specific role. Clicking a scenario sets `S.role`, then login submit calls `switchRole(S.role)` to redirect.

```js
const SCREEN_DATA = {
  'login_as_manager':  { role: 'manager',  label: 'Login as Manager',  frs: [], data: {} },
  'login_as_director': { role: 'director', label: 'Login as Director', frs: [], data: {} },
  'login_error':       { role: 'manager',  label: 'Wrong credentials', frs: [], data: { error: 'Invalid email or password' } }
}
const SCENARIOS = [
  { key: 'login_as_manager',  label: 'Login as Manager',  role: 'manager'  },
  { key: 'login_as_director', label: 'Login as Director', role: 'director' },
  { key: 'login_error',       label: 'Wrong credentials', role: 'manager'  }
]
```

Login card: form fields + submit button only. Submit handler: any non-empty password OR Enter → `switchRole(S.role)`. No Role override section in panel.

---

## Active state styling

All buttons use inline styles only — no external class names. Active scenario button: `background:rgba(255,255,255,0.15)` + `font-weight:600`. Active role override button: same treatment with `border-color:rgba(255,255,255,0.2)`.

---

## Mobile layout override

On mobile (`platform_type = "mobile"`), change the toggle to a floating button at bottom-right:

```html
<button id="state-panel-toggle" onclick="togglePanel()"
  style="position:fixed; bottom:80px; right:16px;
         background:#1a1a2e; color:#e5e7eb; border:none;
         border-radius:50%; width:48px; height:48px;
         cursor:pointer; z-index:9999;
         font-size:18px; font-weight:700;
         display:flex; align-items:center; justify-content:center;
         box-shadow:0 4px 12px rgba(0,0,0,0.4)"
  title="State Panel">
  ⚙
</button>
```

Scenario buttons on mobile must have `min-height:44px`.
