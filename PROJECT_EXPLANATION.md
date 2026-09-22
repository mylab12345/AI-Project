# AI Campus Opportunity Agent — Complete Code Explanation
### A self-contained document for explaining the entire project (frontend + backend) to the professor

> **How to use this document:** Sections 1–2 give you the "big picture" you can open with in front of the professor. Sections 3–5 walk through every file, block by block, so you can answer "what does this line do?" for any code. Section 6 answers the question that is **guaranteed to be asked**: *"Where is your backend?"* Section 11 is a Q&A rehearsal.
>
> A second document, `CODE_GUIDE.md`, holds the raw line-number map of every section/function. Use it as an index while you study.

---

## 1. The project in one minute

**What it is.** A web application called the **AI Campus Opportunity Agent** — a single-page website that (a) presents the project concept and (b) contains a **fully working in-browser demo** of the agent: a student enters their skills and interest, the system "matches" them against a database of opportunities, ranks them with a percentage score, lets the student filter the list, save applications, set deadline reminders and manage a to-do list.

**Who it is for.** Students who waste hours hunting for internships, hackathons, scholarships and contests across many websites — and miss deadlines because information is scattered.

**The 4 core functions of the agent** (exactly what the hero section advertises):

1. **Finds** hackathons, internships, scholarships & contests matching the student's profile
2. **Tracks deadlines** & shows smart reminders for the most urgent ones
3. **Helps apply better** (to-do tracking + reminders)
4. **Recommends projects** to strengthen the profile (presented in the features section)

**The whole codebase is 3 files, 768 lines, zero frameworks, zero build tools:**

```
AI-Project/
├── PROJECT_EXPLANATION.md   ← this document
├── CODE_GUIDE.md            ← line-by-line technical map
└── website/
    ├── index.html   (344 lines)  → STRUCTURE : what is on the page
    ├── styles.css   (180 lines)  → APPEARANCE: how it looks (dark-violet theme)
    └── app.js       (244 lines)  → BEHAVIOUR : the demo logic, data & "AI"
```

---

## 2. System architecture (frontend + backend)

### 2.1 The big picture

```
┌──────────────────────────── THE BROWSER (front-end) ────────────────────────────┐
│                                                                                 │
│  index.html  ──────────────┐                                                    │
│  (structure: sections,     │  HTML: provides the SKELETON — every input,        │
│   inputs, containers)      │  button, list and section lives here               │
│                            ▼                                                    │
│  styles.css  ◄──────── CSS: paints that skeleton — colours, layout grid,        │
│                        animations, and makes it responsive (phone/tablet)       │
│                            ▲                                                    │
│  app.js  ────── JavaScript: the BRAIN of the demo — it reads the HTML inputs,   │
│  (behaviour +  └────────── computes matches, and paints the results back INTO   │
│   data + "AI")     HTML  the HTML containers (oppList, savedList, todoList…)    │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐        │
│  │  CLIENT-SIDE "BACKEND" (lives inside app.js — see Section 6)        │        │
│  │  ① OPPORTUNITIES array  = the database (10 records)                 │        │
│  │  ② matchScore()         = the AI matching engine                    │        │
│  │  ③ localStorage         = permanent storage (survives page refresh) │        │
│  └──────────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 The three layers, in plain English

| Layer | File | Plain-English job | Analogy |
|---|---|---|---|
| **Structure** | `index.html` | Defines *what* exists: the navbar, the sections, the demo's input boxes and empty lists | The house plan — walls and rooms |
| **Presentation** | `styles.css` | Decides *how it looks*: dark theme, cards, gradients, animations, and how everything reflows on a phone | The paint and furniture |
| **Logic** | `app.js` | Decides *how it behaves*: matching, filtering, saving, to-dos, menu, tab highlighting | The house's electricity and plumbing |

The three files are wired together through **ids and classes**:

| Bridge | Example in this project |
|---|---|
| HTML `id` → JS `getElementById(...)` | `<input id="inSkills">` ↔ `document.getElementById("inSkills")` in `app.js` |
| HTML `class` → CSS selector | `<div class="opp-card">` ↔ `.opp-card{...}` in `styles.css` |
| JS toggles a class → CSS reacts | JS adds `show` → the toast slides up; adds `active` → a filter chip turns violet |
| HTML `href="#demo"` → section `id="demo"` | Every navbar "tab" is just an anchor link to a section id |

### 2.3 ⚠️ The honest part — say this if the professor asks "where is your backend?"

> *"Professor, this is the **front-end prototype** of the system. To make the demo work anywhere — even by double-clicking the HTML file, with no server installed — I have implemented the three backend responsibilities **inside the browser** in `app.js`: the data as a JavaScript array, the AI matching as a scoring function, and persistence with `localStorage`. The project's intended **production architecture** is shown in the Tech Stack section of the website: a Python **Flask/FastAPI** backend, **SQLite/MySQL** storage and **scikit-learn / sentence-transformers** for semantic matching. Section 6 of this document maps every simulated piece to its real production equivalent, with a sample Flask implementation."*

That answer is safe and strong: you show you know exactly what a backend is, why you simulated it, and how you would build it for real.

---

## 3. Front-end Part 1 — `index.html` (the structure)

Every region in the file is wrapped in a `<!-- ===== SECTION ... ===== -->` comment banner, so any part can be found instantly with Ctrl+F.

### 3.1 `<head>` (lines 1–17)

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
- **charset** — declares UTF-8 so emoji and special characters render correctly.
- **viewport** — the single most important tag for mobile: tells the phone browser to use the device's real pixel width (otherwise the page renders as a zoomed-out desktop page).
- **meta description** — used by search engines; also signals that this is a real, complete project.
- **Favicon** — an *inline SVG data-URI* (a 🤖 emoji rendered by SVG). Why? A `<link rel="icon">` pointing to a missing file produces a 404 console error; inlining it removes the 404 with zero extra files.
- **Fonts** — Google Fonts loads **Inter** (body text) and **Sora** (headings), with `preconnect` to speed up the connection. If the internet is unavailable the browser silently falls back to system fonts — the site never breaks.

### 3.2 Navbar (lines 19–38) — `nav.nav`

```html
<nav class="nav">
  <a class="brand" href="#top">…CampusAgent…</a>
  <button class="nav-toggle" id="navToggle" aria-label="Open menu"
          aria-expanded="false" aria-controls="navLinks">…3 spans…</button>
  <div class="nav-links" id="navLinks">
    <a href="#problem">Problem</a> <a href="#aim">Aim</a> … (7 links)
  </div>
  <a href="#demo" class="btn btn-primary btn-sm">Try Demo</a>
