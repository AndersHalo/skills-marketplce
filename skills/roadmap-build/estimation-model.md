# AI-Agent Estimation Model

## Full Agentic Pipeline

This model assumes a **fully agentic development workflow**. Every phase of the delivery pipeline — from planning through code review — is driven by AI agents:

```
PRD (agent) → Architecture (agent) → UX Design (agent)
     → Create Story (agent) → Dev Story (agent) → Code Review (human) → merge
```

The only non-agentic step is **human code review and approval**. Everything else is generated, implemented, and validated by agents. This is the basis for the compressed calendar estimates throughout this model.

If planning artifacts (PRD, Architecture, UX) have not yet been generated, estimate **1–3 additional calendar days** per artifact using the corresponding BMAD skills before the first story cycle begins.

---

## Unit: Story Cycles

**1 story cycle = 1 complete BMad story loop:**
Create Story (agent) → Dev Story (agent) → Code Review (human) → merge

This is the standard unit for all estimates in this model. Do not use hours, days, or sprints.

---

## Why This Differs From Traditional Estimation

| Factor | Traditional dev | Full agentic dev |
|---|---|---|
| Boilerplate (DTOs, components, hooks) | Slow — written manually | Fast — agents generate in one pass |
| Story/ticket writing | Hours of PM/dev time | Minutes — Create Story agent drafts from PRD |
| Ramp-up on unfamiliar code | Days to onboard | None — agents read codebase fresh each session |
| Context switching between tasks | Costly — developer loses flow | Free — spin up parallel agents per initiative |
| PRD / Architecture / UX planning | Weeks of human iteration | 1–3 days per artifact using BMAD skills |
| External API integration (unknown shape) | Moderate uncertainty | Same uncertainty remains — API docs still needed |
| Auth / security changes | Normal risk | Higher review burden — add cycles for careful CR |
| Database schema migrations | Normal care | Same care required — schema changes are risky regardless |
| Bug investigation | Slow (manual tracing) | Faster with Investigate skill, but still uncertain |
| Activating a deferred/feature-flagged item | Normal build time | Trivial — code already exists, just ungated |

---

## Complexity Tiers

| Tier | Story Cycles | When to apply |
|---|---|---|
| **Trivial** | 1 | Activate a deferred feature flag, rename, copy content, add a column to existing UI with existing data |
| **Simple** | 1–2 | New UI component using existing data, add a filter, new calculated field using existing sources |
| **Medium** | 3–5 | New backend endpoint + frontend hook + UI, new calculation engine using existing data sources |
| **Complex** | 6–10 | New external API integration, new auth flow, new engine requiring schema change |
| **Epic** | 10+ | Multi-module feature: new integration + new engine + multiple new UI surfaces + schema migration |

---

## Adjustment Rules

Apply these modifiers on top of the base tier:

- **+2 cycles** if the initiative touches authentication or security (review overhead)
- **+1 cycle** if the initiative requires a database schema migration
- **+1 cycle** if the external API shape is unknown or not yet validated
- **−1 cycle** if the PRD has a complete preserved spec for this feature (already designed, just not built)
- **−1 cycle** if the initiative follows a pattern already established in the codebase (e.g., third integration following existing integration pattern)
- **Confidence → Low** if the initiative has no PRD reference or has unresolved external dependencies

---

## Confidence Levels

- **High** — requirements well-defined, pattern exists in codebase, no external unknowns
- **Medium** — requirements clear but some technical uncertainty (e.g., external API not yet validated)
- **Low** — requirements vague, dependencies not confirmed, or external access not yet available

---

## Team Adjustment Rules

These modifiers apply when a team profile is loaded in Step 3. They stack on top of the complexity tier and standard adjustment rules. If no team profile is provided, use the agentic baseline and skip this section.

---

### Headcount capacity (apply before all other team adjustments)

These rules derive **effective parallel capacity** and **effective reviewer hours** from actual team size. Apply them first — they constrain values used by all subsequent rules.

**Step 1 — Count unique people and role assignments**

