/* AnyAppBench project page. Data comes from static/js/data.js (tables of arXiv:2609.34139). */
const LB = window.AAB_LEADERBOARD;
const CATS = window.AAB_CATEGORIES;

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = v => v.toFixed(1);
const fmtD = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1);

/* ===== app inventory ===== */
(function inventory(){
  const body = document.getElementById("inventory-body");
  if (!body) return;
  body.innerHTML = CATS.map(c => {
    const aw = c.apps.filter(a => a.awOriginal).map(a => `<span class="aw-app">${esc(a.name)}</span>`).join(", ");
    const nw = c.apps.filter(a => !a.awOriginal).map(a => esc(a.name)).join(", ");
    return `<tr><td>${esc(c.label)}</td><td>${aw}</td><td>${nw}</td>
      <td class="num">${c.awTemplates.length} + ${c.newTemplates.length}</td></tr>`;
  }).join("");
})();

/* ===== leaderboard (Table 1) ===== */
(function leaderboard(){
  const head = document.getElementById("lb-head");
  const body = document.getElementById("lb-body");
  const foot = document.getElementById("lb-foot");
  const filters = document.getElementById("lb-filters");
  if (!head) return;

  // vals: [a.AW, a.New, a.Std, a.Δ, b.AW, b.New, b.Std, b.Δ]
  const COLS = [
    {label:"Family", key:"family"}, {label:"Model", key:"model"},
    {label:"AW app", i:0}, {label:"New", i:1}, {label:"Std", i:2}, {label:"Δ", i:3},
    {label:"AW app", i:4}, {label:"New", i:5}, {label:"Std", i:6}, {label:"Δ", i:7},
  ];
  const FAMILIES = ["All", "GUI-trained", "General", "Closed", "Hybrid", "Agent"];
  const order = new Map(LB.rows.map((r, k) => [r.model, k]));
  let sort = {col: null, dir: -1};
  let family = "All";

  head.innerHTML = COLS.map((c, k) => {
    const cls = [c.i !== undefined ? "num" : "", c.i === 0 || c.i === 4 ? "sep" : "",
                 k === 0 ? "fam-col" : "", k === 1 ? "model-col" : ""].join(" ").trim();
    return `<th class="${cls}"><button type="button" class="sort" data-col="${k}">${c.label}<span class="ar" aria-hidden="true">↕</span></button></th>`;
  }).join("");

  filters.innerHTML = FAMILIES.map(f =>
    `<button type="button" class="chip-btn" data-f="${f}" aria-pressed="${f === family}">${f}</button>`).join("");

  function value(r, c){ return c.i !== undefined ? r.vals[c.i] : r[c.key]; }

  function render(){
    let rows = LB.rows.filter(r => family === "All" || r.family === family);
    if (sort.col === null) rows.sort((a, b) => order.get(a.model) - order.get(b.model));
    else {
      const c = COLS[sort.col];
      rows.sort((a, b) => {
        const x = value(a, c), y = value(b, c);
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
      });
    }
    // best = highest success among visible rows, for the AW app / New columns
    const best = {};
    [0, 1, 4, 5].forEach(i => best[i] = Math.max(...rows.map(r => r.vals[i])));
    body.innerHTML = rows.map(r => `<tr>
      <td class="fam-col"><span class="fam">${esc(r.family)}</span></td>
      <td class="model-col"><b>${esc(r.model)}</b></td>
      ${r.vals.map((v, i) => {
        const cls = ["num", i === 0 || i === 4 ? "sep" : "", (i === 3 || i === 7) && v < 0 ? "d-neg" : "",
                     best[i] === v && rows.length > 1 ? "best" : ""].join(" ").trim();
        return `<td class="${cls}">${i === 3 || i === 7 ? fmtD(v) : fmt(v)}</td>`;
      }).join("")}
    </tr>`).join("");
    foot.innerHTML = family === "All" ? `<tr><td class="fam-col"></td><td class="model-col">Average (13 agents)</td>${LB.average.map((v, i) =>
      `<td class="num${i === 0 || i === 4 ? " sep" : ""}">${i === 3 || i === 7 ? fmtD(v) : fmt(v)}</td>`).join("")}</tr>` : "";
    head.querySelectorAll(".sort").forEach(b => {
      const k = +b.dataset.col;
      if (k === sort.col) {
        b.setAttribute("aria-sort", sort.dir > 0 ? "ascending" : "descending");
        b.querySelector(".ar").textContent = sort.dir > 0 ? "▲" : "▼";
      } else { b.removeAttribute("aria-sort"); b.querySelector(".ar").textContent = "↕"; }
    });
  }

  head.addEventListener("click", e => {
    const b = e.target.closest(".sort"); if (!b) return;
    const k = +b.dataset.col;
    if (sort.col === k) {
      if (sort.dir === -1) sort.dir = 1; else sort = {col: null, dir: -1};  // desc → asc → paper order
    } else sort = {col: k, dir: COLS[k].i === undefined ? 1 : -1};
    render();
  });
  filters.addEventListener("click", e => {
    const b = e.target.closest(".chip-btn"); if (!b) return;
    family = b.dataset.f;
    filters.querySelectorAll(".chip-btn").forEach(x => x.setAttribute("aria-pressed", x.dataset.f === family));
    render();
  });
  render();
})();

