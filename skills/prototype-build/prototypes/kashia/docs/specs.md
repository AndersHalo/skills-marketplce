# Kashia Prototype — Specs

## Screens

| Screen | File | Scenarios | Role(s) | Key FRs |
|---|---|---|---|---|
| Login | login.html | login_default, login_error | owner | FR42 |
| Dashboard | dashboard.html | dashboard_loaded, dashboard_empty | owner | FR36 |
| New Payment | new-payment.html | np_default, np_backdated, np_advanced, np_duplicate, np_save_add | owner | FR1–FR14, FR37 |
| Ledger | ledger.html | ledger_all, ledger_backdated, ledger_advanced, ledger_settled, ledger_search, ledger_empty | owner | FR15–FR35 |
| Reports | reports.html | reports_daily, reports_weekly, reports_monthly | owner | FR36–FR41 |
| Management | management.html | management_clients, management_clients_empty, management_activities, management_activities_empty | owner | FR51–FR62 |
| Client Profile | client-profile.html | client_profile_history, client_profile_new | owner | FR51, FR54, FR58 |
| Settings | settings.html | settings_bt_disconnected, settings_bt_connected | owner | FR63–FR66 |

---

## Entities

| Entity | Fields |
|---|---|
| Payment | id, clientName, folio, concept, amount, serviceDate, entryDate, week, status (backdated/advanced/settled/current), isSynced |
| Client | id, folio, name, phone, memberSince, initials, colorHex, isDefault (Walk-in), deleted_at |
| Activity | id, name, emoji, participants, price, bgColor |
| Settings | sync.online, sync.pendingCount, printer.connected, printer.name, printer.paperWidth, printer.autoCut |

---

## Roles

| Role ID | Display Label | Entry Point | Nav |
|---|---|---|---|
| owner | Instructor | login.html | All 5 tabs |

---

## Status Badge System

| Status | Condition | Badge Color |
|---|---|---|
| BACKDATED | serviceDate < entryDate | Amber (#FFF5E7 / #A86F08) |
| ADVANCED | serviceDate > entryDate | Indigo (#EEF2FF / #4C1D95) |
| SETTLED | serviceDate in closed period but entryDate outside | Slate (#E8EAEB / #626976) |
| (none) | serviceDate = entryDate | No badge |

---

## Scenarios by Screen

### login.html
| Key | Description |
|---|---|
| login_default | Empty form ready |
| login_error | Wrong password shown |

### dashboard.html
| Key | Description |
|---|---|
| dashboard_loaded | $12,400 total, 4 recent payments |
| dashboard_empty | New user, $0 total |

### new-payment.html
| Key | Description |
|---|---|
| np_default | Clean form, today's date |
| np_backdated | Past date selected → amber banner |
| np_advanced | Future date selected → indigo banner |
| np_duplicate | Duplicate warning shown |
| np_save_add | Save + Add Another flow |

### ledger.html
| Key | Description |
|---|---|
| ledger_all | All 12 payments, weekly groups |
| ledger_backdated | Filter: BACKDATED only |
| ledger_advanced | Filter: ADVANCED only |
| ledger_settled | Filter: SETTLED only |
| ledger_search | Search mode active |
| ledger_empty | No payments, empty state |

### reports.html
| Key | Description |
|---|---|
| reports_daily | 7-day chart, $3,650 |
| reports_weekly | 4-week chart, $5,650 |
| reports_monthly | 6-month chart, $12,400 |

### management.html
| Key | Description |
|---|---|
| management_clients | 6 clients including Walk-in |
| management_clients_empty | Only Walk-in (default) |
| management_activities | 3 activities |
| management_activities_empty | No activities |

### client-profile.html
| Key | Description |
|---|---|
| client_profile_history | Ana García, $2,450 lifetime, 3 payments |
| client_profile_new | Roberto Torres, no history |

### settings.html
| Key | Description |
|---|---|
| settings_bt_disconnected | Offline, 3 pending, no printer |
| settings_bt_connected | Online, KP-88B connected, 58mm, auto-cut on |

---

## Use Cases Covered

| Use Case | Screen | Scenario |
|---|---|---|
| Instructor logs in | login.html | login_default |
| Wrong password error | login.html | login_error |
| View monthly total | dashboard.html | dashboard_loaded |
| Empty first-time view | dashboard.html | dashboard_empty |
| Record same-day payment | new-payment.html | np_default |
| Record backdated payment | new-payment.html | np_backdated |
| Record advance payment | new-payment.html | np_advanced |
| Duplicate entry warning | new-payment.html | np_duplicate |
| Save + add another | new-payment.html | np_save_add |
| Browse all payments | ledger.html | ledger_all |
| Filter by status | ledger.html | ledger_backdated, ledger_advanced, ledger_settled |
| Search by name/folio | ledger.html | ledger_search |
| View payment detail | ledger.html | (any — tap row → bottom sheet) |
| View revenue charts | reports.html | reports_daily/weekly/monthly |
| Switch chart period | reports.html | all 3 scenarios |
| Browse client list | management.html | management_clients |
| Add new client | management.html | (+ Add button → sheet) |
| View client profile | client-profile.html | client_profile_history |
| Edit client info | client-profile.html | (Edit button → sheet) |
| Delete client | client-profile.html | (Delete button → modal) |
| Check sync status | settings.html | settings_bt_disconnected |
| Connect BT printer | settings.html | settings_bt_disconnected |
| Configure printer | settings.html | settings_bt_connected |