</nav>
```

- `position: sticky` (in CSS) keeps this bar glued to the top while scrolling — it is the site's tab bar.
- The 7 links are **not real tabs** — each `href="#id"` is an anchor that, combined with `scroll-behavior: smooth`, makes the page *glide* to that section.
- `#navToggle` is the **hamburger button** (three `<span>` bars). Hidden on desktop; on screens ≤ 1000 px the CSS shows it and hides the link row. JavaScript toggles an `open` class and keeps `aria-expanded` in sync for screen readers.
- **ARIA attributes** (`aria-label`, `aria-expanded`, `aria-controls`) = accessibility: screen-reader users get "Open menu / Close menu" state announcements.

### 3.3 Hero (lines 41–115) — `header.hero#top`

Left column (`.hero-left`): the "PROJECT 3" pill, the big `h1` (the middle word "OPPORTUNITY" gets a pink→violet gradient via the `.grad` class), a "WHAT IT DOES" checklist, two CTA buttons, and a `.college-strip` with the college/dept/project details.

Right column (`.hero-right`): **four product mockups built 100 % with HTML + CSS — no image files exist anywhere in the project:**

| Mockup | Class | What it shows |
|---|---|---|
| Laptop | `.laptop` | A dashboard: 4 stat tiles (24 found, 7 applied, 8 deadlines, 68 %) and 3 opportunity rows |
| Notification | `.toast-card` | A floating white "2 deadlines approaching" card, gently bobbing via `@keyframes float` |
| Phone | `.phone` | "Upcoming Deadlines" list with "3 days / 5 days…" badges |
| Sticky note | `.todo-note` | A rotated to-do note with decorative checkboxes |

On desktop the phone, notification and note are `position: absolute` **over** the laptop; on small screens the media query switches them to normal flow so they **stack instead of overlapping** (a bug that was found and fixed).

### 3.4 The content sections

| Lines | Section | id | Content |
|---|---|---|---|
| 118–148 | **Problem vs Solution** | `#problem` | Two cards: red `!` card (scattered information, missed deadlines, poor matching) and green `✓` card with the 4-step flow "Tell Us → AI Searches → Personalized List → Take Action" |
| 151–167 | **Key Features** | `#features` | 6 feature cards (Smart Discovery, Deadline Tracker, Application Helper, Project Recommender, Opportunity Insights, All-in-One Dashboard) — pure HTML, no JS needed |
| 170–197 | **Aim + Objectives** | `#aim` | Numbered "02 / 03" cards: 4 aim points (green ✓ added by CSS `::before`, not typed) and 4 objective tiles (Discover, Personalize, Prioritize, Remind) |
| 200–225 | **How It Works** | `#how` | 4 numbered step cards joined by arrows + a 5-stage **technical pipeline**: Student Profile → Opportunity Sources → Data Processing → AI Matching → Dashboard |
| 282–297 | **Tech Stack** | `#tech` | 6 tiles: Python, HTML+CSS, JavaScript, Flask/FastAPI, SQLite/MySQL, AI/ML (scikit-learn / sentence-transformers) |
| 300–314 | **Why It's Innovative** | `#innov` | 5 cards + gradient slogan banner (extra content, deliberately not in the navbar) |
| 317–331 | **Future Scope** | `#future` | 6 tiles: real-time monitoring, mobile app, resume-based matching, application automation, voice AI, campus integration |
| 333–339 | **Footer** | — | Project credit + "Back to top ↑" |

### 3.5 ⭐ The Live Demo section (lines 228–279) — `#demo`

This is the **only interactive part** of the whole site. Three `.card`s sit in a `.demo-grid`:

**Card 1 — "Your Profile" (inputs):**
```html
<input id="inSkills" value="python, web, ml">        ← skills, comma separated
<select id="inInterest">…all/coding/internship/scholarship/contest…</select>
<button id="btnMatch">✨ Get My Recommendations</button>
<div id="reminders"></div>                            ← JS fills the deadline alerts here
```

**Card 2 — "Recommended For You" (results):**
```html
<span id="matchCount" class="count"></span>           ← JS writes "N found"
<div class="filters"> 5 <button data-f="…"> chips </div>
<div id="oppList" class="opp-list"></div>             ← JS writes the result cards here
```

**Card 3 — "My Applications & To-Do":**
```html
<div id="savedList" class="saved-list"></div>         ← JS writes saved items here
<input id="todoInput" placeholder="e.g. Update resume">
<button id="todoAdd" class="btn btn-primary btn-sm">Add</button>
<ul id="todoList"></ul>                               ← JS writes to-do tasks here
```

**Key observation to state to the professor:** the containers (`#oppList`, `#savedList`, `#todoList`, `#reminders`) are **empty in the HTML on purpose**. JavaScript fills them at run time. That is the classic front-end pattern: *static skeleton in HTML, dynamic content from the logic layer.*

