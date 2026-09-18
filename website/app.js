/* ==========================================================================
   AI Campus Opportunity Agent — demo dashboard logic (app.js)
   Loaded at the end of <body>, so every HTML element already exists.

   Map of this file (what is responsible for what):
     §1 DATA            : the sample opportunity database (10 items)
     §2 STATE           : active filter + saved list + to-dos (+ localStorage)
     §3 HELPERS         : esc() safety, showToast() pop-up messages
     §4 MATCHING        : matchScore() = the "AI" scoring for the demo
     §5 RENDER          : render() draws the recommendation list + reminders
     §6 SAVE / REMOVE   : saving opportunities into "My Applications"
     §7 TO-DO APP       : add / tick / delete tasks
     §8 FILTER BUTTONS  : All / Hackathons / Internships / ... chips
     §9 NAVIGATION      : hamburger menu (phones) + scrollspy tab highlight
   ========================================================================== */

/* ---------------- §1 DATA — sample opportunity database ----------------
   Each item: title, type (drives the filter chips), interest (drives the
   dropdown), org, deadline (display only), days (drives reminders & the
   "days left" text), skills (matched against the user's skill list),
   desc (shown on the card). Static sample data for the demo. */
const OPPORTUNITIES = [
  {title:"Smart India Hackathon 2024", type:"hackathon", interest:"coding", org:"Govt. of India", deadline:"2024-02-28", days:3, skills:["python","web","ml","coding"], desc:"India's biggest hackathon. Build real solutions with mentorship."},
  {title:"Google Summer of Code", type:"internship", interest:"internship", org:"Google", deadline:"2024-04-20", days:12, skills:["python","coding","web","ml"], desc:"Stipend-based open-source internship for students worldwide."},
  {title:"Microsoft Engage '24", type:"internship", interest:"internship", org:"Microsoft", deadline:"2024-05-10", days:20, skills:["web","coding","ml"], desc:"Mentorship program + internship opportunity for pre-final years."},
  {title:"Adobe India Hackathon", type:"hackathon", interest:"coding", org:"Adobe", deadline:"2024-06-12", days:20, skills:["web","design","coding"], desc:"Design + code hackathon with hiring opportunities."},
  {title:"MLH Fellowship", type:"internship", interest:"internship", org:"Major League Hacking", deadline:"2024-05-25", days:5, skills:["python","ml","web"], desc:"Remote open-source fellowship, stipend included."},
  {title:"INSPIRE Scholarship", type:"scholarship", interest:"scholarship", org:"DST India", deadline:"2024-07-31", days:45, skills:["science","ml"], desc:"₹80,000/year scholarship for top science students."},
  {title:"Tata Imagination Challenge", type:"contest", interest:"contest", org:"Tata Group", deadline:"2024-03-15", days:9, skills:["coding","web","design"], desc:"Business + tech case competition with PPO chances."},
  {title:"Flipkart GRiD Hackathon", type:"hackathon", interest:"coding", org:"Flipkart", deadline:"2024-04-05", days:14, skills:["ml","python","web"], desc:"E-commerce tech challenge with internships for winners."},
  {title:"Google Generation Scholarship", type:"scholarship", interest:"scholarship", org:"Google", deadline:"2024-05-01", days:16, skills:["coding","web"], desc:"Scholarship + community for women in tech."},
  {title:"CodeChef SnackDown", type:"contest", interest:"contest", org:"CodeChef", deadline:"2024-03-30", days:11, skills:["coding","python"], desc:"Global competitive programming contest."},
];

/* ---------------- §2 STATE ---------------- */
let activeFilter = "all";   // which filter chip is selected ("all" | "hackathon" | ...)
let saved = load("ca_saved", []);                    // titles of saved opportunities
let todos = load("ca_todos", null)                   // to-do tasks, persisted
  || [{text:"Update Resume", done:false}, {text:"Apply for SIH", done:false}, {text:"Work on Project", done:false}];

/* localStorage persistence — the saved list & to-dos survive a page refresh.
   Wrapped in try/catch so the site still works if storage is blocked
   (e.g. private mode or file:// restrictions). */
