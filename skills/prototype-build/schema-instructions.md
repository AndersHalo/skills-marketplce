# schema-instructions

Rules for deriving a UI-adapted data schema from a PRD. Used by prototype-build in Step 6.

## Rules

1. **UI-first, not API-first.** Define entities based on what the UI renders, not on what a backend would persist. Fields that are never displayed or acted upon do not belong in the schema.

2. **One entity per distinct display unit.** If the UI shows a list of projects and a list of members separately, those are two entities — even if they might share a database table in production.

3. **Derive fields from screens, not assumptions.** Every field in an entity must appear somewhere in the UI — in a table column, a card, a form, a detail view, or a status badge.

4. **Include state fields.** Add `status`, `state`, or equivalent fields whenever the PRD describes different visual states for a record (e.g. active/inactive, pending/approved/rejected).

5. **Include role fields when roles exist.** If the PRD describes multiple user roles, add a `role` field to the user entity and use it to drive which navigation items and data are shown.

6. **Keep relationships flat for prototyping.** Instead of nested objects, use IDs for references (e.g. `projectId: string`) and provide a separate flat lookup entity. This keeps mocked data simple and avoids deep nesting in render functions.

7. **Use TypeScript types.** All entities are expressed as TypeScript interfaces. Use `string`, `number`, `boolean`, and union types (`'active' | 'inactive'`) — no `any`.

8. **Limit to what's visible.** If a field is only used for internal logic (e.g. a key that never appears in the UI), omit it.

## Examples

### Example: Project management app

PRD describes a list of projects with status badges, an owner name, and a deadline.

```ts
interface Project {
  id: string
  name: string
  status: 'active' | 'on-hold' | 'completed' | 'archived'
  ownerName: string
  deadline: string       // ISO date string
  progress: number       // 0–100
}
```

### Example: Multi-role app

PRD describes admins managing users, viewers only seeing reports.

```ts
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'viewer'
  status: 'active' | 'invited' | 'suspended'
  joinedAt: string       // ISO date string
}
```

### Example: E-commerce dashboard

PRD describes orders with multiple states and a product detail view.

```ts
interface Order {
  id: string
  customerName: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: number          // count only — item detail is a separate entity
  createdAt: string
}

interface OrderItem {
  id: string
  orderId: string
  productName: string
  quantity: number
  unitPrice: number
}
```

---

## Use case coverage check (Step 6b)

After the user confirms the schema in Step 6, run a coverage check before proceeding to Step 7. This ensures the schema can represent every state and role discovered in Step 4.

### What to check

For each entity in the confirmed schema:

1. **State coverage** — for every `status`/`state` union type value declared in the schema, verify that at least one screen in Step 4 displays records in that state. If a state exists in the union but no screen ever shows it, flag it.

2. **Role coverage** — for every role confirmed in Step 4, verify that the schema has at least one entity whose data changes based on that role (different records visible, different fields shown, or different actions available).

3. **Screen coverage** — for every screen in Step 4 that has domain-specific states (beyond loading/empty/error), verify that the schema entity used by that screen has a field that can represent those states.

### How to present

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Schema coverage check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entity        States covered                    Gaps
────────────────────────────────────────────────────
Project       active ✓  on-hold ✓               archived ✗
User          active ✓  invited ✓               suspended ✗
Role access   admin ✓   viewer ✓                manager ✗

Gaps: {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask:
> Fix gaps or mark as out-of-scope?
> Type `fix {Entity} {value}` to add a missing value, or `skip` to mark all gaps as out-of-scope.

- **`fix {Entity} {value}`** → add the value to the entity's union type. Re-run the check until no gaps remain.
- **`skip`** → store gaps as `coverage_gaps[]` (informational only). Proceed to Step 7.
- **No gaps** → display `✓ Schema coverage: 100%` and proceed silently.