### 3.6 Toast + script loading (lines 341–343)

```html
<div id="toast" class="toast"></div>
<script src="app.js"></script>
```
- `#toast` is the small pop-up message bar (e.g. "Saved: …") that appears at the bottom of the screen.
- **The `<script>` tag is deliberately the very last element in `<body>`.** Reason: the script runs top-to-bottom as soon as the browser reaches it; because it is last, every element above it already exists in the DOM — so `document.getElementById("oppList")` can never return `null`. (The alternative, putting the script in `<head>`, would require a `DOMContentLoaded` listener. Placing it last is the simplest, most robust choice for a no-framework site.)

**Complete id inventory (each appears exactly once in the file — verified):**
`top, problem, aim, features, how, demo, tech, future, innov, navToggle, navLinks, inSkills, inInterest, btnMatch, reminders, matchCount, oppList, savedList, todoInput, todoAdd, todoList, toast`

---

## 4. Front-end Part 2 — `styles.css` (the appearance)

The file is organised into **9 numbered, commented blocks**. Explanation of each:

### Block 1 — Design tokens (lines 8–10)
```css
*{ box-sizing:border-box; margin:0; padding:0 }
:root{ --bg:#070b16; --card:#111a30; --vio:#8b5cf6; --pink:#ec4899; … 14 variables }
```
- `:root` holds **14 CSS custom properties** (the "design tokens"): every colour in the site is a variable. Change `--vio` in one place and the whole theme follows — this is the standard way professional CSS themes are organised.
- `box-sizing: border-box` makes padding count *inside* the declared width, so layout math never breaks.
- The reset (`margin:0; padding:0`) removes browser default spacing.

### Block 2 — Base (lines 12–21)
```css
html{ scroll-behavior:smooth }
section[id], header[id]{ scroll-margin-top:76px }
```
Two lines that fix the two most common "tab navigation" bugs:
- **`scroll-behavior: smooth`** — clicking a navbar tab makes the page *glide* instead of jump.
- **`scroll-margin-top: 76px`** — 76 px is exactly the sticky navbar's height. Without this, every scroll target hides *under* the navbar and the section title is covered. With it, the browser stops 76 px early and every tab lands perfectly.
- `.grad` — the gradient-text trick: paint a gradient as background, then `background-clip: text` + `color: transparent` so only the text shape shows the gradient.
- `:focus-visible{ outline: 2px solid var(--vio) }` — keyboard users (Tab key) always see a violet focus ring. Accessibility.

### Block 3 — Nav (lines 23–41)
- Sticky translucent bar: `position:sticky; top:0` + `backdrop-filter: blur(12px)` (with the `-webkit-` prefix for Safari) = the modern "frosted glass" effect.
- `.nav-links a.active` — white text + violet glow. **This class is toggled by JavaScript's scrollspy**, so the tab for the section you are currently looking at is always highlighted.
- `.nav-toggle span` morphing: when JS sets `aria-expanded="true"`, three CSS transform rules rotate the three bars into an ✕. The animation is **pure CSS, driven by an HTML attribute** — a clean pattern worth mentioning.

### Block 4 — Buttons (lines 37–42)
`.btn` base, `.btn-primary` (violet→pink gradient + soft glow shadow), `.btn-ghost` (outline style), `.btn-sm` (small variant). All interactive things in the demo reuse these classes.

### Block 5 — Hero (lines 44–73)
Everything in the hero, including the 4 mockups:
- `.hero-bg` paints three soft colour glows using `radial-gradient()` layers — no background image needed.
- `.laptop / .laptop-base` build the laptop out of two divs; the screen contains the fake dashboard.
- `.toast-card`, `.phone`, `.todo-note` are `position:absolute` positioned over the laptop on desktop; `@keyframes float` gives the notification card a gentle up/down bob (`translateY(0) → -8px → 0`, 4 s loop, infinite).

### Block 6 — Generic sections (lines 75–103)
Shared building blocks reused by every section: `.sec-title` / `.sec-sub` headings, `.card` (dark card with 1 px border and 16 px radius), the problem/solution grid, the 6-column feature grid (cards **lift 4 px on hover** — a `transform` + colour transition), the aim cards (the ✓ is injected by CSS `li::before{content:"✓ "}`), the objective 2×2 grid, the 4 step cards with gradient number circles and `.arrow` divs, and the 5-column `.pipeline`.

### Block 7 — Live demo dashboard (lines 105–138)
All demo styling:
- `.card input, .card select` — dark full-width inputs with the theme border.
- `.filters button` pill chips + `.filters button.active` (violet background) — the selected chip's look is entirely class-driven; JS only swaps the class.
- `.opp-list{ max-height:460px; overflow:auto }` — the results scroll **inside** the card so the page layout doesn't jump as the list grows/shrinks.
- `.opp-card` (one result card), `.tag` (type pill), `.match` (green "% match"), `.reminder-box` (amber-tinted alert box), `.saved-item` (with red ✕ button), `#todoList li` (checkbox + text + ✕) and `li.done span{ text-decoration: line-through }` — the strikethrough of a completed task is CSS reacting to a class that JS toggles.

### Block 8 — Footer + toast (lines 140–144)
```css
.toast{ position:fixed; bottom:24px; left:50%;
        transform: translate(-50%, 80px); opacity:0; transition:.3s }
.toast.show{ opacity:1; transform: translate(-50%, 0) }
```
The toast is **fixed** (stays put while the page scrolls), hidden below the screen edge and invisible; JS adds `.show` and the CSS transition slides + fades it in. Removal of the class plays the same transition in reverse. Classic technique: *animation in CSS, trigger in JS.*

