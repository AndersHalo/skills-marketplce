# interactive-components

Complete, working JS implementation patterns for all common UI components. Used by prototype-build in Step 7 — each pattern's HTML and JS handlers are used verbatim inside `renderScreen()`.

All patterns operate on already-loaded data from `getData()`. No pattern calls `setState()` or `switchRole()`. Local state (active tab, current page, sort direction) is scoped inside `renderScreen()` via `var`.

---

## Platform rules (apply to every generated file)

**Mobile — mandatory on all interactive elements:**
- `min-height: 44px; min-width: 44px` on buttons and tappable rows (WCAG 2.5.5 / iOS HIG)
- `touch-action: manipulation` — removes 300ms tap delay without requiring `fastclick`
- `-webkit-tap-highlight-color: transparent` — prevents grey flash on tap
- `font-size: 16px` minimum on all `<input>`, `<select>`, `<textarea>` — prevents iOS Safari auto-zoom
- Cards instead of `<table>` — stacked rows scale better; see [Responsive table](#responsive-table--mobile-card-list)
- Bottom sheet instead of right-side drawer — see [Bottom sheet](#bottom-sheet-mobile)
- Load More instead of prev/next pagination — see [Load more (mobile)](#load-more-mobile)

**Web — standard interactive rules:**
- 32px minimum height on buttons is acceptable; 36–40px preferred
- Hover states via `:hover` in inline styles only when inline style is toggled on `mouseenter`/`mouseleave`
- Right-side drawer is standard; tables with horizontal scroll are acceptable

> When `platform_type = "mobile"`, use the Mobile variant of any component listed below. When `platform_type = "web"`, use the Web variant (or the default if no Mobile variant is defined).

---

## Sortable / filterable table (web)

**Component type key:** `sortable-table`

```js
function renderScreen() {
  var data = getData()
  var rows = data.items || []
  var sortKey = 'name'
  var sortDir = 1       // 1 = asc, -1 = desc
  var filterText = ''

  function getSorted() {
    var filtered = rows.filter(function(r) {
      return !filterText || JSON.stringify(r).toLowerCase().includes(filterText.toLowerCase())
    })
    return filtered.slice().sort(function(a, b) {
      var av = String(a[sortKey] || '')
      var bv = String(b[sortKey] || '')
      return av.localeCompare(bv) * sortDir
    })
  }

  function render() {
    var sorted = getSorted()
    var headers = rows.length ? Object.keys(rows[0]) : []
    var ths = headers.map(function(k) {
      var arrow = k === sortKey ? (sortDir === 1 ? ' ↑' : ' ↓') : ''
      return '<th onclick="sortBy(\'' + k + '\')" style="padding:8px 12px;font-size:11px;font-weight:600;' +
        'text-transform:uppercase;letter-spacing:.06em;color:#6b7280;cursor:pointer;' +
        'white-space:nowrap;border-bottom:2px solid #e5e7eb;user-select:none">' + k + arrow + '</th>'
    }).join('')
    var tableRows = sorted.map(function(r) {
      return '<tr>' + Object.keys(r).map(function(k) {
        return '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">' + (r[k] != null ? r[k] : '—') + '</td>'
      }).join('') + '</tr>'
    }).join('')

    document.getElementById('screen-content').innerHTML =
      '<div style="margin-bottom:12px">' +
        '<input id="tbl-search" placeholder="Search…" value="' + filterText + '" ' +
          'oninput="filterTable(this.value)" ' +
          'style="padding:7px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;width:240px">' +
      '</div>' +
      '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead><tr>' + ths + '</tr></thead>' +
          '<tbody>' + (tableRows || '<tr><td colspan="' + headers.length + '" style="padding:24px;text-align:center;color:#9ca3af">No records</td></tr>') + '</tbody>' +
        '</table>' +
      '</div>'
  }

  window.sortBy = function(key) {
    if (sortKey === key) sortDir = -sortDir
    else { sortKey = key; sortDir = 1 }
    render()
  }
  window.filterTable = function(val) {
    filterText = val
    render()
  }

  render()
}
```

---

## Responsive table / mobile card list (mobile)

**Component type key:** `sortable-table` *(use this variant when `platform_type = "mobile"`)*

Renders each row as a labeled card. No horizontal scroll, full touch targets.

```js
function renderScreen() {
  var data = getData()
  var rows = data.items || []
  var sortKey = null
  var sortDir = 1
  var filterText = ''

  function getKeys() { return rows.length ? Object.keys(rows[0]) : [] }

  function getSorted() {
    var filtered = rows.filter(function(r) {
      return !filterText || JSON.stringify(r).toLowerCase().includes(filterText.toLowerCase())
    })
    if (!sortKey) return filtered
    return filtered.slice().sort(function(a, b) {
      return String(a[sortKey] || '').localeCompare(String(b[sortKey] || '')) * sortDir
    })
  }

  function render() {
    var sorted = getSorted()
    var keys = getKeys()

    var sortButtons = keys.map(function(k) {
      var active = k === sortKey
      var arrow = active ? (sortDir === 1 ? ' ↑' : ' ↓') : ''
      return '<button onclick="mobileSortBy(\'' + k + '\')" style="' +
        'padding:6px 12px;border-radius:20px;border:1px solid;font-size:12px;cursor:pointer;' +
        'min-height:36px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;' +
        (active
          ? 'background:#3b1f4a;color:#fff;border-color:#3b1f4a'
          : 'background:#fff;color:#6b7280;border-color:#e5e7eb') +
        '">' + k + arrow + '</button>'
    }).join('')

    var cards = sorted.map(function(r) {
      var fields = keys.map(function(k) {
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">' +
          '<span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">' + k + '</span>' +
          '<span style="font-size:13px;color:#111;text-align:right;max-width:60%">' + (r[k] != null ? r[k] : '—') + '</span>' +
        '</div>'
      }).join('')
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;margin-bottom:10px">' +
        fields +
      '</div>'
    }).join('') || '<div style="padding:32px 16px;text-align:center;color:#9ca3af;font-size:14px">No records</div>'

    document.getElementById('screen-content').innerHTML =
      '<input id="mobile-search" placeholder="Search…" value="' + filterText + '" ' +
        'oninput="mobileFilter(this.value)" ' +
        'style="width:100%;padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;' +
        'font-size:16px;box-sizing:border-box;margin-bottom:12px">' +
      '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;' +
        '-webkit-overflow-scrolling:touch">' + sortButtons + '</div>' +
      cards
  }

  window.mobileSortBy = function(key) {
    if (sortKey === key) sortDir = -sortDir
    else { sortKey = key; sortDir = 1 }
    render()
  }
  window.mobileFilter = function(val) {
    filterText = val
    render()
  }

  render()
}
```

---

## Filter pills

**Component type key:** `filter-pills`

```js
function renderScreen() {
  var data = getData()
  var items = data.items || []
  var activeFilter = 'all'
  var isMobile = false /* set true when platform_type = "mobile" */

  var filterDefs = [{ key: 'all', label: 'All' }].concat(
    Array.from(new Set(items.map(function(i) { return i.status }))).filter(Boolean).map(function(s) {
      return { key: s, label: s.charAt(0).toUpperCase() + s.slice(1) }
    })
  )

  function getFiltered() {
    if (activeFilter === 'all') return items
    return items.filter(function(i) { return i.status === activeFilter })
  }

  function render() {
    var pillHeight = isMobile ? 'min-height:44px;padding:0 16px' : 'padding:5px 14px'
    var pills = filterDefs.map(function(f) {
      var active = f.key === activeFilter
      return '<button onclick="setFilter(\'' + f.key + '\')" style="' +
        pillHeight + ';border-radius:20px;border:1px solid;font-size:13px;cursor:pointer;' +
        'touch-action:manipulation;-webkit-tap-highlight-color:transparent;display:inline-flex;align-items:center;' +
        (active
          ? 'background:#3b1f4a;color:#fff;border-color:#3b1f4a'
          : 'background:#fff;color:#6b7280;border-color:#e5e7eb') +
        '">' + f.label + '</button>'
    }).join('')

    var list = getFiltered().map(function(i) {
      return '<div style="padding:12px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;font-size:13px">' +
        Object.entries(i).map(function(e) {
          return '<span style="margin-right:12px"><span style="color:#9ca3af">' + e[0] + ':</span> ' + e[1] + '</span>'
        }).join('') +
      '</div>'
    }).join('') || '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:24px 0">No items</p>'

    document.getElementById('screen-content').innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">' + pills + '</div>' +
      '<div>' + list + '</div>'
  }

  window.setFilter = function(key) {
    activeFilter = key
    render()
  }

  render()
}
```

---

## Tabs

**Component type key:** `tabs`

```js
function renderScreen() {
  var data = getData()
  var tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'details',  label: 'Details' },
    { key: 'history',  label: 'History' }
  ]
  var activeTab = tabs[0].key

  function renderTabContent() {
    var d = data[activeTab] || data
    return '<div style="padding:16px 0;font-size:13px;color:#374151">' +
      (typeof d === 'object'
        ? '<pre style="white-space:pre-wrap;overflow-x:auto">' + JSON.stringify(d, null, 2) + '</pre>'
        : String(d)) +
    '</div>'
  }

  function render() {
    var tabBar = tabs.map(function(t) {
      var active = t.key === activeTab
      return '<button onclick="switchTab(\'' + t.key + '\')" style="' +
        'padding:9px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:500;' +
        'min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;' +
        'border-bottom:2px solid ' + (active ? '#3b1f4a' : 'transparent') + ';' +
        'color:' + (active ? '#3b1f4a' : '#6b7280') + '">' + t.label + '</button>'
    }).join('')

    document.getElementById('screen-content').innerHTML =
      '<div style="border-bottom:1px solid #e5e7eb;display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch">' + tabBar + '</div>' +
      renderTabContent()
  }

  window.switchTab = function(key) {
    activeTab = key
    render()
  }

  render()
}
```

---

## Pagination (web)

**Component type key:** `pagination`

```js
function renderScreen() {
  var data = getData()
  var allItems = data.items || []
  var pageSize = 10
  var currentPage = 1

  function getTotalPages() { return Math.max(1, Math.ceil(allItems.length / pageSize)) }
  function getPage() { return allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize) }

  function render() {
    var pageItems = getPage()
    var totalPages = getTotalPages()
    var headers = allItems.length ? Object.keys(allItems[0]) : []

    var ths = headers.map(function(k) {
      return '<th style="padding:8px 12px;font-size:11px;font-weight:600;text-transform:uppercase;' +
        'letter-spacing:.06em;color:#6b7280;border-bottom:2px solid #e5e7eb;text-align:left">' + k + '</th>'
    }).join('')

    var trs = pageItems.map(function(item) {
      return '<tr>' + headers.map(function(k) {
        return '<td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6">' + (item[k] != null ? item[k] : '—') + '</td>'
      }).join('') + '</tr>'
    }).join('') || '<tr><td colspan="99" style="padding:24px;text-align:center;color:#9ca3af">No items</td></tr>'

    var prevBtn = '<button onclick="goPage(' + (currentPage - 1) + ')" ' +
      (currentPage <= 1 ? 'disabled ' : '') +
      'style="padding:5px 12px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;cursor:pointer;font-size:12px' +
      (currentPage <= 1 ? ';opacity:.4;cursor:not-allowed' : '') + '">← Prev</button>'
    var nextBtn = '<button onclick="goPage(' + (currentPage + 1) + ')" ' +
      (currentPage >= totalPages ? 'disabled ' : '') +
      'style="padding:5px 12px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;cursor:pointer;font-size:12px' +
      (currentPage >= totalPages ? ';opacity:.4;cursor:not-allowed' : '') + '">Next →</button>'

    document.getElementById('screen-content').innerHTML =
      '<div style="overflow-x:auto">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead><tr>' + ths + '</tr></thead>' +
          '<tbody>' + trs + '</tbody>' +
        '</table>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:12px;color:#6b7280">' +
        '<span>Page ' + currentPage + ' of ' + totalPages + ' · ' + allItems.length + ' total</span>' +
        '<div style="display:flex;gap:8px">' + prevBtn + nextBtn + '</div>' +
      '</div>'
  }

  window.goPage = function(n) {
    currentPage = Math.max(1, Math.min(getTotalPages(), n))
    render()
  }

  render()
}
```

---

## Load more (mobile)

**Component type key:** `pagination` *(use this variant when `platform_type = "mobile"`)*

Shows 15 items, adds 15 more on tap. No prev/next — optimal for mobile (Smashing Magazine research: Load More outperforms pagination on mobile engagement).

```js
function renderScreen() {
  var data = getData()
  var allItems = data.items || []
  var batchSize = 15
  var visibleCount = batchSize

  function render() {
    var visible = allItems.slice(0, visibleCount)
    var keys = allItems.length ? Object.keys(allItems[0]) : []

    var cards = visible.map(function(item) {
      var fields = keys.map(function(k) {
        return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f9fafb">' +
          '<span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;font-weight:600">' + k + '</span>' +
          '<span style="font-size:13px;color:#111;text-align:right;max-width:60%">' + (item[k] != null ? item[k] : '—') + '</span>' +
        '</div>'
      }).join('')
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;margin-bottom:10px">' +
        fields + '</div>'
    }).join('')

    var moreBtn = visibleCount < allItems.length
      ? '<button onclick="loadMore()" style="' +
          'width:100%;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;' +
          'font-size:14px;font-weight:600;color:#3b1f4a;cursor:pointer;' +
          'touch-action:manipulation;-webkit-tap-highlight-color:transparent;min-height:48px">' +
          'Load more (' + (allItems.length - visibleCount) + ' remaining)' +
        '</button>'
      : '<p style="text-align:center;font-size:12px;color:#9ca3af;padding:8px 0">All ' + allItems.length + ' items loaded</p>'

    document.getElementById('screen-content').innerHTML =
      '<p style="font-size:12px;color:#6b7280;margin-bottom:12px">Showing ' + visible.length + ' of ' + allItems.length + '</p>' +
      cards + moreBtn
  }

  window.loadMore = function() {
    visibleCount = Math.min(allItems.length, visibleCount + batchSize)
    render()
  }

  render()
}
```

---

## Modal

**Component type key:** `modal`

```js
function renderScreen() {
  var data = getData()
  var items = data.items || []

  if (!document.getElementById('modal-overlay')) {
    var overlay = document.createElement('div')
    overlay.id = 'modal-overlay'
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:8000;' +
      'align-items:center;justify-content:center'
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:12px;padding:24px;width:480px;max-width:90vw;' +
        'max-height:80vh;overflow-y:auto;position:relative">' +
        '<button onclick="closeModal()" style="position:absolute;top:12px;right:12px;background:none;' +
          'border:none;font-size:20px;cursor:pointer;color:#6b7280;min-width:32px;min-height:32px;' +
          'touch-action:manipulation">×</button>' +
        '<div id="modal-body"></div>' +
      '</div>'
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal() })
    document.body.appendChild(overlay)
  }

  window.openModal = function(idx) {
    var item = items[idx]
    document.getElementById('modal-body').innerHTML =
      '<h3 style="margin:0 0 16px;font-size:16px;font-weight:600">' + (item.name || 'Detail') + '</h3>' +
      Object.entries(item).map(function(pair) {
        return '<div style="margin-bottom:10px">' +
          '<span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em">' + pair[0] + '</span>' +
          '<p style="margin:4px 0;font-size:13px;color:#111">' + (pair[1] != null ? pair[1] : '—') + '</p>' +
        '</div>'
      }).join('')
    document.getElementById('modal-overlay').style.display = 'flex'
    document.body.style.overflow = 'hidden'
  }

  window.closeModal = function() {
    document.getElementById('modal-overlay').style.display = 'none'
    document.body.style.overflow = ''
  }

  var rows = items.map(function(item, i) {
    return '<tr>' +
      '<td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6">' + (item.name || '—') + '</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' +
        '<button onclick="openModal(' + i + ')" style="padding:4px 10px;background:#f3f4f6;border:none;' +
          'border-radius:4px;font-size:12px;cursor:pointer;touch-action:manipulation;min-height:30px">View</button>' +
      '</td>' +
    '</tr>'
  }).join('')

  document.getElementById('screen-content').innerHTML =
    '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr>' +
        '<th style="padding:8px 12px;font-size:11px;text-transform:uppercase;color:#6b7280;' +
          'border-bottom:2px solid #e5e7eb;text-align:left">Name</th><th></th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>'
}
```

---

## Drawer / right-side panel (web)

**Component type key:** `drawer`

```js
function renderScreen() {
  var data = getData()
  var items = data.items || []

  if (!document.getElementById('drawer-panel')) {
    var drawer = document.createElement('div')
    drawer.id = 'drawer-panel'
    drawer.style.cssText = 'position:fixed;top:0;right:-420px;width:400px;height:100vh;background:#fff;' +
      'box-shadow:-4px 0 24px rgba(0,0,0,0.12);z-index:8000;overflow-y:auto;' +
      'transition:right 0.25s ease;padding:24px;box-sizing:border-box'
    drawer.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
        '<h3 id="drawer-title" style="margin:0;font-size:16px;font-weight:600"></h3>' +
        '<button onclick="closeDrawer()" style="background:none;border:none;font-size:20px;' +
          'cursor:pointer;color:#6b7280;min-width:36px;min-height:36px;touch-action:manipulation">×</button>' +
      '</div>' +
      '<div id="drawer-body"></div>'
    document.body.appendChild(drawer)
  }

  window.openDrawer = function(idx) {
    var item = items[idx]
    document.getElementById('drawer-title').textContent = item.name || 'Details'
    document.getElementById('drawer-body').innerHTML =
      Object.entries(item).map(function(pair) {
        return '<div style="margin-bottom:14px">' +
          '<span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em">' + pair[0] + '</span>' +
          '<p style="margin:4px 0;font-size:13px;color:#111">' + (pair[1] != null ? pair[1] : '—') + '</p>' +
        '</div>'
      }).join('')
    document.getElementById('drawer-panel').style.right = '0'
    document.body.style.overflow = 'hidden'
  }

  window.closeDrawer = function() {
    document.getElementById('drawer-panel').style.right = '-420px'
    document.body.style.overflow = ''
  }

  var rows = items.map(function(item, i) {
    return '<tr style="cursor:pointer" onclick="openDrawer(' + i + ')">' +
      '<td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #f3f4f6">' + (item.name || '—') + '</td>' +
      '<td style="padding:10px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #f3f4f6">→</td>' +
    '</tr>'
  }).join('')

  document.getElementById('screen-content').innerHTML =
    '<table style="width:100%;border-collapse:collapse"><tbody>' + rows + '</tbody></table>'
}
```

---

## Bottom sheet (mobile)

**Component type key:** `drawer` *(use this variant when `platform_type = "mobile"`)*

Slides up from bottom. Tap backdrop or drag threshold (80px) to close. `overscroll-behavior: contain` prevents scroll bleed.

```js
function renderScreen() {
  var data = getData()
  var items = data.items || []
  var sheetOpen = false
  var dragStartY = 0

  if (!document.getElementById('bottom-sheet')) {
    var backdrop = document.createElement('div')
    backdrop.id = 'sheet-backdrop'
    backdrop.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:7999'
    backdrop.addEventListener('click', closeSheet)
    document.body.appendChild(backdrop)

    var sheet = document.createElement('div')
    sheet.id = 'bottom-sheet'
    sheet.style.cssText = 'position:fixed;left:0;right:0;bottom:0;' +
      'background:#fff;border-radius:16px 16px 0 0;z-index:8000;' +
      'max-height:80vh;overflow-y:auto;overscroll-behavior:contain;' +
      'transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);' +
      'padding:0 16px 32px;box-sizing:border-box'
    sheet.innerHTML =
      '<div id="sheet-handle" style="width:36px;height:4px;background:#d1d5db;border-radius:2px;' +
        'margin:12px auto 16px;cursor:grab"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<h3 id="sheet-title" style="margin:0;font-size:16px;font-weight:600"></h3>' +
        '<button onclick="closeSheet()" style="background:none;border:none;font-size:24px;color:#6b7280;' +
          'cursor:pointer;min-width:44px;min-height:44px;touch-action:manipulation">×</button>' +
      '</div>' +
      '<div id="sheet-body"></div>'

    /* Drag-to-dismiss */
    var handle = sheet.querySelector('#sheet-handle')
    handle.addEventListener('touchstart', function(e) { dragStartY = e.touches[0].clientY }, { passive: true })
    handle.addEventListener('touchmove', function(e) {
      var delta = e.touches[0].clientY - dragStartY
      if (delta > 0) sheet.style.transform = 'translateY(' + delta + 'px)'
    }, { passive: true })
    handle.addEventListener('touchend', function(e) {
      var delta = e.changedTouches[0].clientY - dragStartY
      sheet.style.transition = 'transform 0.35s cubic-bezier(0.32,0.72,0,1)'
      if (delta > 80) closeSheet()
      else sheet.style.transform = 'translateY(0)'
    })

    document.body.appendChild(sheet)
  }

  window.openSheet = function(idx) {
    var item = items[idx]
    sheetOpen = true
    document.getElementById('sheet-title').textContent = item.name || 'Details'
    document.getElementById('sheet-body').innerHTML =
      Object.entries(item).map(function(pair) {
        return '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6">' +
          '<span style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em">' + pair[0] + '</span>' +
          '<span style="font-size:14px;color:#111;text-align:right;max-width:60%">' + (pair[1] != null ? pair[1] : '—') + '</span>' +
        '</div>'
      }).join('')
    document.getElementById('sheet-backdrop').style.display = 'block'
    var sheet = document.getElementById('bottom-sheet')
    sheet.style.transition = 'transform 0.35s cubic-bezier(0.32,0.72,0,1)'
    sheet.style.transform = 'translateY(0)'
    document.body.style.overflow = 'hidden'
  }

  window.closeSheet = function() {
    sheetOpen = false
    document.getElementById('bottom-sheet').style.transform = 'translateY(100%)'
    document.getElementById('sheet-backdrop').style.display = 'none'
    document.body.style.overflow = ''
  }

  var cards = items.map(function(item, i) {
    return '<div onclick="openSheet(' + i + ')" style="' +
      'padding:14px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:10px;' +
      'display:flex;justify-content:space-between;align-items:center;cursor:pointer;' +
      'touch-action:manipulation;-webkit-tap-highlight-color:transparent;min-height:56px">' +
      '<span style="font-size:14px;font-weight:500;color:#111">' + (item.name || '—') + '</span>' +
      '<span style="color:#9ca3af;font-size:18px">›</span>' +
    '</div>'
  }).join('')

  document.getElementById('screen-content').innerHTML = cards ||
    '<p style="color:#9ca3af;text-align:center;padding:32px 0;font-size:14px">No items</p>'
}
```

---

## Accordion

**Component type key:** `accordion`

```js
function renderScreen() {
  var data = getData()
  var sections = data.sections || []
  var openIdx = null

  function render() {
    var items = sections.map(function(sec, i) {
      var isOpen = i === openIdx
      return '<div style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;overflow:hidden">' +
        '<button onclick="toggleAccordion(' + i + ')" style="' +
          'width:100%;padding:12px 16px;background:' + (isOpen ? '#f9fafb' : '#fff') + ';' +
          'border:none;text-align:left;cursor:pointer;font-size:13px;font-weight:600;color:#111;' +
          'display:flex;justify-content:space-between;align-items:center;' +
          'min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent">' +
          (sec.title || 'Section ' + (i + 1)) +
          '<span style="font-size:16px;color:#6b7280;flex-shrink:0">' + (isOpen ? '−' : '+') + '</span>' +
        '</button>' +
        (isOpen
          ? '<div style="padding:12px 16px;font-size:13px;color:#374151;border-top:1px solid #e5e7eb">' +
              (sec.content || '—') +
            '</div>'
          : '') +
      '</div>'
    }).join('')

    document.getElementById('screen-content').innerHTML = items ||
      '<p style="color:#9ca3af;font-size:13px">No sections available.</p>'
  }

  window.toggleAccordion = function(idx) {
    openIdx = openIdx === idx ? null : idx
    render()
  }

  render()
}
```

---

## Form with validation

**Component type key:** `form-with-validation`

```js
function renderScreen() {
  var errors = {}

  function validate(fields) {
    var errs = {}
    if (!fields.name || !fields.name.trim())      errs.name  = 'Name is required'
    if (!fields.email || !/@/.test(fields.email)) errs.email = 'Valid email required'
    return errs
  }

  function fieldBlock(id, label, type, placeholder) {
    var err = errors[id]
    return '<div style="margin-bottom:16px">' +
      '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px">' + label + '</label>' +
      '<input id="field-' + id + '" type="' + (type || 'text') + '" placeholder="' + (placeholder || '') + '" ' +
        'style="width:100%;padding:10px 12px;border:1px solid ' + (err ? '#ef4444' : '#e5e7eb') + ';' +
        'border-radius:6px;font-size:16px;box-sizing:border-box">' +
      (err ? '<p style="margin:4px 0 0;font-size:11px;color:#ef4444">' + err + '</p>' : '') +
    '</div>'
  }

  function render() {
    document.getElementById('screen-content').innerHTML =
      '<form id="main-form" onsubmit="submitForm(event)" style="max-width:480px">' +
        fieldBlock('name',  'Full name',     'text',  'Jane Smith') +
        fieldBlock('email', 'Email address', 'email', 'jane@example.com') +
        '<button type="submit" style="padding:11px 24px;background:#3b1f4a;color:#fff;border:none;' +
          'border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;min-height:44px;' +
          'touch-action:manipulation">Submit</button>' +
        '<p id="form-success" style="display:none;margin-top:12px;color:#16a34a;font-size:13px">✓ Submitted successfully</p>' +
      '</form>'
  }

  window.submitForm = function(e) {
    e.preventDefault()
    var fields = {
      name:  (document.getElementById('field-name')  || {}).value || '',
      email: (document.getElementById('field-email') || {}).value || ''
    }
    errors = validate(fields)
    if (Object.keys(errors).length > 0) {
      render()
    } else {
      errors = {}
      render()
      var s = document.getElementById('form-success')
      if (s) s.style.display = 'block'
    }
  }

  render()
}
```

---

## Multi-select dropdown

**Component type key:** `multi-select`

Uses `font-size: 16px` on the trigger to prevent iOS Safari zoom.

```js
function renderScreen() {
  var data = getData()
  var options = data.options || []
  var selected = []
  var dropdownOpen = false

  function render() {
    var selectedLabel = selected.length
      ? selected.join(', ')
      : '<span style="color:#9ca3af">Select…</span>'

    var optItems = options.map(function(opt) {
      var checked = selected.indexOf(opt) !== -1
      return '<div onclick="toggleOption(\'' + opt + '\')" style="' +
        'padding:10px 12px;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:10px;' +
        'min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;' +
        'background:' + (checked ? '#f5f3ff' : '#fff') + '">' +
        '<span style="flex-shrink:0;width:16px;height:16px;border:1.5px solid ' + (checked ? '#3b1f4a' : '#d1d5db') + ';' +
          'border-radius:3px;background:' + (checked ? '#3b1f4a' : '#fff') + ';display:inline-flex;' +
          'align-items:center;justify-content:center;font-size:11px;color:#fff">' + (checked ? '✓' : '') + '</span>' +
        opt +
      '</div>'
    }).join('')

    document.getElementById('screen-content').innerHTML =
      '<div style="position:relative;width:280px">' +
        '<div onclick="toggleDropdown()" style="' +
          'padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;' +
          'font-size:16px;background:#fff;display:flex;justify-content:space-between;align-items:center;' +
          'min-height:44px;touch-action:manipulation;user-select:none">' +
          '<span>' + selectedLabel + '</span>' +
          '<span style="color:#6b7280;font-size:12px">' + (dropdownOpen ? '▲' : '▼') + '</span>' +
        '</div>' +
        (dropdownOpen
          ? '<div style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;' +
              'border:1px solid #e5e7eb;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;' +
              'max-height:220px;overflow-y:auto;-webkit-overflow-scrolling:touch">' + optItems + '</div>'
          : '') +
      '</div>' +
      (selected.length
        ? '<p style="margin-top:12px;font-size:13px;color:#374151">Selected: ' + selected.join(', ') + '</p>'
        : '')
  }

  window.toggleDropdown = function() {
    dropdownOpen = !dropdownOpen
    render()
  }
  window.toggleOption = function(opt) {
    var idx = selected.indexOf(opt)
    if (idx === -1) selected.push(opt)
    else selected.splice(idx, 1)
    render()
  }

  render()
}
```

---

## Search input with live filtering

**Component type key:** `search-input`

```js
function renderScreen() {
  var data = getData()
  var allItems = data.items || []
  var query = ''

  function getResults() {
    if (!query.trim()) return allItems
    var q = query.toLowerCase()
    return allItems.filter(function(item) {
      return Object.values(item).some(function(v) { return String(v).toLowerCase().includes(q) })
    })
  }

  function render() {
    var results = getResults()
    var rows = results.map(function(item) {
      return '<div style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:13px">' +
        Object.entries(item).map(function(pair) {
          return '<span style="margin-right:16px"><span style="color:#9ca3af">' + pair[0] + ':</span> ' + pair[1] + '</span>'
        }).join('') +
      '</div>'
    }).join('') || '<p style="padding:16px;color:#9ca3af;font-size:13px;text-align:center">No results for "' + query + '"</p>'

    document.getElementById('screen-content').innerHTML =
      '<div style="margin-bottom:12px">' +
        '<input id="search-input" type="search" placeholder="Search…" value="' + query + '" ' +
          'oninput="doSearch(this.value)" ' +
          'style="padding:10px 16px;border:1px solid #e5e7eb;border-radius:24px;font-size:16px;width:100%;box-sizing:border-box">' +
        (query ? '<span style="display:block;margin-top:6px;font-size:12px;color:#6b7280">' + results.length + ' results</span>' : '') +
      '</div>' +
      '<div>' + rows + '</div>'
  }

  window.doSearch = function(val) {
    query = val
    render()
  }

  render()
}
```

---

## Skeleton loader

**Component type key:** `skeleton-loader`

Use when `getData()` returns `{ loading: true }`. CSS-only shimmer — no external library. GPU-accelerated via `transform` on a pseudo-gradient overlay.

```js
function renderScreen() {
  var data = getData()

  if (data.loading) {
    /* Inject shimmer keyframe once */
    if (!document.getElementById('skeleton-style')) {
      var style = document.createElement('style')
      style.id = 'skeleton-style'
      style.textContent =
        '@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}' +
        '.skel{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);' +
          'background-size:200% 100%;animation:shimmer 1.5s linear infinite;border-radius:4px}'
      document.head.appendChild(style)
    }

    function skRow() {
      return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6">' +
        '<div class="skel" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"></div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:6px">' +
          '<div class="skel" style="height:13px;width:60%"></div>' +
          '<div class="skel" style="height:11px;width:40%"></div>' +
        '</div>' +
        '<div class="skel" style="height:13px;width:60px;align-self:center"></div>' +
      '</div>'
    }

    document.getElementById('screen-content').innerHTML =
      '<div style="padding:16px 0">' +
        skRow() + skRow() + skRow() + skRow() + skRow() +
      '</div>'
    return
  }

  /* Normal render when data is ready */
  var items = data.items || []
  var rows = items.map(function(item) {
    return '<div style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:13px">' +
      JSON.stringify(item) + '</div>'
  }).join('') || '<p style="color:#9ca3af;font-size:13px;padding:16px 0">No data</p>'

  document.getElementById('screen-content').innerHTML = rows
}
```

---

## Toast / snackbar

**Component type key:** `toast`

Auto-dismisses at 4s. Stacks up to 3 toasts. Slides in from bottom-right (web) or bottom full-width (mobile). Call `showToast(message, type)` from any handler — `type` is `success`, `error`, `warning`, or `info`.

```js
/* Paste this block inside the screen's <script>, outside renderScreen() */
(function() {
  if (window.__toastInit) return
  window.__toastInit = true

  var container = document.createElement('div')
  container.id = 'toast-container'
  container.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9500;' +
    'display:flex;flex-direction:column;gap:8px;max-width:360px;width:calc(100% - 32px)'
  document.body.appendChild(container)

  var colorMap = {
    success: { bg: '#166534', icon: '✓' },
    error:   { bg: '#991b1b', icon: '✕' },
    warning: { bg: '#92400e', icon: '⚠' },
    info:    { bg: '#1e3a5f', icon: 'ℹ' }
  }

  window.showToast = function(message, type) {
    var c = colorMap[type] || colorMap.info
    var toasts = container.querySelectorAll('.toast-item')
    if (toasts.length >= 3) toasts[0].remove()

    var toast = document.createElement('div')
    toast.className = 'toast-item'
    toast.style.cssText = 'background:' + c.bg + ';color:#fff;padding:12px 16px;border-radius:8px;' +
      'font-size:13px;display:flex;align-items:center;gap:10px;cursor:pointer;' +
      'transform:translateY(20px);opacity:0;transition:transform 0.3s ease,opacity 0.3s ease;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.25)'
    toast.innerHTML =
      '<span style="font-size:15px;flex-shrink:0">' + c.icon + '</span>' +
      '<span style="flex:1">' + message + '</span>' +
      '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.7);' +
        'cursor:pointer;font-size:18px;min-width:24px;min-height:24px;touch-action:manipulation">×</button>'

    container.appendChild(toast)
    /* Trigger enter animation */
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toast.style.transform = 'translateY(0)'
        toast.style.opacity = '1'
      })
    })
    /* Auto-dismiss */
    setTimeout(function() {
      if (!toast.parentElement) return
      toast.style.transform = 'translateY(20px)'
      toast.style.opacity = '0'
      setTimeout(function() { if (toast.parentElement) toast.remove() }, 300)
    }, 4000)
  }
})()

/* Usage inside any handler in renderScreen(): */
/* showToast('Record saved successfully', 'success') */
/* showToast('Could not connect to server', 'error') */
```

---

## Empty state

**Component type key:** `empty-state`

Use when `data.items` is an empty array or `data.empty === true`. Renders icon + heading + body + optional CTA.

```js
function emptyStateHtml(opts) {
  /* opts: { icon, heading, body, cta, ctaLabel, ctaOnclick } */
  var icon    = opts.icon     || '📭'
  var heading = opts.heading  || 'Nothing here yet'
  var body    = opts.body     || 'Items will appear here once they're added.'
  var cta     = opts.cta !== false

  return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'min-height:240px;padding:32px 16px;text-align:center;color:#374151" role="status">' +
    '<div style="font-size:48px;opacity:.4;margin-bottom:16px">' + icon + '</div>' +
    '<h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111">' + heading + '</h3>' +
    '<p style="margin:0 0 24px;font-size:13px;color:#6b7280;max-width:280px;line-height:1.6">' + body + '</p>' +
    (cta
      ? '<button onclick="' + (opts.ctaOnclick || '') + '" style="padding:9px 20px;background:#3b1f4a;' +
          'color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;' +
          'min-height:44px;touch-action:manipulation">' + (opts.ctaLabel || 'Get started') + '</button>'
      : '') +
  '</div>'
}

/* Usage inside renderScreen(): */
/* if (!data.items || !data.items.length) { */
/*   el.innerHTML = emptyStateHtml({ */
/*     icon: '📋', */
/*     heading: 'No projects found', */
/*     body: 'Create a project to get started.', */
/*     ctaLabel: 'New project', ctaOnclick: 'openNewProjectModal()' */
/*   }) */
/*   return */
/* } */
```

---

## Inline edit

**Component type key:** `inline-edit`

Click a value to edit it in place. Enter or blur to save, Escape to cancel.

```js
function renderScreen() {
  var data = getData()
  var record = data.record || { name: 'Sample record', email: 'user@example.com', role: 'Viewer' }
  var editingField = null
  var editValues = Object.assign({}, record)

  function render() {
    var fields = Object.keys(record).map(function(key) {
      var isEditing = editingField === key
      var valueCell = isEditing
        ? '<input id="inline-input" value="' + (editValues[key] || '') + '" ' +
            'onblur="saveInline(\'' + key + '\')" ' +
            'onkeydown="handleInlineKey(event, \'' + key + '\')" ' +
            'style="font:inherit;font-size:13px;padding:4px 8px;border:1px solid #3b1f4a;' +
            'border-radius:4px;width:100%;box-sizing:border-box;font-size:16px" ' +
            'autofocus>'
        : '<span onclick="startEdit(\'' + key + '\')" style="' +
            'cursor:text;padding:4px 8px;border-radius:4px;display:inline-block;' +
            'border:1px dashed transparent;font-size:13px;' +
            'transition:border-color .15s" ' +
            'onmouseenter="this.style.borderColor=\'#d1d5db\'" ' +
            'onmouseleave="this.style.borderColor=\'transparent\'">' +
            (editValues[key] || '—') +
          '</span>'

      return '<tr>' +
        '<td style="padding:10px 12px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;' +
          'letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f3f4f6;width:35%">' + key + '</td>' +
        '<td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">' + valueCell + '</td>' +
      '</tr>'
    }).join('')

    document.getElementById('screen-content').innerHTML =
      '<p style="font-size:12px;color:#9ca3af;margin-bottom:8px">Click any value to edit</p>' +
      '<table style="width:100%;border-collapse:collapse"><tbody>' + fields + '</tbody></table>'

    if (isEditing) {
      var inp = document.getElementById('inline-input')
      if (inp) { inp.focus(); inp.select() }
    }
  }

  var isEditing = false

  window.startEdit = function(key) {
    isEditing = true
    editingField = key
    render()
  }
  window.saveInline = function(key) {
    var inp = document.getElementById('inline-input')
    if (inp) editValues[key] = inp.value
    isEditing = false
    editingField = null
    render()
  }
  window.handleInlineKey = function(e, key) {
    if (e.key === 'Enter')  { e.preventDefault(); saveInline(key) }
    if (e.key === 'Escape') {
      isEditing = false
      editingField = null
      render()
    }
  }

  render()
}
```

---

## Floating action button — FAB (mobile)

**Component type key:** `fab`

56×56px primary FAB. Optional speed dial with up to 4 secondary actions (40×40px each, staggered 100ms per Material Design spec). `aria-expanded` toggles on open.

```js
/* Inject FAB after renderScreen() sets up the main content — call initFab() at end of renderScreen() */
function initFab(actions) {
  /* actions: [{ icon, label, onclick }] — up to 4 items */
  if (document.getElementById('fab-root')) document.getElementById('fab-root').remove()

  var isOpen = false
  var root = document.createElement('div')
  root.id = 'fab-root'
  root.style.cssText = 'position:fixed;bottom:clamp(16px,4vw,24px);right:clamp(16px,4vw,24px);' +
    'z-index:8500;display:flex;flex-direction:column-reverse;align-items:flex-end;gap:12px'

  /* Primary FAB */
  var primary = document.createElement('button')
  primary.id = 'fab-primary'
  primary.setAttribute('aria-label', 'Actions')
  primary.setAttribute('aria-expanded', 'false')
  primary.style.cssText = 'width:56px;height:56px;border-radius:50%;background:#3b1f4a;color:#fff;' +
    'border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);' +
    'display:flex;align-items:center;justify-content:center;touch-action:manipulation;' +
    '-webkit-tap-highlight-color:transparent;transition:transform 0.2s ease'
  primary.textContent = '+'
  primary.addEventListener('click', function() {
    isOpen = !isOpen
    primary.setAttribute('aria-expanded', String(isOpen))
    primary.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
    speedDial.style.display = isOpen ? 'flex' : 'none'
  })

  /* Speed dial container */
  var speedDial = document.createElement('div')
  speedDial.style.cssText = 'display:none;flex-direction:column-reverse;gap:10px;align-items:flex-end'

  if (actions && actions.length) {
    actions.slice(0, 4).forEach(function(action, i) {
      var item = document.createElement('div')
      item.style.cssText = 'display:flex;align-items:center;gap:10px;' +
        'animation:fabIn 0.2s ease both;animation-delay:' + (i * 0.07) + 's'

      if (!document.getElementById('fab-anim-style')) {
        var s = document.createElement('style')
        s.id = 'fab-anim-style'
        s.textContent = '@keyframes fabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'
        document.head.appendChild(s)
      }

      var label = document.createElement('span')
      label.style.cssText = 'background:rgba(0,0,0,0.75);color:#fff;font-size:12px;font-weight:500;' +
        'padding:4px 10px;border-radius:4px;white-space:nowrap'
      label.textContent = action.label

      var btn = document.createElement('button')
      btn.style.cssText = 'width:40px;height:40px;border-radius:50%;background:#fff;' +
        'border:1px solid #e5e7eb;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);' +
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
        'touch-action:manipulation;-webkit-tap-highlight-color:transparent'
      btn.textContent = action.icon
      btn.setAttribute('aria-label', action.label)
      btn.addEventListener('click', function() {
        isOpen = false
        primary.setAttribute('aria-expanded', 'false')
        primary.style.transform = 'rotate(0deg)'
        speedDial.style.display = 'none'
        if (typeof action.onclick === 'function') action.onclick()
      })

      item.appendChild(label)
      item.appendChild(btn)
      speedDial.appendChild(item)
    })
  }

  root.appendChild(speedDial)
  root.appendChild(primary)
  document.body.appendChild(root)
}

/* Usage at the end of renderScreen(): */
/* initFab([ */
/*   { icon: '＋', label: 'New task',    onclick: function() { showToast('New task', 'info') } }, */
/*   { icon: '📤', label: 'Export',      onclick: function() { showToast('Exported', 'success') } }, */
/*   { icon: '🔍', label: 'Filter',      onclick: function() { /* open filter sheet *\/ } } */
/* ]) */
```

---

## Status / color badge

**Component type key:** `status-badge`

Inline helper — call inside any `renderScreen()`:

```js
function badgeHtml(status) {
  var map = {
    active:    { bg: '#dcfce7', color: '#16a34a' },
    inactive:  { bg: '#f3f4f6', color: '#6b7280' },
    pending:   { bg: '#fef9c3', color: '#ca8a04' },
    error:     { bg: '#fee2e2', color: '#dc2626' },
    warning:   { bg: '#fff7ed', color: '#ea580c' },
    success:   { bg: '#dcfce7', color: '#16a34a' },
    draft:     { bg: '#f3f4f6', color: '#6b7280' },
    review:    { bg: '#ede9fe', color: '#7c3aed' },
    approved:  { bg: '#dcfce7', color: '#15803d' },
    rejected:  { bg: '#fee2e2', color: '#b91c1c' },
    overdue:   { bg: '#fee2e2', color: '#dc2626' },
    submitted: { bg: '#dbeafe', color: '#1d4ed8' },
    paused:    { bg: '#fef3c7', color: '#d97706' },
    archived:  { bg: '#f3f4f6', color: '#9ca3af' }
  }
  var style = map[String(status).toLowerCase()] || { bg: '#f3f4f6', color: '#374151' }
  return '<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;' +
    'background:' + style.bg + ';color:' + style.color + ';white-space:nowrap">' + status + '</span>'
}
```

---

## Utilization bar

**Component type key:** `utilization-bar`

Inline helper — renders a labeled progress bar:

```js
function utilizationBarHtml(label, pct) {
  var clamped = Math.max(0, Math.min(100, pct || 0))
  var color = clamped >= 90 ? '#ef4444' : clamped >= 75 ? '#f59e0b' : '#22c55e'
  return '<div style="margin-bottom:10px">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:#374151">' +
      '<span>' + label + '</span>' +
      '<span style="font-weight:600;color:' + color + '">' + clamped + '%</span>' +
    '</div>' +
    '<div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden">' +
      '<div style="height:100%;width:' + clamped + '%;background:' + color + ';border-radius:3px;transition:width .3s ease"></div>' +
    '</div>' +
  '</div>'
}
```

---

## Date picker (flatpickr)

**Component type key:** `date-picker`

Requires flatpickr CDN — auto-added when detected in PRD analysis. Falls back to native `<input type="date">` if CDN unavailable. Input uses `font-size: 16px` to prevent iOS Safari zoom.

```js
function renderScreen() {
  var selectedDate = null

  document.getElementById('screen-content').innerHTML =
    '<div style="max-width:320px">' +
      '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px">Select date</label>' +
      '<input id="date-input" placeholder="Choose a date…" readonly ' +
        'style="width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;' +
        'font-size:16px;cursor:pointer;box-sizing:border-box;min-height:44px">' +
      '<p id="date-result" style="margin-top:8px;font-size:13px;color:#374151"></p>' +
    '</div>'

  if (window.flatpickr) {
    flatpickr('#date-input', {
      dateFormat: 'Y-m-d',
      onChange: function(dates, str) {
        selectedDate = str
        var r = document.getElementById('date-result')
        if (r) r.textContent = str ? 'Selected: ' + str : ''
      }
    })
  } else {
    var inp = document.getElementById('date-input')
    if (inp) {
      inp.type = 'date'
      inp.removeAttribute('readonly')
      inp.addEventListener('change', function() {
        selectedDate = inp.value
        var r = document.getElementById('date-result')
        if (r) r.textContent = inp.value ? 'Selected: ' + inp.value : ''
      })
    }
  }
}
```