From the team-governance file, compute:
- `unique_people` = count of distinct names in the Team Members table
- `total_role_assignments` = count of rows in the Team Members table (one row per person per role; a person with two roles appears twice)
- `roles_per_person = total_role_assignments / unique_people`

**Step 2 — Cap parallel contexts by headcount**

`effective_parallel_contexts = min(configured_parallel_contexts, unique_people)`

Rationale: agents can generate code for multiple streams, but every stream needs a human to review and unblock it. You cannot run more effective parallel tracks than you have people.

| unique_people | Effect on parallel_contexts |
|---|---|
| 1 | Cap at 1 — all initiatives are sequential |
| 2 | Cap at 2 |
| 3+ | Cap at configured value |

**Step 3 — Reduce reviewer hours for multi-hat people**

When a person marked as Reviewer also holds non-engineering roles (PO, PM, BA, QA, Scrum Master, etc.), their stated hours are split across responsibilities. Apply to their effective `reviewer_hours_per_day`:

| Condition | reviewer_hours_per_day multiplier |
|---|---|
| Reviewer holds 1 role only | × 1.0 (no change) |
| Reviewer holds 2 roles | × 0.7 |
| Reviewer holds 3+ roles | × 0.5 |

Use the adjusted `reviewer_hours_per_day` in the `cycle_days` formula below.

**Step 4 — Apply multi-hat calendar penalty**

| roles_per_person | Cycle days penalty |
|---|---|
| ≤ 1.5 | No penalty |
| 1.5–2.5 | +0.5 cycle_days (round up) on all initiatives |
| > 2.5 | +1 cycle_days on all initiatives |

This represents context-switching overhead when the same person must context-switch between multiple hats across concurrent work.

---

### Reviewer count and availability

| Reviewers | Effect on parallel calendar time |
|---|---|
| 1 (baseline) | No change |
| 2 | −30% on parallel-optimized calendar total |
| 3+ | −50% on parallel-optimized calendar total |

Recalculate `cycle_days` from the **adjusted** `reviewer_hours_per_day` (after the multi-hat reduction above):

| Hours/day | Cycle duration |
|---|---|
| ≤ 2h | 1 cycle ≈ 2–3 calendar days |
| 3–5h (baseline ~4h) | 1 cycle ≈ 1–2 calendar days |
| 6h+ | 1 cycle ≈ 1 calendar day |

Formula: `cycle_days = max(1, round(6 / reviewer_hours_per_day))`

---

### Engineering roles

**Tech Lead (any count > 0)**
- **−1 cycle** for Complex and Epic initiatives (faster technical decisions, less back-and-forth)
- Confidence upgrade 1 level for initiatives flagged as technically uncertain

**Solution Architect (any count > 0)**
- **−1 cycle** for initiatives requiring new or significant architecture decisions
- Confidence Low → Medium for architecture-heavy initiatives

**Senior Developer** — baseline; no modifier

**Mid-level Developer (any count > 0, no Senior Developer present)**
- **+1 cycle** for Epic initiatives only (primary dev capacity is mid-level)

**Junior Developer (any count > 0)**
- **+1 cycle** for Complex and Epic initiatives (higher CR overhead and iteration expected)

**DevOps / Platform Engineer (any count > 0)**
- **−1 cycle** for any initiative that includes infrastructure changes, deployment pipeline work, or CI/CD setup
- **−0.5 cycle_days** (rounds down) applied to all initiatives: merge and deploy step is faster

**SRE / Cloud Engineer (any count > 0)**
- **−1 cycle** for cloud-infrastructure-heavy or reliability-sensitive initiatives
- Confidence upgrade 1 level for initiatives involving scalability or uptime requirements

**Security Engineer (any count > 0)**
- Reduces the auth/security modifier from **+2 cycles → +1 cycle** for initiatives touching authentication, authorization, or compliance
- Confidence upgrade 1 level for security-sensitive initiatives

