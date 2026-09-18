# CODE GUIDE — AI Campus Opportunity Agent
### Every detail of how the code is written and which code is responsible for which part

This website is a **pure front-end project** — just **3 files, zero build tools, zero frameworks**.
Open `website/index.html` in any browser (or serve the folder) and everything works.

```
AI-Project/
└── website/
    ├── index.html   (344 lines)  → STRUCTURE  : what is on the page
    ├── styles.css   (180 lines)  → APPEARANCE : how it looks (dark-violet theme)
    └── app.js       (244 lines)  → BEHAVIOUR  : how the Live Demo reacts to clicks
```

**How the three files talk to each other**

| Bridge | Example |
|---|---|
| HTML `id` → JS `document.getElementById(...)` | `<input id="inSkills">` ↔ `getElementById("inSkills")` |
| HTML `class` → CSS selector | `<div class="opp-card">` ↔ `.opp-card{...}` in styles.css |
| JS toggles a class → CSS changes the look | JS adds `.show` → toast slides up; adds `.active` → filter chip turns violet |
| HTML `href="#demo"` → section `id="demo"` | every navbar "tab" is an anchor link to a section |

---

## 1. `index.html` — section by section

Every region is wrapped in a `<!-- ===== SECTION ... ===== -->` comment banner in the file, so you can find it instantly with Ctrl+F.

| Lines (approx) | Block | id | What it is / which code draws it |
|---|---|---|---|
| 1–15 | `<head>` | — | Charset, viewport (mobile scaling), meta description, **inline-SVG favicon** (a data-URI, so no extra file and no 404), Google Fonts (Inter = body, Sora = headings). |
| 19–38 | **NAVBAR** | — | `.nav` is `position:sticky` so it stays on top while scrolling. Inside `.nav-inner`: `.brand` (logo, links to `#top`), **`#navToggle`** (hamburger, 3 `<span>` bars — hidden on desktop, shown on phones), **`#navLinks`** (the 7 tabs), and the violet **Try Demo** button (links to `#demo`). |
| 41–115 | **HERO** | `#top` | Left column (`.hero-left`): the `.pill` badge, the big `<h1>` whose middle word gets the pink→violet gradient via `.grad`, the "WHAT IT DOES" checklist (`.what`), two CTA buttons (`.hero-cta`), and the `.college-strip` with college/dept details. Right column (`.hero-right`): **four pure HTML/CSS mockups — no images are used anywhere**: `.laptop` (dashboard with 4 `.stat` tiles and 3 `.opp` rows), `.toast-card` (floating white notification, animated by `@keyframes float`), `.phone` (Upcoming Deadlines, 4 `.dl` rows), `.todo-note` (the rotated sticky note with decorative checkboxes). `.hero-bg` paints the 3 soft colour glows using `radial-gradient`s. |
| 118–148 | **PROBLEM vs SOLUTION** | `#problem` | `.split-grid` = two `.ps-card`s. Problem card: red `!` `.badge` + 3 `.mini-tags` items. Solution card: green `✓` badge + `.flow-mini` (the 4-step arrow strip). |
| 151–167 | **KEY FEATURES** | `#features` | `.feat-row` = 6 identical `.feat` cards (icon `.fic`, `<h4>`, `<p>`). Pure HTML — no JS needed. Maps to PPT §06 modules. |
| 170–197 | **AIM + OBJECTIVES** | `#aim` | `.two-col` = two `.card`s with the number chips (`.sec-no` "02"/"03"). Aim card: `.check` list (the green ✓ is added by CSS `::before`, not typed in HTML). Objectives: `.obj-grid` of 4 `.obj` tiles. |
| 200–225 | **HOW IT WORKS** | `#how` | `.steps` = 4 `.step` cards joined by `.arrow` (→) divs; `.step .n` is the gradient number circle. Below, `.pipeline` = 5 technical stages (Profile → Sources → Processing → AI Matching → Dashboard). |
| 228–279 | **LIVE DEMO** | `#demo` | The only interactive part. Three `.card`s in `.demo-grid`:<br>**Card 1 (Profile)** — `#inSkills` text input (default `python, web, ml`), `#inInterest` dropdown (values: all / coding / internship / scholarship / contest), `#btnMatch` button, `.reminder-box` with empty `#reminders` div (filled by JS).<br>**Card 2 (Results)** — `.filters` = 5 chips, each carrying `data-f="all|hackathon|internship|scholarship|contest"`; `#matchCount` badge; empty `#oppList` (JS fills it).<br>**Card 3 (Applications)** — empty `#savedList` (JS fills it), `#todoInput` + `#todoAdd` button + empty `#todoList` (JS fills it). |
| 282–297 | **TECH STACK** | `#tech` | `.tech-grid` = 6 `.tech` tiles (Python, HTML+CSS, JS, Flask/FastAPI, SQLite/MySQL, AI/ML). |
| 300–314 | **WHY IT'S INNOVATIVE** | `#innov` | `.innov-grid` = 5 `.innov` cards + the gradient `.banner` slogan. *(Deliberately not in the navbar — extra content beyond the PPT.)* |
| 317–331 | **FUTURE SCOPE** | `#future` | `.future-grid` = 6 `.future` tiles. |
| 333–339 | **FOOTER** | — | `.foot`: project credit left, "Project by Mr. T. P. Raju" + **Back to top ↑** button (links `#top`) right. |
| 342–343 | **TOAST + SCRIPT** | `#toast` | The empty pop-up bar at the very end, then `<script src="app.js">`. **The script tag is the last thing in `<body>`** so the HTML exists before JS runs — that's why JS can find every element without waiting. |