function load(key, fallback){
  try{ const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; }
  catch(e){ return fallback; }
}
function persist(){
  try{
    localStorage.setItem("ca_saved", JSON.stringify(saved));
    localStorage.setItem("ca_todos", JSON.stringify(todos));
  }catch(e){ /* storage unavailable — ignore, demo still works */ }
}

/* ---- element handles (each one matches an id in index.html) ---- */
const oppList   = document.getElementById("oppList");     // card 2: results list
const savedList = document.getElementById("savedList");   // card 3: saved items
const matchCount= document.getElementById("matchCount");  // card 2: "N found" badge
const reminders = document.getElementById("reminders");   // card 1: deadline reminders
const toast     = document.getElementById("toast");       // bottom pop-up message

/* ---------------- §3 HELPERS ---------------- */
/* esc() escapes HTML special characters so user-typed text (e.g. a to-do
   like "<script>" is shown as text instead of being executed). */
function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* showToast() slides the #toast bar up for 2.6 s. The timer is cleared on
   each new call so quick back-to-back messages don't cut each other short. */
let toastTimer;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"), 2600);
}

/* ---------------- §4 MATCHING — the demo "AI" ----------------
   Scores an opportunity against the user's skill list:
   each skill hit adds +15 points, starting from 55, capped at 98.
   With no skills entered it returns a neutral 70. */
function matchScore(o, skills){
  if(!skills.length) return 70;
  const hit = o.skills.filter(s=>skills.includes(s)).length;
  return Math.min(98, 55 + hit*15);
}

/* ---------------- §5 RENDER — draws card 1 reminders + card 2 results --
   1. read the profile inputs (#inSkills, #inInterest)
   2. score + filter every opportunity (type chip + interest dropdown)
   3. sort best match first and paint #oppList
   4. paint the 3 most urgent reminders (deadline <= 12 days) */
function render(){
  const skillTxt = document.getElementById("inSkills").value.toLowerCase();
  const skills = skillTxt.split(",").map(s=>s.trim()).filter(Boolean);
  const interest = document.getElementById("inInterest").value;

  let items = OPPORTUNITIES.map((o, idx)=>({...o, idx, score:matchScore(o,skills)}))
   .filter(o =>
    (activeFilter==="all" || o.type===activeFilter) &&
    (interest==="all" || o.interest===interest)
  )
   .sort((a,b)=>b.score-a.score);

  matchCount.textContent = items.length + " found";
  oppList.innerHTML = items.map((o)=>`
    <div class="opp-card">
      <h4>${esc(o.title)}</h4>
      <div class="meta">${esc(o.org)} · ⏳ ${o.days} days left · Deadline ${o.deadline}</div>
      <div class="meta">${esc(o.desc)}</div>
      <div class="row">
        <span class="tag">${o.type}</span>
        <span class="match">✨ ${o.score}% match</span>
        <button class="btn btn-primary btn-sm" onclick="saveOppByIndex(${o.idx})">Save</button>
      </div>
    </div>`).join("") || `<p class="muted">No opportunities match this filter.</p>`;

  // reminders: the 3 soonest deadlines that are <= 12 days away
  const urgent = OPPORTUNITIES.filter(o=>o.days<=12).sort((a,b)=>a.days-b.days).slice(0,3);
  reminders.innerHTML = urgent.map(o=>`⏰ <b>${esc(o.title)}</b> — ${o.days} days left (${o.deadline})`).join("<br>");
}

