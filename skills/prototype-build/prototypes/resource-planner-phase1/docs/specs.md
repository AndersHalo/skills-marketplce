# resource-planner-phase1 — Specs
Status: READY FOR DEV — 2026-06-21
Last updated: 2026-06-21   PRD: prd-v5.0-phase1.md   Stack: HTML + CSS + Vanilla JS   Platform: web   Mode: Full rebuild

## Screens
| Route | Screen | Sub-views | FRs implemented |
|---|---|---|---|
| login.html | Login | — | AUTH-1, AUTH-2, AUTH-3, AUTH-4 |
| resource-directory.html | Resource Directory | — | FR1.1, FR1.3, FR2.1, FR2.2, FR3.1, FR3.2, FR4.1, HR-1 |
| resource-profile.html | Resource Profile | — | FR1.2, FR1.3, FR4.1, DL-2 |
| project-composition.html | Projects | All Projects · Project Detail · Ending Soon | FR6.1–FR6.5, FR7.1–FR7.3, FR8.1, FR8.2, DL-1, DL-3 |
| timesheet-compliance.html | Timesheet Compliance | List View · Per-Person Detail | FR5.1, FR5.2, FR5.3, DL-4 |
| access-control.html | Access Control | — | ADMIN-1, ADMIN-2, ADMIN-3 |
| unauthorized.html | Unauthorized | — | RBAC-1, RBAC-2 |

## Data schema
```ts
interface Resource {
  id: string
  name: string
  role: string
  dept: string
  type: 'FTE' | 'Contractor' | 'Consultant'
  seniority: 'Junior' | 'Mid' | 'Senior' | 'Principal'
  email: string
  contractedHours: number
  allocationPct: number
  billablePct: number
  trueIdleHours: number
  idleCost: number
  bookingStatus: 'truly-idle' | 'partially-allocated' | 'fully-booked' | 'over-allocated'
  activeProjectCount: number
  hasConflict: boolean
}

interface Department {
  name: string
  headcount: number
  ftecapacity: number
  billablePct: number
  nonBillablePct: number
  trueIdlePct: number
  idleCost: number
}

interface OrgMetrics {
  totalHeadcount: number
  totalFteCapacity: number
  billableUtilizationRate: number
  billableUtilizationTarget: number
  nonBillableRate: number
  trueIdleRate: number
  idleTimeCost: number
  idleFteEquivalent: number
  overAllocatedCount: number
  prevBillableUtilizationRate: number
  prevTrueIdleRate: number
  prevIdleTimeCost: number
}

interface Project {
  id: string
  name: string
  client: string
  type: 'T&M' | 'Fixed Price'
  health: 'healthy' | 'at-risk' | 'critical'
  value: number
  spent: number
  pct: number
  start: string
  end: string
  daysLeft: number
  headcount: number
  pm: string
  phase: string
  risks: string[]
  team: ProjectTeamMember[]
  pastTeam: PastTeamMember[]
  pto: PtoEvent[]
  kpis: ProjectKpis
  burndownData: { month: string; planned: number; actual: number | null }[]
  scopeCreep: boolean
  budgetAlert: boolean
}

interface ProjectTeamMember {
  id: string
  name: string
  role: string
  alloc: number
}

interface PastTeamMember {
  name: string
  role: string
  period: string
  alloc: number
}

interface ProjectKpis {
  contractValue: number
  spent: number
  remaining: number
  billedHours: number
  plannedHours: number
  hourlyRate: number
  burnRate: number
  projectedFinal: number
  margin: number
}

interface Assignment {
  project: string
  client: string
  type: 'T&M' | 'Fixed Price'
  role: string
  alloc: number
  start: string
  end: string
  status: 'active' | 'on-hold'
}

interface Conflict {
  resource: string
  type: 'Double-booking' | 'Availability gap'
  desc: string
  severity: 'high' | 'med'
}

interface TimesheetEntry {
  week: string
  project: string
  hours: number
  expected: number
  status: 'approved' | 'submitted' | 'missing' | 'rejected'
  notes: string
}

interface PtoEvent {
  dates: string
  duration: string
  type: string
  impact?: string
}

interface UserRoleConfig {
  id: string
  name: string
  email: string
  initials: string
  status: 'active' | 'inactive'
  scope: string
  overrides: Record<string, boolean>
}

interface SyncStatus {
  source: 'Deel' | 'NetSuite'
  status: 'current' | 'stale' | 'error'
  lastSynced: string
}
```

