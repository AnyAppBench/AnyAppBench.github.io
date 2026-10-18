"""Parse the paper's per-category per-app tables and Table 1 into JSON.

Usage (with the arXiv source of 2609.34139 unpacked):
  python tools/parse_tables.py acl_latex.tex paper_tables.json
  python tools/make_data_js.py paper_tables.json static/js/data.js
"""
import json, re, sys

tex = open(sys.argv[1], encoding="utf-8").read()
lines = tex.split("\n")

def clean(s):
    s = s.replace(r"\texttildelow", "~").replace(r"\\[-1pt]", " ").replace(r"\\", " ")
    s = re.sub(r"\\(textbf|makecell|cellcolor\{[a-z]+\})", "", s)
    s = re.sub(r"\\cellcolor\{[a-z]+\}", "", s)
    s = s.replace("{", "").replace("}", "").replace("$^\\dagger$", "†")
    return re.sub(r"\s+", " ", s).strip()

CATS = ["tasks","notes","finance","music","calendar","sms","file_manager","maps","contacts","clock"]
out = {}
for cat in CATS:
    end = next(i for i,l in enumerate(lines) if l.strip() == r"\label{tab:app_level_%s}" % cat)
    start = max(i for i in range(end) if lines[i].startswith(r"\begin{table*}"))
    block = lines[start:end+1]
    # header: all \multicolumn{2}{c}{...} cells between \toprule and first \cmidrule
    top = next(i for i,l in enumerate(block) if r"\toprule" in l)
    mid = next(i for i,l in enumerate(block) if r"\cmidrule" in l)
    head = " ".join(block[top+1:mid])
    apps = []
    for m in re.finditer(r"\\multicolumn\{2\}\{c\}\{(.*?)\}\s*(?=&|\\\\|$)", head):
        raw = m.group(1)
        apps.append({"name": clean(raw), "aw_original": "awshade" in raw})
    rows, mean = [], None
    for l in block:
        if "&" not in l or r"\textbf{AW}" in l: continue
        cells = [c.strip() for c in l.rstrip("\\ ").split("&")]
        nums = [c for c in cells if re.fullmatch(r"-?\d+(\.\d+)?", c.rstrip("\\").strip())]
        if len(nums) != 2*len(apps): continue
        vals = [float(n) for n in nums]
        if "Mean success rate" in l:
            mean = vals; continue
        model = clean(cells[1] if len(cells) > 2*len(apps)+1 else cells[0])
        model = model.replace("$^\\dagger$", "†")
        rows.append({"model": model, "vals": vals})
    cap = next(l for l in block if r"\AppLevelCaption" in l)
    m = re.search(r"templates \((\d+)\) and newly added AnyAppBench templates \((\d+)\)", cap)
    out[cat] = {"apps": apps, "rows": rows, "mean": mean,
                "n_aw_templates": int(m.group(1)), "n_new_templates": int(m.group(2))}
    print(cat, len(apps), [a["name"]+("*" if a["aw_original"] else "") for a in apps], len(rows), "mean" if mean else "NO MEAN", m.groups(), file=sys.stderr)

# Table 1
s = tex.index(r"\label{tab:main_cross_app_gap_recomputed}")
e = tex.index(r"\end{tabular}", s)
t1 = []
for l in tex[s:e].split("\n"):
    if "&" not in l or "textbf{Family}" in l or "multicolumn{4}" in l: continue
    cells = [c.strip() for c in l.rstrip("\\ ").split("&")]
    nums = [re.sub(r"\\textbf\{(.*)\}", r"\1", c) for c in cells[2:]]
    if len(nums) != 8: continue
    name = clean(cells[1]).replace("$^\\dagger$", "†")
    t1.append({"model": name, "vals": [float(x) for x in nums]})
print("table1 rows", len(t1), file=sys.stderr)
json.dump({"apps": out, "table1": t1}, open(sys.argv[2], "w"), indent=1)