### Block 9 — Responsive (lines 146–178) — three tiers
| Breakpoint | What changes | Why |
|---|---|---|
| **≤ 1000 px** (tablets) | Hamburger appears; the 7 tabs become a **dropdown panel** (`.nav-links.open`); all multi-column grids collapse to 1–2 columns; hero mockups switch `position:absolute → static` so they **stack**; step arrows rotate 90° | At this width the horizontal tab row no longer fits |
| **≤ 560 px** (phones) | `h1` shrinks 56 px → 42 px → 34 px; feature/tech/future grids → 1–2 columns; dashboard stats 4 → 2 columns; footer stacks and centers | Phone ergonomics |
| **`prefers-reduced-motion`** | All animations, transitions and smooth scrolling are disabled | Accessibility: respects the user's OS setting for reduced motion |

---

## 5. Front-end Part 3 — `app.js` (the behaviour + data + "AI")

The file opens with a map comment (§1–§9). It runs top-to-bottom; because it is loaded at the end of `<body>`, all elements exist.

### §1 DATA (lines 17–33) — the database

```js
const OPPORTUNITIES = [
  { title:"Smart India Hackathon 2024", type:"hackathon", interest:"coding",
    org:"Govt. of India", deadline:"2024-02-28", days:3,
    skills:["python","web","ml","coding"],
    desc:"India's biggest hackathon. Build real solutions with mentorship." },
  … // 10 records in total
];
```

This is a **JavaScript array of 10 objects = a database table with 8 columns**:

| Field | Purpose | Consumed by |
|---|---|---|
| `title` | display name; also the identity used when saving | cards, saved list |
| `type` | `hackathon / internship / scholarship / contest` | the 5 filter chips (`data-f`) |
| `interest` | `coding / internship / scholarship / contest` | the Interest dropdown |
| `org` | organising body | card meta line |
| `deadline` | ISO date string, for display | card meta line |
| `days` | days until deadline — a *computed* number kept per record | reminders, "N days left" |
| `skills[]` | skill tags — the matching input | `matchScore()` |
| `desc` | one-line description | card body |

**Key point:** to add, remove or change any opportunity you edit *only this array* — every list, count, reminder and save is derived from it. That is "single source of truth" design.

The 10 records, for reference:

| # | Title | type | days | skills |
|---|---|---|---|---|
| 1 | Smart India Hackathon 2024 | hackathon | 3 | python, web, ml, coding |
| 2 | Google Summer of Code | internship | 12 | python, coding, web, ml |
| 3 | Microsoft Engage '24 | internship | 20 | web, coding, ml |
| 4 | Adobe India Hackathon | hackathon | 20 | web, design, coding |
| 5 | MLH Fellowship | internship | 5 | python, ml, web |
| 6 | INSPIRE Scholarship | scholarship | 45 | science, ml |
| 7 | Tata Imagination Challenge | contest | 9 | coding, web, design |
| 8 | Flipkart GRiD Hackathon | hackathon | 14 | ml, python, web |
| 9 | Google Generation Scholarship | scholarship | 16 | coding, web |
| 10 | CodeChef SnackDown | contest | 11 | coding, python |

### §2 STATE (lines 35–60) — variables + persistence

```js
let activeFilter = "all";              // which filter chip is selected
let saved  = load("ca_saved", []);     // titles of saved opportunities
let todos  = load("ca_todos", null)    // to-do tasks
  || [ {text:"Update Resume", done:false}, … 3 default tasks ];

function load(key, fallback){
  try{
    const v = JSON.parse(localStorage.getItem(key));
    return v === null ? fallback : v;
  } catch(e){ return fallback; }
}
function persist(){
  try{
    localStorage.setItem("ca_saved", JSON.stringify(saved));
    localStorage.setItem("ca_todos", JSON.stringify(todos));
  }catch(e){ /* storage blocked (private mode, file://) — demo still works */ }
}
```