## Roles & permissions
| Role | Can see | Cannot access |
|---|---|---|
| DELIVERY_LEAD | Projects (scoped to own), Timesheet, Resource Directory (scoped), locked nav items visible but blocked | Executive Dashboard, Revenue Pipeline, Access Control, other DLs' scoped data |
| HR | Resource Directory (full org), Projects (read), Resource Profile | Timesheet Compliance, Access Control, financial write operations |
| ADMIN | Access Control only (role assignment + feature toggles) | Resource Directory, Projects, Timesheet |

## States per screen
| Screen | States |
|---|---|
| Login | default (ready), loading, error (wrong-domain / not-in-system / no-role) |
| Resource Directory | populated (HR full / DL scoped), filtered-idle, filtered-over-allocated, empty |
| Resource Profile | healthy, truly-idle, over-allocated, partially-allocated, no-assignments |
| Projects | all-projects (table), project-detail (T&M / Fixed Price / with alerts), ending-soon |
| Timesheet Compliance | compliant, non-compliant, per-person-detail |
| Access Control | dl-tab-default, editing (override panel open), hr-tab |
| Unauthorized | dl-attempts-admin |

## Use cases
| ID | Screen | Role | State |
|---|---|---|---|
| login_as_dl | Login | DELIVERY_LEAD | default |
| login_as_hr | Login | HR | default |
| login_as_admin | Login | ADMIN | default |
| login_error | Login | DELIVERY_LEAD | error (3 error type toggles) |
| dir_hr_populated | Resource Directory | HR | populated, full org |
| dir_dl_scoped | Resource Directory | DELIVERY_LEAD | populated, scoped |
| dir_hr_filter_idle | Resource Directory | HR | filtered truly-idle |
| dir_hr_over_allocated | Resource Directory | HR | filtered over-allocated |
| dir_hr_empty | Resource Directory | HR | empty |
| profile_healthy | Resource Profile | HR | fully-booked (85%) |
| profile_truly_idle | Resource Profile | HR | truly-idle (25%) |
| profile_over_allocated | Resource Profile | DELIVERY_LEAD | over-allocated (115%) |
| profile_partial | Resource Profile | HR | partially-allocated (50%) |
| profile_no_assignments | Resource Profile | HR | no active assignments |
| proj_dl_portfolio | Projects | DELIVERY_LEAD | all-projects tab |
| proj_dl_detail_tm | Projects | DELIVERY_LEAD | project detail, T&M |
| proj_dl_detail_fp | Projects | DELIVERY_LEAD | project detail, Fixed Price |
| proj_dl_alerts | Projects | DELIVERY_LEAD | project detail + 2 alert banners |
| proj_dl_ending_soon | Projects | DELIVERY_LEAD | ending soon tab |
| proj_hr_all | Projects | HR | all-projects, org-wide |
| ts_compliant | Timesheet | DELIVERY_LEAD | all compliant |
| ts_non_compliant | Timesheet | DELIVERY_LEAD | missing + rejected entries |
| ts_person_detail | Timesheet | DELIVERY_LEAD | per-person detail (Leila Farooq) |
| ac_admin_dl_tab | Access Control | ADMIN | DL tab |
| ac_admin_editing | Access Control | ADMIN | DL tab, override panel open |
| ac_admin_hr_tab | Access Control | ADMIN | HR tab |
| unauth_dl_access_control | Unauthorized | DELIVERY_LEAD | DL attempts Admin-only page |

## User flows
1. Delivery Lead — daily check-in: login.html → project-composition.html → (click project) → project-composition.html?tab=detail → timesheet-compliance.html
2. HR — resource review: login.html → resource-directory.html → (click name) → resource-profile.html → resource-directory.html
3. Admin — role management: login.html → access-control.html → (select user) → (toggle permissions) → (save)
4. DL — idle resource flag: resource-directory.html → (filter: Truly Idle) → resource-profile.html
5. DL — conflict resolution: resource-directory.html → (conflict flag) → resource-profile.html → project-composition.html

## Dependencies
CDN only — no package.json. Libraries loaded in each screen file:
- Google Fonts: Inter + Playfair Display (all screens)
- Chart.js 4.4.0 (resource-directory.html, project-composition.html)