/* ---------------- §6 SAVE / REMOVE — "My Applications" (card 3) -------- */
function saveOppByIndex(idx){
  const o = OPPORTUNITIES[idx];
  if(!o){ showToast("Opportunity not found."); return; }          // FIX: was "Already saved!"
  if(saved.includes(o.title)){ showToast("Already in your list ✓"); return; }
  saved.push(o.title);
  persist();
  renderSaved();
  showToast(`Saved: ${o.title}`);
}
function removeOppByIndex(idx){
  const t = OPPORTUNITIES[idx] ? OPPORTUNITIES[idx].title : null;
  saved = saved.filter(x=>x!==t);
  persist();
  renderSaved();
}
function renderSaved(){
  if(!saved.length){ savedList.innerHTML = `<p class="muted">Nothing saved yet — click “Save” on any opportunity.</p>`; return; }
  savedList.innerHTML = saved.map(t=>{
    const idx = OPPORTUNITIES.findIndex(x=>x.title===t);
    const o = OPPORTUNITIES[idx];
    return `<div class="saved-item"><span>📌 ${esc(t)}<br><small style="color:var(--mut)">Deadline ${o ? o.deadline : ""}</small></span><button aria-label="Remove ${esc(t)}" onclick="removeOppByIndex(${idx})">✕</button></div>`;
  }).join("");
}

/* ---------------- §7 TO-DO APP (card 3) ---------------- */
const todoList  = document.getElementById("todoList");
const todoInput = document.getElementById("todoInput");
const todoAdd   = document.getElementById("todoAdd");

/* Builds one <li> for a task object {text, done}. The checkbox toggles the
   strikethrough, the ✕ button deletes. Both update localStorage. */
function createTodoEl(t){
  const li = document.createElement("li");
  li.innerHTML = `<input type="checkbox"${t.done ? " checked" : ""}><span>${esc(t.text)}</span><button aria-label="Delete task">✕</button>`;
  const box = li.querySelector("input");
  li.classList.toggle("done", t.done);
  box.onchange = ()=>{ t.done = box.checked; li.classList.toggle("done", t.done); persist(); };
  li.querySelector("button").onclick = ()=>{ todos = todos.filter(x=>x!==t); persist(); li.remove(); };
  todoList.appendChild(li);
}
function addTodo(text){
  text = text.trim();
  if(!text) return;
  const t = {text, done:false};
  todos.push(t);
  persist();
  createTodoEl(t);
}
/* paint the persisted (or default) tasks on load */
todos.forEach(createTodoEl);

/* "Add" button + pressing Enter inside the input both add a task */
todoAdd.onclick = ()=>{
  addTodo(todoInput.value);
  todoInput.value = "";
  showToast("Task added!");
};
todoInput.addEventListener("keydown", e=>{ if(e.key === "Enter") todoAdd.click(); });

/* ---------------- §8 FILTER CHIPS (card 2) ----------------
   Clicking a chip: moves the .active highlight, stores the choice in
   activeFilter, and re-renders the recommendation list. */
document.querySelectorAll(".filters button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll(".filters button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    activeFilter = b.dataset.f;
    render();
  };
});

/* "Get My Recommendations" button (card 1) */
document.getElementById("btnMatch").onclick = ()=>{
  render();
  showToast("✨ Recommendations updated for your profile!");
};
/* the Interest dropdown applies instantly too — no need to press the button */
document.getElementById("inInterest").addEventListener("change", render);

/* ---------------- §9 NAVIGATION ----------------
   a) Hamburger menu: on phones the tab list is hidden; this button toggles
      the .open class to show it as a dropdown, and closes it after a tap. */
const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");
navToggle.onclick = ()=>{
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
navLinks.querySelectorAll("a").forEach(a=>{
  a.onclick = ()=>{
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };
});

/* b) Scrollspy: as you scroll, the nav tab of the section currently on
   screen gets the .active highlight — so the "tabs" visually respond too. */
const navAnchors = [...document.querySelectorAll(".nav-links a")];
const anchorById = Object.fromEntries(navAnchors.map(a=>[a.getAttribute("href").slice(1), a]));
if("IntersectionObserver" in window){
  const spy = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        navAnchors.forEach(a=>a.classList.remove("active"));
        const link = anchorById[e.target.id];
        if(link) link.classList.add("active");
      }
    });
  }, {rootMargin:"-40% 0px -55% 0px"});
  Object.keys(anchorById).forEach(id=>{
    const el = document.getElementById(id);
    if(el) spy.observe(el);
  });
}

/* ---------------- INIT ---------------- */
renderSaved();
render();
setTimeout(()=>showToast("👋 Hey Rahul! 2 deadlines approaching soon!"), 1200);