- `activeFilter` = the currently selected chip (`"all"`, `"hackathon"`, …).
- `saved` / `todos` = **in-memory state, synchronised with `localStorage`** (the browser's permanent key-value store, per browser+site). On page load, `load()` restores them; on every change, `persist()` writes them back. **That is why your saved applications and to-dos survive a page refresh.**
- The `try/catch` is defensive: if storage is blocked, the app silently falls back to in-memory only and nothing breaks.
- Then five one-time element handles are grabbed (lines 56–60): `oppList`, `savedList`, `matchCount`, `reminders`, `toast` — the five containers the script paints into.

### §3 HELPERS (lines 62–77)

```js
function esc(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
```
**`esc()` = the XSS shield.** Before any user-typed text (e.g. a to-do) is inserted into HTML, the five special characters are converted to harmless HTML entities. Without it, typing `<img src=x onerror=alert(1)>` as a to-do would execute script; with it, the text is shown *as text*. This is the standard mitigation for **cross-site scripting (XSS)**.

```js
let toastTimer;
function showToast(msg){
  toast.textContent = msg;                 // textContent → cannot inject HTML at all
  toast.classList.add("show");
  clearTimeout(toastTimer);                // kills the previous timer
  toastTimer = setTimeout(()=>toast.classList.remove("show"), 2600);
}
```
Shows a toast for 2.6 s. `clearTimeout` on each call fixes a classic bug where a second message within 2.6 s would leave the first one stuck on screen. (Note `textContent` vs `innerHTML` — `textContent` needs no escaping, which is another safety habit.)

### §4 MATCHING (lines 79–87) — the "AI"

```js
function matchScore(o, skills){
  if(!skills.length) return 70;                       // no profile → neutral score
  const hit = o.skills.filter(s => skills.includes(s)).length; // count overlapping skills
  return Math.min(98, 55 + hit*15);                   // 55 base + 15 per hit, cap 98
}
```

This is a **weighted overlap (Jaccard-style) relevance model**, simplified for the demo:

- base 55 (an opportunity is never scored 0 — it's still relevant to some student)
- +15 for every skill the user listed that the opportunity also requires
- capped at 98 (never claim 100 % certainty)
- empty profile → neutral 70

**Worked example — user types `python, web, ml`:**

| Opportunity | Overlap with [python, web, ml] | Score |
|---|---|---|
| Smart India Hackathon (python, web, ml, coding) | 3 | min(98, 55+45) = **98** |
| Google Summer of Code (python, coding, web, ml) | 3 | **98** |
| Microsoft Engage (web, coding, ml) | 2 | **85** |
| Adobe India Hackathon (web, design, coding) | 1 | **70** |
| CodeChef SnackDown (coding, python) | 1 | **70** |

So the demo's answer to "which hackathons fit `python, web, ml`?" is: **98 %, 98 %, 85 % …** — exactly what appears on screen, best match first.

> If the professor asks *"is this real AI?"* — the honest answer: this is a **deterministic rule-based scorer that stands in for the ML model**, so the demo runs with no server and no dependencies. The production design (stated in the Tech Stack section) replaces this function with **semantic matching** — embedding the opportunity text and the student profile with a model like `sentence-transformers`, computing cosine similarity, and combining it with eligibility and deadline rules. The architecture (profile → matching engine → ranked list) is identical; only the engine changes from a few lines of JavaScript to a Python model endpoint.

### §5 RENDER (lines 89–122) — the heart of the app

```js
function render(){
  // 1) READ the profile
  const skillTxt = document.getElementById("inSkills").value.toLowerCase();
  const skills = skillTxt.split(",").map(s=>s.trim()).filter(Boolean);
  const interest = document.getElementById("inInterest").value;

  // 2) SCORE, FILTER, SORT
  let items = OPPORTUNITIES
    .map((o, idx) => ({...o, idx, score: matchScore(o, skills)}))
    .filter(o =>
      (activeFilter==="all" || o.type === activeFilter) &&
      (interest === "all"  || o.interest === interest))
    .sort((a,b) => b.score - a.score);

  // 3) PAINT the results
  matchCount.textContent = items.length + " found";
  oppList.innerHTML = items.map(o => `
    <div class="opp-card">
      <h4>${esc(o.title)}</h4>
      <div class="meta">${esc(o.org)} · ⏳ ${o.days} days left · Deadline ${o.deadline}</div>
      <div class="meta">${esc(o.desc)}</div>
      <div class="row">
        <span class="tag">${o.type}</span>
        <span class="match">✨ ${o.score}% match</span>
        <button class="btn btn-primary btn-sm"
                onclick="saveOppByIndex(${o.idx})">Save</button>
      </div>
    </div>`).join("")
    || `<p class="muted">No opportunities match this filter.</p>`;

  // 4) PAINT reminders: 3 soonest deadlines within 12 days
  const urgent = OPPORTUNITIES.filter(o => o.days <= 12)
    .sort((a,b) => a.days - b.days).slice(0, 3);
  reminders.innerHTML =
    urgent.map(o => `⏰ <b>${esc(o.title)}</b> — ${o.days} days left (${o.deadline})`)
    .join("<br>");
}
```

`render()` is a **4-stage pipeline**, and it is the function that answers any question about "how does the recommendation work":

1. **READ** — take the skills string, lowercase it, split on commas, trim each piece, drop empties (`.filter(Boolean)`). Take the dropdown value.
2. **SCORE + FILTER + SORT** — a functional chain:
   - `.map` attaches each record's `score` (and its original index `idx`, needed later for Save)
   - `.filter` keeps records passing **both** conditions: the selected chip (`type`) **and** the selected dropdown (`interest`)
   - `.sort` orders by score, descending → best match first
3. **PAINT** — each record becomes an HTML card via a **template literal** (back-tick string with `${}` interpolation); `esc()` is applied to every text field; the empty result falls back to a friendly "No opportunities match this filter" message (the `||` operator). The `Save` button's inline `onclick` calls `saveOppByIndex` with the record's *original index* — that is how a freshly-rendered DOM element can point back to the correct data record.
4. **REMINDERS** — independent of the filters: pick records with `days ≤ 12`, sort ascending, take the first 3, paint them. With the sample data the alerts are: SIH (3 days), MLH Fellowship (5 days), Tata Challenge (9 days).

Every time anything changes (button click, chip click, dropdown change) the app simply calls `render()` again — the list is fully re-derived from the data. This "state in variables → re-render everything" pattern is the same idea behind React/Vue; here it is written in plain JavaScript.

**Filter counts with the sample data (useful if the professor checks):** All = 10, Hackathons = 3, Internships = 3, Scholarships = 2, Contests = 2.

### §6 SAVE / REMOVE (lines 124–147)

```js
function saveOppByIndex(idx){
  const o = OPPORTUNITIES[idx];
  if(!o){ showToast("Opportunity not found."); return; }        // bad index guard
  if(saved.includes(o.title)){ showToast("Already in your list ✓"); return; } // no duplicates
  saved.push(o.title);
  persist();            // write to localStorage
  renderSaved();        // repaint card 3
  showToast(`Saved: ${o.title}`);
}
```
- **Save** = three guarantees: no crash on a bad index, no silent duplicates, and immediate feedback (toast) + persistence + repaint.
- **Remove** (`removeOppByIndex`) filters the title out of `saved`, persists, repaints.
- **`renderSaved()`** repaints card 3: if empty it shows the hint "Nothing saved yet…", otherwise one `.saved-item` row per saved opportunity — with its deadline and a ✕ button whose `onclick="removeOppByIndex(idx)"` re-finds the record index by title (`findIndex`).

### §7 TO-DO APP (lines 149–182)

```js
function createTodoEl(t){
  const li = document.createElement("li");
  li.innerHTML = `<input type="checkbox"${t.done ? " checked" : ""}>
                  <span>${esc(t.text)}</span>
                  <button aria-label="Delete task">✕</button>`;
  const box = li.querySelector("input");
  li.classList.toggle("done", t.done);
  box.onchange = ()=>{ t.done = box.checked;
                       li.classList.toggle("done", t.done); persist(); };
  li.querySelector("button").onclick = ()=>{
    todos = todos.filter(x => x !== t); persist(); li.remove(); };
  todoList.appendChild(li);
}
```

- `createTodoEl(task)` builds **one list item per task**: a checkbox, the (escaped) text, and a delete ✕.
- Ticking the checkbox toggles the `done` class → CSS `text-decoration: line-through` → and updates the data object + localStorage. **UI, data and storage always stay in sync.**
- Delete removes the *object reference* from `todos` (so the matching task is removed from storage too), persists, and removes the DOM node.
- `addTodo(text)` trims, rejects empty input, creates `{text, done:false}`, persists and appends.
- Wiring: the **Add button** and the **Enter key** in the input both call it (`todoInput` listens for `keydown` and simulates a click on the button when Enter is pressed).
- On page load, `todos.forEach(createTodoEl)` paints the persisted (or default) tasks — so to-dos reappear after refresh.

### §8 FILTER BUTTONS + MATCH BUTTON (lines 184–202)

```js
document.querySelectorAll(".filters button").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".filters button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");          // move the violet highlight
    activeFilter = b.dataset.f;         // read the chip's data-f attribute
    render();                           // re-derive the list
  };
});
document.getElementById("btnMatch").onclick = () => {
  render();
  showToast("✨ Recommendations updated for your profile!");
};
document.getElementById("inInterest").addEventListener("change", render);
```

- Each chip carries its filter value in a **`data-f` attribute** (`data-f="hackathon"`); reading `b.dataset.f` means one generic handler works for all 5 chips — no copy-pasted code.
- The **Interest dropdown re-renders instantly on change** (an enhancement: previously it did nothing until the button was pressed).

### §9 NAVIGATION (lines 204–238)

**a) Hamburger menu**
```js
navToggle.onclick = () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
```
Toggles the `.open` class (CSS shows the dropdown panel) and keeps the ARIA attributes honest; tapping any tab closes the menu again.

**b) Scrollspy**
```js
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting){
      navAnchors.forEach(a => a.classList.remove("active"));
      const link = anchorById[e.target.id];
      if(link) link.classList.add("active");
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
```
- `IntersectionObserver` is a **built-in browser API** (no polling, no scroll-event spam) that tells you when elements enter/leave the viewport.
- The `rootMargin: -40% 0px -55% 0px` trick shrinks the "active zone" to a ~5 % horizontal band across the **middle of the screen** — so the highlighted tab is the section you are actually reading, not whatever just crossed the top edge.
- The 7 section elements are observed; the anchor whose `href` matches the entering section's `id` gets `.active` (the violet glow in the navbar).
- Guarded by `if("IntersectionObserver" in window)` — very old browsers simply skip the feature instead of erroring.

