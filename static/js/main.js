/* ===== "Same task, different apps" demo grid =====
   Edit this table when real screenshots are ready.
   img: path relative to site root (null = placeholder). ok: true/false/null (no badge). */
const DEMO = {
  "Clock":        { instruction: "Set an alarm for 7:30 AM on weekdays labelled “Gym”.",
                    apps: [ {name:"Clock (AOSP)", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:true},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "Tasks":        { instruction: "Create a high-priority task “Submit report” due next Friday.",
                    apps: [ {name:"Tasks.org", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:true} ] },
  "Notes":        { instruction: "Create a note titled “Groceries” containing “milk, eggs, bread”.",
                    apps: [ {name:"Markor", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:true},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "Finance":      { instruction: "Add an expense of $12.50 for “Lunch” in the Food category.",
                    apps: [ {name:"Canonical app", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "Music":        { instruction: "Create a playlist named “Focus” and add the song “Lo-fi Beats”.",
                    apps: [ {name:"Canonical app", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:true},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "Calendar":     { instruction: "Add a 1-hour event “Team sync” tomorrow at 10:00.",
                    apps: [ {name:"Simple Calendar", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:true},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "SMS":          { instruction: "Send “Running 10 min late” to Alice.",
                    apps: [ {name:"Simple SMS Messenger", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:true},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "File Manager": { instruction: "Move “report.pdf” from Downloads into a new folder “Work”.",
                    apps: [ {name:"Files", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:true} ] },
  "Maps":         { instruction: "Find the walking route from KAIST to Daejeon Station.",
                    apps: [ {name:"OsmAnd", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
  "Contacts":     { instruction: "Add a contact “Jane Doe” with phone number 010-1234-5678.",
                    apps: [ {name:"Contacts", role:"canonical", img:null, ok:true},
                            {name:"Alternative app 1", role:"alternative", img:null, ok:true},
                            {name:"Alternative app 2", role:"alternative", img:null, ok:false},
                            {name:"Alternative app 3", role:"alternative", img:null, ok:false} ] },
};

const tabs = document.getElementById("cat-tabs");
const phones = document.getElementById("demo-phones");
const instr = document.getElementById("demo-instruction");

function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }

function render(cat){
  const d = DEMO[cat];
  instr.textContent = d.instruction;
  phones.innerHTML = d.apps.map(a => {
    const badge = a.ok === null ? "" : `<div class="badge ${a.ok ? "ok" : "bad"}">${a.ok ? "✓" : "✗"}</div>`;
    const path = a.img || `static/images/grid/${slug(cat)}/${slug(a.name)}.png`;
    const inner = a.img
      ? `<img src="${a.img}" alt="${a.name} screenshot">`
      : `<div class="ph"><div class="ph-label">screenshot<br><code>${path}</code></div></div>`;
    return `<div class="phone">
      <div class="screen">${inner}${badge}</div>
      <div class="app-name">${a.name}</div>
      <div class="app-role ${a.role === "canonical" ? "canon" : ""}">${a.role}</div>
    </div>`;
  }).join("");
  [...tabs.children].forEach(t => t.setAttribute("aria-selected", t.dataset.cat === cat));
}

Object.keys(DEMO).forEach(cat => {
  const b = document.createElement("button");
  b.className = "tab"; b.role = "tab"; b.dataset.cat = cat; b.textContent = cat;
  b.addEventListener("click", () => render(cat));
  tabs.appendChild(b);
});
render("Clock");

/* ===== copy BibTeX ===== */
const copyBtn = document.getElementById("copy-bib");
copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById("bib").innerText);
    copyBtn.textContent = "Copied ✓"; setTimeout(() => copyBtn.textContent = "Copy", 1500);
  } catch (e) { copyBtn.textContent = "Select & copy manually"; }
});
