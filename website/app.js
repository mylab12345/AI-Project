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

let activeFilter = "all";
let saved = [];

const oppList = document.getElementById("oppList");
const savedList = document.getElementById("savedList");
const matchCount = document.getElementById("matchCount");
const reminders = document.getElementById("reminders");
const toast = document.getElementById("toast");

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 2600);
}

function matchScore(o, skills){
  if(!skills.length) return 70;
  const hit = o.skills.filter(s=>skills.includes(s)).length;
  return Math.min(98, 55 + hit*15);
}

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
      <h4>${o.title}</h4>
      <div class="meta">${o.org} · ⏳ ${o.days} days left · Deadline ${o.deadline}</div>
      <div class="meta">${o.desc}</div>
      <div class="row">
        <span class="tag">${o.type}</span>
        <span class="match">✨ ${o.score}% match</span>
        <button class="btn btn-primary btn-sm" onclick="saveOppByIndex(${o.idx})">Save</button>
      </div>
    </div>`).join("") || `<p class="muted">No opportunities match this filter.</p>`;

  // reminders: deadlines <= 12 days
  const urgent = OPPORTUNITIES.filter(o=>o.days<=12).sort((a,b)=>a.days-b.days).slice(0,3);
  reminders.innerHTML = urgent.map(o=>`⏰ <b>${o.title}</b> — ${o.days} days left (${o.deadline})`).join("<br>");
}

function saveOppByIndex(idx){
  const o = OPPORTUNITIES[idx];
  if(!o || saved.includes(o.title)) { showToast("Already saved!"); return; }
  saved.push(o.title);
  renderSaved();
  showToast(`Saved: ${o.title}`);
}

function saveOpp(title){
  const idx = OPPORTUNITIES.findIndex(x=>x.title===title);
  if(idx>=0) saveOppByIndex(idx); else showToast("Already saved!");
}

function renderSaved(){
  if(!saved.length){ savedList.innerHTML = `<p class="muted">Nothing saved yet — click “Save” on any opportunity.</p>`; return; }
  savedList.innerHTML = saved.map(t=>{
    const idx = OPPORTUNITIES.findIndex(x=>x.title===t);
    const o = OPPORTUNITIES[idx];
    return `<div class="saved-item"><span>📌 ${t}<br><small style="color:var(--mut)">Deadline ${o ? o.deadline : ""}</small></span><button onclick="removeOppByIndex(${idx})">✕</button></div>`;
  }).join("");
}
function removeOppByIndex(idx){ const t = OPPORTUNITIES[idx] ? OPPORTUNITIES[idx].title : null; saved = saved.filter(x=>x!==t); renderSaved(); }
function removeOpp(t){ saved = saved.filter(x=>x!==t); renderSaved(); }

document.querySelectorAll(".filters button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll(".filters button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    activeFilter = b.dataset.f;
    render();
  };
});
document.getElementById("btnMatch").onclick = ()=>{
  render();
  showToast("✨ Recommendations updated for your profile!");
};

// To-do app
const todoList = document.getElementById("todoList");
const todoInput = document.getElementById("todoInput");
["Update Resume","Apply for SIH","Work on Project"].forEach(addTodo);
function addTodo(text){
  if(!text) return;
  const li = document.createElement("li");
  li.innerHTML = `<input type="checkbox"><span>${text}</span><button>✕</button>`;
  li.querySelector("input").onchange = e=>li.classList.toggle("done", e.target.checked);
  li.querySelector("button").onclick = ()=>li.remove();
  todoList.appendChild(li);
}
document.getElementById("todoAdd").onclick = ()=>{
  if(!todoInput.value.trim()) return;
  addTodo(todoInput.value.trim());
  todoInput.value = "";
  showToast("Task added!");
};

// welcome toast
setTimeout(()=>showToast("👋 Hey Rahul! 2 deadlines approaching soon!"), 1200);
render();