### INIT (lines 240–244)
```js
renderSaved();
render();
setTimeout(() => showToast("👋 Hey Rahul! 2 deadlines approaching soon!"), 1200);
```
On load: repaint saved items (from storage), paint the recommendation list, and — after 1.2 s — fire the demo notification toast so the "smart reminder" feature is visible immediately.

---

## 6. The "backend" in depth

### 6.1 What a backend normally does, and where it lives here

| Backend responsibility | In a production system | In this project (client-side) | Where |
|---|---|---|---|
| **Data storage** of opportunities | SQL database (SQLite/MySQL), tables `opportunities`, `profiles`, `applications` | JavaScript array of 10 objects | `app.js` §1, `OPPORTUNITIES` |
| **User data** (saved apps, to-dos) | DB rows per user, fetched/stored via API | `localStorage` keys `ca_saved`, `ca_todos` | `app.js` §2, `load()`/`persist()` |
| **AI matching engine** | Python service: embeddings (sentence-transformers) + cosine similarity + eligibility/deadline rules, exposed as a REST endpoint | `matchScore()` — weighted skill-overlap score, 55 + 15·hits, cap 98 | `app.js` §4 |
| **API / request handling** | Flask/FastAPI routes: `GET /api/opportunities?skills=…`, `POST /api/save` | The demo "requests" are direct function calls in the same file | `app.js` §5–§8 |
| **Reminders / alerts** | Scheduled job (cron) that scans deadlines and sends push/email | `render()` computes the 3 most urgent (`days ≤ 12`) on every draw | `app.js` §5 |

**Why simulate it in the browser (the design rationale):**
1. The demo must run **anywhere, instantly** — double-click the file, no installation. Perfect for a viva.
2. It keeps the whole system **testable as a unit**: every rule (scoring, filtering, persistence) is a plain function that can be checked directly.
3. The front-end ↔ back-end **contract is unchanged**: in production the same UI would call `fetch("/api/match", …)` and paint the returned JSON. Only the source of the data moves from "an array next door" to "a server across the wire".

### 6.2 What the real backend would look like (ready to show if asked)