**Data Engineer (any count > 0)**
- **−1 cycle** for initiatives involving data pipelines, ETL, data modeling, or analytics backend
- Confidence upgrade 1 level for data-heavy initiatives

---

### Quality roles

**QA Engineer — Manual (any count > 0)**
- **+1 cycle** per Complex or Epic initiative (QA validation pass required)
- QA cycle is parallelizable with next story generation — does not extend critical path unless it gates a dependency

**QA Automation Engineer (any count > 0)**
- **+1 cycle** per Complex or Epic initiative
- If both Manual QA and QA Automation are present: add **+0.5 net cycle** instead of stacking two full cycles
- Automation cycles are parallelizable

**Performance / Load Tester (any count > 0)**
- **+1 cycle** for any initiative involving API endpoints under load, data volume processing, or real-time operations

---

### Product & Design roles

**Product Owner — PO (any count > 0)**
- **−1 cycle** for all initiatives (acceptance criteria are defined before dev starts, reducing iteration)
- Confidence upgrade 1 level for all initiatives

**Product Manager — PM (any count > 0)**
- Confidence upgrade 1 level for all initiatives
- **−1 additional cycle** if the PRD being analyzed was authored or formally reviewed by the PM

**Business Analyst — BA (any count > 0)**
- **−1 cycle** for Complex and Epic initiatives (stories are complete and refined before dev)
- Confidence upgrade 1 level for requirements-heavy or process-intensive initiatives

**UX Designer (any count > 0)**
- **−1 cycle** for frontend-heavy initiatives (Simple and above) if UX docs are provided
- Confidence upgrade 1 level for UI-intensive initiatives

**UI Designer (any count > 0)**
- **−0.5 cycle** (round down to nearest whole number) for frontend initiatives where design system or mockups are provided

**Data Analyst / BI (any count > 0)**
- Confidence upgrade 1 level for reporting, dashboard, or analytics-facing initiatives
- No direct cycle modifier

**Technical Writer (any count > 0)**
- **−1 cycle** for initiatives where documentation is part of the definition of done

---

### Facilitation roles

**Scrum Master (any count > 0)**
- **−1 calendar day** from `cycle_days` for all initiatives (faster impediment removal and coordination)
- Confidence upgrade 1 level for initiatives currently flagged At Risk

**Agile Coach (any count > 0)**
- Same effect as Scrum Master; if both Scrum Master and Agile Coach are present, apply the modifier only once

**Engineering Manager (any count > 0)**
- **−1 calendar day** from `cycle_days` for all initiatives (faster escalations and priority decisions)
- If both Scrum Master and Engineering Manager are present, apply **−1 calendar day** total (not −2)

---

### Parallel agent contexts

| Contexts | Effect |
|---|---|
| 1 | All "parallelizable" initiatives become sequential — no parallel throughput |
| 2 (baseline) | Up to 2 initiative threads run simultaneously |
| 3+ | Up to n threads run simultaneously; reduces critical-path calendar time proportionally |

---

### Calendar blockers from Notes field

Parse the Notes / constraints field for explicit calendar blockers (e.g., "2-week freeze", "vacation in June", "compliance audit"). When found, add the stated calendar delay to the affected initiatives and flag them in the Effort Summary.

---

### Stacking and caps

- All role modifiers stack on top of complexity tier and standard adjustment rules.
- **Confidence cap:** Multiple confidence upgrades cap at **High** — no upgrade past High regardless of how many roles provide it.
- **Cycle floor:** Cycles cannot go below the complexity tier minimum (Trivial = 1, Simple = 1). A −2 cycle reduction on a Simple initiative yields 1 cycle, not −1.
- **calendar_day_reduction cap:** Multiple calendar day reductions (Scrum Master, Engineering Manager, DevOps) cap at −2 calendar days total from `cycle_days`. Minimum `cycle_days` = 1.
- PO and PM modifiers are independent and both apply when both roles are present.
- QA Manual and QA Automation do not fully stack — use the +0.5 net rule when both are present.

---

## Parallelism

Initiatives with no dependency on each other can run in parallel (separate agent contexts simultaneously). This compresses wall-clock time but does not reduce total story cycles.