/* ===== per-app explorer (appendix tables) ===== */
(function explorer(){
  const tabs = document.getElementById("cat-tabs");
  const toggle = document.getElementById("tpl-toggle");
  if (!tabs) return;
  const head = document.getElementById("heat-head");
  const body = document.getElementById("heat-body");
  const foot = document.getElementById("heat-foot");
  const note = document.getElementById("heat-note");
  const tpl = document.getElementById("tpl-list");
  let cat = CATS.find(c => c.key === "contacts") || CATS[0];
  let g = 0;  // 0 = AW-inherited templates, 1 = new AnyAppBench templates

  function shade(v){
    const a = 0.06 + 0.84 * (v / 100);
    return `background:rgba(79,70,229,${a.toFixed(3)});color:${v >= 55 ? "#fff" : "var(--ink)"}`;
  }

  function render(){
    const nTpl = g === 0 ? cat.awTemplates.length : cat.newTemplates.length;
    head.innerHTML = `<tr><th>Model</th>${cat.apps.map(a =>
      `<th class="${a.awOriginal ? "aw" : ""}">${esc(a.name)}<span class="role">${a.awOriginal ? "AndroidWorld app" : "new app"}</span></th>`).join("")}</tr>`;
    body.innerHTML = cat.rows.map(r => `<tr><td><b>${esc(r.model)}</b></td>${cat.apps.map((a, k) => {
      const v = r.vals[2 * k + g];
      return `<td class="cell${a.awOriginal ? " aw-cell" : ""}" style="${shade(v)}">${fmt(v)}</td>`;
    }).join("")}</tr>`).join("");
    foot.innerHTML = `<tr><td>Mean (13 models)</td>${cat.apps.map((a, k) => {
      const v = cat.mean[2 * k + g];
      return `<td class="cell${a.awOriginal ? " aw-cell" : ""}" style="${shade(v)}">${fmt(v)}</td>`;
    }).join("")}</tr>`;
    note.textContent = `${cat.label}, ${g === 0 ? "AW-inherited" : "new AnyAppBench"} templates: ${nTpl} template${nTpl === 1 ? "" : "s"} × 3 runs = ${nTpl * 3} rollouts per cell. ` +
      (nTpl <= 2 ? "With this few rollouts, single cells are coarse; compare apps through the mean row. " : "") +
      "Success rates in %, C1 direct execution. † closed-source planner + UI-Venus-Ground-72B grounder.";
    tpl.innerHTML = `<span class="modes-lbl">Templates</span>` +
      cat.awTemplates.map(t => `<code class="aw" title="AW-inherited">${esc(t)}</code>`).join("") +
      cat.newTemplates.map(t => `<code title="New AnyAppBench template">${esc(t)}</code>`).join("") +
      `<span class="small muted">(shaded = AW-inherited)</span>`;
    tabs.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.key === cat.key));
    toggle.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.g === g));
  }

  CATS.forEach(c => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tab"; b.setAttribute("role", "tab");
    b.dataset.key = c.key; b.textContent = c.label;
    b.addEventListener("click", () => { cat = c; render(); });
    tabs.appendChild(b);
  });
  toggle.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    g = +b.dataset.g; render();
  });
  render();
})();

/* ===== copy BibTeX ===== */
const copyBtn = document.getElementById("copy-bib");
copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById("bib").innerText);
    copyBtn.textContent = "Copied ✓"; setTimeout(() => copyBtn.textContent = "Copy", 1500);
  } catch (e) { copyBtn.textContent = "Select & copy manually"; }
});