```python
# server.py — production version of the same contract
from fastapi import FastAPI
import sqlite3, json
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")   # semantic model

@app.get("/api/match")
def match(skills: str, interest: str = "all"):
    user_vec = model.encode(skills)               # embed the student profile
    rows = sqlite3.connect("campus.db").execute(
        "SELECT * FROM opportunities WHERE interest IN (?, 'all')", (interest,)).fetchall()
    scored = []
    for o in rows:
        opp_vec = model.encode(o["title"] + " " + o["desc"] + " " + o["skills"])
        score  = 55 + 43 * cosine(user_vec, opp_vec)     # semantic similarity
        if any(s in o["skills"] for s in skills.split(",")):
            score += 15                                   # bonus for explicit skill hits
        scored.append({**o, "score": min(98, round(score))})
    scored.sort(key=lambda r: -r["score"])
    return {"items": scored}     # ← the front-end paints exactly this, as it paints the array today

@app.post("/api/save")
def save(payload: dict):
    sqlite3.connect("campus.db").execute(
        "INSERT INTO applications(student, opportunity) VALUES(?, ?)",
        (payload["student"], payload["opportunity"]))
    return {"ok": True}
```
The JavaScript would change by **exactly one line of concept**: `const items = await (await fetch("/api/match?skills=" + skills)).json()` instead of scoring the local array. Everything the UI does — sorting, cards, toasts, persistence of *user* state — stays identical.

### 6.3 Security & robustness decisions worth stating

| Decision | Code | Why it matters |
|---|---|---|
| **XSS escaping** of all user text | `esc()` applied to every user-supplied field; `textContent` for the toast | Typing `<script>` or `<img onerror=…>` is displayed as text, never executed |
| **Safe persistence** | `load()/persist()` wrapped in `try/catch` | Private browsing / blocked storage can't crash the app |
| **Input validation** | `addTodo` trims and rejects empty text; `saveOppByIndex` guards bad indices | No empty rows, no wrong messages |
| **No duplicate ids** | Verified: every `id` in `index.html` is unique | `getElementById` can never grab the wrong element |
| **Graceful degradation** | Fonts fall back to system fonts; `IntersectionObserver` guarded | Works offline (except fonts) and in old browsers |
| **Accessibility** | ARIA attributes, `:focus-visible` outlines, `prefers-reduced-motion` | Screen-reader, keyboard and reduced-motion users all supported |

---

## 7. Two complete end-to-end data flows (trace these in front of the professor)

### Flow A — Page load
```
Browser requests index.html
  → head: CSS + fonts load
  → body: all sections + empty demo containers appear
  → app.js executes:
      §2  load() reads ca_saved / ca_todos from localStorage
      init renderSaved()  → card 3 shows your saved items (from last visit)
      init render()       → card 2 shows 10 scored cards (neutral 70 % or
                             previous skills), card 1 shows 3 urgent reminders
      init 1.2 s later    → welcome toast slides up
```

### Flow B — User saves an opportunity
```
User clicks "Save" on a card
  → inline onclick="saveOppByIndex(5)" fires          (idx = original record index)
  → guard: does record exist?  yes
  → guard: already saved?      no
  → saved.push("MLH Fellowship")                      (state updated)
  → persist() → localStorage.ca_saved = JSON           (will survive refresh)
  → renderSaved() → card 3 repaints with the new row + deadline
  → showToast("Saved: MLH Fellowship") → .show class → toast slides up 2.6 s
User refreshes the page
  → load("ca_saved") restores the list → the item is still there ✓
```

### Flow C — User changes filters
```
User clicks the "Hackathons" chip
  → handler: remove .active from all chips, add it to this one
  → activeFilter = "hackathon"
  → render():
      map (score all 10 with current skills)
      filter (type==="hackathon" AND interest)      → 3 records remain
      sort (by score desc)
      paint 3 cards into #oppList, badge says "3 found"
```

---

## 8. How to run and demo it (2-minute script for the viva)

**Run:** double-click `website/index.html` — or, properly:
```bash
cd website
python3 -m http.server 8080     # → open http://localhost:8080
```

**Demo script (≈2 minutes, covers every feature):**
1. Open the site. Click through the navbar tabs — point out they *glide* and the **active tab highlights** as you scroll (scrollspy).
2. Go to **Live Demo**. The skills field already contains `python, web, ml`.
3. Press **✨ Get My Recommendations** → list re-scores and re-sorts (98 %, 98 %, 85 %…).
4. Click the **Hackathons** chip → list narrows to 3; the chip turns violet.
5. Change the Interest dropdown → the list filters **instantly** without pressing the button.
6. **Save** one opportunity → toast "Saved: …" → it appears in Card 3 with its deadline. Try saving it again → "Already in your list ✓" (no duplicates).
7. Card 1 shows the **3 deadline reminders** (SIH 3 days, MLH 5 days, Tata 9 days).
8. Add a to-do with the **Enter key** → tick it (strikethrough) → delete one with ✕.
9. **Refresh the page** → saved items and to-dos are still there (localStorage).
10. Shrink the window to phone width → the **hamburger menu** appears and works; mockups stack instead of overlapping.
11. *(Bonus if asked about security)* type `<img onerror=alert(1)>` into the to-do box → it shows up as harmless plain text (XSS blocked).

---

## 9. Glossary (terms the professor may expect you to know)