Flag an initiative as **parallelizable** if it has no stated or implied dependency on another initiative in the same horizon or theme.

---

## Calendar Time Conversion (Agentic Mode)

In full agentic development, a story cycle is **not** a sprint or a week of human work. The wall-clock time per cycle is dominated by async human review, not implementation speed.

**1 story cycle ≈ 1–2 calendar days** in agentic mode:
- Agent session to generate story doc: ~30 min
- Agent session to implement story: ~1–4 hours
- Human review + feedback loop: ~2–6 hours
- Merge and deploy: ~30 min

Use the following table to convert **parallel-optimized cycle counts** to calendar time bands when labeling roadmap horizons or themes:

| Parallel cycles on critical path | Calendar time (agentic) |
|---|---|
| 1–5 cycles | 1–2 weeks |
| 6–10 cycles | 2–3 weeks |
| 11–15 cycles | 3–5 weeks |
| 16–20 cycles | 4–6 weeks |
| 21–30 cycles | 6–10 weeks |
| 30+ cycles | 2–4 months |

**Implication for roadmap formats:** Horizons, themes, and objective timeframes MUST be expressed in weeks or short months — not traditional quarters. A roadmap with 29 parallel-optimized cycles completes in **~8–10 weeks total**, not 9 months.

Do NOT use quarter labels (Q3, Q4, Q1) or month ranges exceeding 6 weeks for agentic roadmaps unless there is a confirmed external dependency (waiting for a third-party API, a legal review, a compliance audit) that creates calendar delay beyond the story cycle count.

---

## Estimation Consistency Rule

Estimates are computed **once** in Step 7 and stored in the shared estimate table. All format templates read from that table — never re-derive. If multiple formats are generated in the same run, every format MUST show identical story cycle counts, week ranges, and Effort Summary totals. Divergence between formats is always a bug.

---

## Totals Block (all formats)

At the bottom of every generated roadmap, add a `## Effort Summary` section:

```markdown
## Effort Summary

| Group | Story Cycles | Parallelizable |
|---|---|---|
| {horizon / theme / objective} | {n} | {n} |
| **Total** | **{n}** | **{n}** |

Sequential total: {n} story cycles  
Parallel-optimized total: {n} story cycles (~{n} calendar weeks)  
Critical path: {initiative A} → {initiative B} → {initiative C} ({n} cycles / ~{n} weeks minimum)

### Team Context

| Factor | Value | Impact |
|---|---|---|
| Reviewers | {n} | {e.g., "no CR bottleneck on parallel tracks" or "baseline — 1 reviewer serializes CRs"} |
| Reviewer availability | {n}h/day | {e.g., "1 cycle ≈ 1–2 days" or "1 cycle ≈ 2–3 days"} |
| Parallel agent contexts | {n} | {e.g., "up to 3 initiatives run simultaneously"} |
| QA | {present / absent} | {e.g., "+1 cycle on Complex/Epic initiatives"} |
| PM | {present / absent} | {e.g., "confidence upgraded; −1 cycle on PM-reviewed PRDs"} |
| UX / Designer | {present / absent} | {e.g., "−1 cycle on frontend-heavy initiatives"} |
| Junior developers | {n} | {e.g., "+1 cycle on Complex/Epic for CR overhead" or "n/a"} |
| Calendar blockers | {none / description} | {e.g., "2-week freeze adds +14 calendar days to affected initiatives"} |

> Pipeline: Create Story (agent) → Dev Story (agent) → Code Review (human) → merge.  
> 1 story cycle ≈ {cycle_days} calendar day(s) with current team configuration.  
> Parallelizable initiatives run simultaneously in separate agent contexts.
```

If no team profile was provided, omit the Team Context table and use the standard agentic baseline note:

```markdown
> Full agentic baseline: 1 reviewer, 4h/day, 2 parallel contexts.  
> 1 story cycle ≈ 1–2 calendar days. Parallelizable initiatives run simultaneously.
```