**Complete id inventory** (each appears exactly once — verified): `top, problem, aim, features, how, demo, tech, future, innov, navToggle, navLinks, inSkills, inInterest, btnMatch, reminders, matchCount, oppList, savedList, todoInput, todoAdd, todoList, toast`.

---

## 2. `styles.css` — block by block

The file is organised in 9 numbered, commented blocks:

| Block | Lines | Responsible for |
|---|---|---|
| **1. Design tokens** | 8–10 | `:root{--bg:...; --vio:...; ...}` — 13 CSS variables. Change `--vio` once and the whole theme follows. `*{box-sizing:border-box}` makes padding behave predictably. |
| **2. Base** | 12–21 | `html{scroll-behavior:smooth}` — **makes every navbar tab glide** instead of jumping. `section[id],header[id]{scroll-margin-top:76px}` — **stops scrolling 76 px early so the sticky navbar never covers a section title** (the "tab lands wrong" bug). `.grad` = gradient text trick (`background-clip:text`). `:focus-visible` = violet outline for keyboard users. |
| **3. Nav** | 23–41 | Sticky translucent bar (`backdrop-filter:blur` + Safari's `-webkit-` prefix). `.nav-links a.active{...}` = the **scrollspy highlight** (white + violet glow) that JS toggles. `.nav-toggle` = hamburger; its 3 `<span>` bars morph into an ✕ via `aria-expanded="true"` selectors. |
| **4. Buttons** | 37–42 | `.btn` base + `.btn-primary` (gradient + glow shadow), `.btn-ghost`, `.btn-sm`. |
| **5. Hero** | 44–73 | Everything in the hero, incl. the 4 mockups. Positions: `.toast-card`, `.phone`, `.todo-note` are `position:absolute` over the laptop on **desktop**. `@keyframes float` = the gentle up-down bob of the notification. |
| **6. Generic sections** | 75–103 | Shared patterns: `.sec-title/.sec-sub`, `.card`, the `#problem/#aim/#how` grids, feature cards (hover lifts them 4 px), steps + pipeline. |
| **7. Demo dashboard** | 105–138 | All demo styling: form inputs, `.filters button` + violet `.active` state, `.opp-list` (scrollable, max-height 460 px), `.opp-card`, `.tag`, `.match`, `.reminder-box`, `.saved-item`, `#todoList li` (+ `.done` = strikethrough). |
| **8. Footer + toast** | 140–144 | `#toast` is `position:fixed` at the bottom, hidden by `opacity:0` + pushed 80 px down; `.show` (added by JS) slides it up. |
| **9. Responsive** | 146–178 | Three tiers:<br>**≤1000 px** — hamburger appears (`.nav-toggle{display:flex}`), tabs become a **dropdown** (`.nav-links.open`), and the hero mockups switch from absolute → normal flow (`position:static`) **so they stack instead of overlapping**.<br>**≤560 px (phones)** — smaller `<h1>` (34 px), single-column grids, 2-col dashboard stats.<br>**`prefers-reduced-motion`** — disables animation/scroll-glide for users whose OS asks for it (accessibility). |

---

## 3. `app.js` — function by function

The file starts with a map comment (§1–§9). The script is loaded at the end of `<body>`, so all elements exist when it runs.

| § | Lines | Code | What it does |
|---|---|---|---|
| **1** | 17–33 | `const OPPORTUNITIES = [...]` | The sample "database": 10 objects. Fields: `title, type, interest, org, deadline, days, skills[], desc`. `type` drives the chips, `interest` drives the dropdown, `skills` drives matching, `days` drives reminders. **To change the data, edit only this array.** |
| **2** | 35–60 | `activeFilter`, `saved`, `todos` + `load()` / `persist()` | State. `saved` = list of saved titles, `todos` = `{text, done}` objects. `persist()` writes both to `localStorage` (keys `ca_saved`, `ca_todos`) so they **survive page refresh**; wrapped in try/catch so the demo still runs even if storage is blocked. |
| | 52–58 | `const oppList, savedList, matchCount, reminders, toast` | One-time grabs of the 5 elements JS paints into. |
| **3** | 62–77 | `esc()` , `showToast()` | `esc()` converts `< > & " '` to safe entities — **user-typed text can never inject HTML** (tested: typing `<img onerror=...>` shows as plain text). `showToast()` shows `#toast` for 2.6 s; `clearTimeout(toastTimer)` guarantees back-to-back messages don't cut each other short. |
| **4** | 79–87 | `matchScore(o, skills)` | The demo "AI": score = 55 + 15 × (number of your skills the opportunity also lists), capped at 98; neutral 70 with no skills. |
| **5** | 89–122 | `render()` | Reads `#inSkills` + `#inInterest` → scores all 10 items → filters by chip (`activeFilter`) AND dropdown (`interest`) → sorts best-first → paints `.opp-card`s into `#oppList` (each with a `Save` button calling `saveOppByIndex(idx)`). Empty result → "No opportunities match this filter." Also paints the 3 most urgent reminders (`days ≤ 12`) into `#reminders`. |
| **6** | 124–147 | `saveOppByIndex()`, `removeOppByIndex()`, `renderSaved()` | Save = push title → `persist()` → repaint `#savedList` → toast. Duplicate → "Already in your list ✓". Invalid index → "Opportunity not found." (fixed — used to say "Already saved!"). Remove = filter out → repaint. `renderSaved()` also shows each item's deadline. |
| **7** | 149–200 | `createTodoEl(t)`, `addTodo()` + input wiring | Builds one `<li>` per task: checkbox toggles `.done` (strikethrough), ✕ deletes. Both update `todos` + `persist()`. **Enter key** in `#todoInput` now adds a task too. Tasks are **HTML-escaped**. |
| **8** | 184–216 | filter chip loop, `#btnMatch`, `#inInterest` change | Chips: move `.active`, set `activeFilter`, re-render. Button: re-render + toast. **Dropdown now re-renders instantly on change** (enhancement). |
| **9** | 204–238 | hamburger + scrollspy | Hamburger: `#navToggle.onclick` toggles `.open` on `#navLinks` + keeps `aria-expanded` in sync; tapping any tab closes the menu. Scrollspy: an `IntersectionObserver` watches the 7 sections; the one in the middle of your screen gets `.active` on its nav tab (guarded so old browsers without the API just skip it). |
| — | 240–244 | init | `renderSaved()` → `render()` → the welcome toast after 1.2 s. |

---

## 4. What was fixed / enhanced in this pass

The design was **kept pixel-identical** (it still matches the reference image). Only behaviour, correctness and responsiveness changed:

| # | Type | Before | After |
|---|---|---|---|
| 1 | Bug | Clicking a nav tab jumped instantly and the **sticky navbar covered the section heading** | `scroll-behavior:smooth` + `scroll-margin-top:76px` → every tab glides and lands perfectly |
| 2 | Bug | **All 7 tabs were invisible on phones/tablets** (`display:none` with no menu) | Hamburger button + dropdown menu; closes after tapping a tab; ✕ animation; ARIA attributes |
| 3 | Bug | Hero mockups (notification, phone, to-do note) **overlapped each other on small screens** | They stack vertically in normal flow below the laptop |
| 4 | Bug | Saving with a bad index showed the wrong message "Already saved!" | Correct messages: "Saved: …" / "Already in your list ✓" / "Opportunity not found." |
| 5 | Bug | Typing `<img onerror=…>` as a to-do **injected real HTML** | All user text is escaped via `esc()` |
| 6 | Bug | Rapid toasts cut each other off (shared timer) | Timer cleared per message |
| 7 | Enhancement | Interest dropdown did nothing until the button was pressed | Dropdown re-renders instantly on change |
| 8 | Enhancement | Saved list & to-dos vanished on refresh | Persisted in `localStorage` (survive refresh; safe fallback if blocked) |
| 9 | Enhancement | No way to add a to-do with the keyboard | **Enter key** adds a task |
| 10 | Enhancement | Tabs gave no visual feedback about where you are | **Scrollspy** highlights the current tab |
| 11 | Enhancement | 404 console error for missing favicon; no meta description | Inline-SVG favicon + meta description |
| 12 | Enhancement | No keyboard-focus styling; animations ignored OS settings | `:focus-visible` outlines + `prefers-reduced-motion` support; Safari `-webkit-backdrop-filter` |
| 13 | Cleanup | Unused dead functions `saveOpp()` / `removeOpp()` | Removed |
| 14 | Docs | — | Every HTML section, CSS block and JS function now has a banner comment + this guide |

---

## 5. Verification performed (all green)

- **Static audit** — every `getElementById` target exists; every `href="#…"` has a matching id; **no duplicate ids**; every class JS toggles exists in CSS; every inline `onclick` function is defined; `node --check app.js` syntax-clean.
- **44 automated end-to-end checks** in a simulated browser (jsdom): page loads with **zero JS errors**; all 7 nav tabs resolve; all 5 filter chips show the right counts (10/3/3/2/2) and highlight; dropdown filtering (scholarship→2, coding→3); empty-skills → 70 % neutral match; save → duplicate-save warning → remove → empty state; to-do add via **button and Enter**, tick, delete, **XSS injection blocked**; toasts; hamburger open/close + ARIA; persistence written; welcome toast.
- **HTTP smoke test** — all 3 files serve `200 OK`.

## 6. How to run / demo it

- **Easiest:** double-click `website/index.html` — fully works offline (fonts need internet, but the site falls back gracefully).
- **Proper way:** `cd website && python3 -m http.server 8080` → open `http://localhost:8080`.
- **2-minute demo script for marks:** open the site → click each navbar tab (they glide & highlight) → in Live Demo type skills `python, ml` → press ✨ Get My Recommendations → click the Hackathons chip → **Save** one → tick a to-do → add a to-do with **Enter** → refresh the page (your saves/tasks are still there!) → shrink the window to phone width to show the hamburger menu.