| Term | Meaning in plain words |
|---|---|
| **DOM** | The tree of objects the browser builds from the HTML; JS reads and modifies it |
| **SPA (single-page app)** | One page; content changes without full page reloads (this site is a 1-page layout with a live dashboard) |
| **Front end / back end** | UI layer the user sees / server-side layer that stores data and runs logic |
| **API (REST)** | Standard ways for the front end to ask the back end for data (`GET /api/match`) |
| **`localStorage`** | Browser key-value storage that survives refresh; per site, no server needed |
| **XSS** | Attack where user input is injected as executable HTML/JS; defended against here by escaping |
| **Template literal** | Back-tick string with `${}` placeholders — how JS builds HTML strings |
| **Callback / event handler** | A function the browser calls when something happens (click, key, change) |
| **IntersectionObserver** | Browser API that reports when elements enter the viewport — used for the scrollspy |
| **Media query** | CSS that applies only at certain screen widths (1000 px, 560 px) |
| **CSS variables (custom properties)** | Named design tokens in `:root` — the theme palette |
| **`position: sticky / fixed / absolute`** | Ways of pinning elements: sticks in scroll, fixed to viewport, placed over the flow |
| **@keyframes** | CSS animation definition (the floating notification card) |
| **Semantic HTML** | Meaningful tags (`<nav>`, `<section>`, `<header>`) — good for structure and accessibility |
| **ARIA** | Extra HTML attributes that announce state (e.g. `aria-expanded`) to screen readers |
| **Jaccard / overlap similarity** | Compare two sets by shared members — the idea behind the demo's matching score |
| **Embeddings / cosine similarity** | Represent text as vectors and measure angle between them — the production matching idea (sentence-transformers) |
| **State → render** | Keep the truth in variables; whenever state changes, re-draw the affected UI |
| **Escaping / encoding** | Converting `<` to `&lt;` etc. so text can't be misread as markup |
| **Graceful degradation** | The app keeps working (slightly reduced) when a feature is unavailable (offline fonts, blocked storage, old browser) |

---

## 10. Feature checklist — what the code demonstrably does

- ✅ Sticky navbar, 7 smooth-scrolling tabs, **scrollspy** highlighting, mobile hamburger + ARIA
- ✅ Hero with 4 **pure CSS/HTML product mockups** (zero image files)
- ✅ Live demo: profile input → **ranked % match list** → 5 filter chips → interest dropdown (instant) → save/remove applications → 3 most-urgent **deadline reminders** → to-do list (add via button *and* Enter, tick, delete)
- ✅ **Persistence** across refresh (`localStorage`, safe fallback when blocked)
- ✅ **XSS-safe** user input (escaping + `textContent`)
- ✅ Responsive at 1000 px and 560 px; `prefers-reduced-motion` respected
- ✅ Zero frameworks, zero build step, works offline (fonts fall back)

---

## 11. Professor Q&A — likely questions with ready answers

**Q1. "Where is your backend?"**
> This is the front-end prototype. The three backend jobs — data, matching, persistence — are implemented client-side in `app.js` (array = table, `matchScore()` = engine, `localStorage` = storage) so the demo runs with no server. The production design is Flask/FastAPI + SQLite/MySQL + scikit-learn, and the UI would change by only one concept: fetch JSON from an endpoint instead of scoring a local array. (Show Section 6.2 of this document / the sample endpoint.)

**Q2. "Is the matching 'real AI'?"**
> It's a transparent **rule-based relevance scorer** (55 base + 15 per matching skill, capped at 98) deliberately kept simple so the demo is deterministic and serverless. The intended production matcher is **semantic**: embed the opportunity text and the student profile with sentence-transformers, score cosine similarity, add eligibility and deadline rules, and expose it as an API. Same architecture, stronger engine.

**Q3. "Why no framework — React, Angular, something?"**
> For a 3-file, single-page project with no build pipeline, vanilla JS is enough and keeps every line fully readable and auditable. The patterns I used — state variables, a single `render()` re-deriving the UI, `data-*` attributes driving generic handlers — are exactly the patterns frameworks automate. If the project scaled, React would buy me component state management; today it would add build complexity with no benefit.

**Q4. "Walk me through the matching function."**
> Read skills → split, lowercase, trim → for each opportunity count how many of the user's skills appear in its `skills` array → score = min(98, 55 + 15 × hits) → sort descending. Example: `python, web, ml` vs SIH (has all three) = 98 %.

**Q5. "How do the saved items survive a refresh?"**
> Every save/delete calls `persist()`, which JSON-serialises `saved` and `todos` into `localStorage` under keys `ca_saved` / `ca_todos`. On the next load, `load()` parses them back before the first render. Wrapped in try/catch so blocked storage degrades to in-memory only.

**Q6. "How did you prevent script injection?"**
> All user-typed text passes through `esc()` (converts `& < > " '` to entities) before entering HTML, and the toast uses `textContent`, which can never parse markup. Verified: `<img onerror=…>` renders as plain text.

**Q7. "How does the tab highlight (scrollspy) work?"**
> An `IntersectionObserver` watches the 7 section elements with a `rootMargin` that reduces the trigger zone to the middle of the screen; the nav link whose `href` matches the entering section's `id` gets the `.active` class. No scroll-event polling — it's event-driven and cheap.

**Q8. "Explain the responsive design."**
> Two width breakpoints. ≤ 1000 px: tab row becomes a hamburger dropdown, all grids collapse, hero mockups switch from `absolute` overlap to stacked flow. ≤ 560 px: smaller type, 1–2 column grids. Plus a `prefers-reduced-motion` block that disables all animation for users who ask for it in their OS.

**Q9. "How did you test it?"**
> Static audit (every `getElementById` target exists, no duplicate ids, every `href` resolves, every class JS toggles exists in CSS, `node --check` syntax clean) plus 44 automated end-to-end checks in a simulated browser (jsdom): zero JS errors, correct filter counts (10/3/3/2/2), save/duplicate/remove, to-do add via button and Enter, XSS blocked, hamburger ARIA, persistence written, toasts — and an HTTP smoke test (all files 200 OK).

**Q10. "What's the next step for this project?"**
> (From the Future Scope section) real-time source monitoring, mobile app with push notifications, resume-based skill extraction, application automation, a voice assistant, and integration with the college placement cell — plus replacing the rule-based scorer with the semantic model and moving the three client-side modules onto the Flask + SQLite backend described in Section 6.

---

*End of document. Study Sections 2, 5 (§4–§5), 6 and 11 first — they cover 90 % of what a viva asks. The rest lets you answer anything specific.*
