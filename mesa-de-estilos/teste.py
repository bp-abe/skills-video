"""Bancada das amostras: desenha a versão antiga (v1) e a nova de cada estilo de um grupo, em 4 momentos, e mede o custo.

Uso:  python3 teste.py grupos/g1.js
Saída: teste/<grupo>.png (folha: por linha, v1 em 3,4 s + nova em 1,0 / 3,4 / 5,6 / 7,8 s) e o custo impresso
       (ms por quadro, média de 40 desenhos; orçamento: ≤ 6 ms nesta medição de CPU — a página anima ~8 monitores ao mesmo tempo).
"""
import re, subprocess, sys
from pathlib import Path

H = Path(__file__).parent
grp = Path(sys.argv[1]).resolve()
FONTS = ("https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600"
         "&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700"
         "&family=Bebas+Neue&family=Archivo+Black&family=Press+Start+2P&family=VT323&family=Caveat:wght@500;700&family=Permanent+Marker"
         "&family=Pacifico&family=Inter+Tight:wght@400;600;800;900&display=swap")
page = f"""<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="{FONTS}">
<style>body{{margin:0;background:#1b1d22;color:#ddd;font:13px system-ui}} .row{{display:flex;gap:6px;padding:6px 8px;align-items:center}}
.lab{{width:150px;font:600 12px ui-monospace,monospace;color:#9ad}} canvas{{width:320px;height:180px;background:#000}} .old{{outline:2px solid #a44}}</style>
<div id="rows"></div><pre id="perf"></pre>
<script>{(H / 'helpers.js').read_text()}
{(H / 'v1.js').read_text()}
const OLD = Object.assign({{}}, R);
</script><script>{grp.read_text()}</script>
<script>
const ids = Object.keys(R).filter(k => R[k] !== OLD[k]);  // só o que o grupo definiu ou trocou
function one(fn, t) {{ const c = document.createElement('canvas'); c.width = 960; c.height = 540; const g = c.getContext('2d'); g.scale(2, 2); fn(g, t, 480, 270, 77); return c; }}
document.fonts.ready.then(() => {{
  const perf = [];
  ids.forEach(id => {{
    const row = document.createElement('div'); row.className = 'row'; row.innerHTML = `<div class="lab">${{id}}</div>`;
    if (OLD[id]) {{ const o = one(OLD[id], 3.4); o.className = 'old'; row.appendChild(o); }}
    [1.0, 3.4, 5.6, 7.8].forEach(t => row.appendChild(one(R[id], t)));
    document.getElementById('rows').appendChild(row);
    const c = document.createElement('canvas'); c.width = 960; c.height = 540; const g = c.getContext('2d'); g.scale(2, 2);
    const t0 = performance.now(); for (let i = 0; i < 40; i++) {{ g.save(); g.clearRect(0, 0, 480, 270); R[id](g, i * .137 + 1, 480, 270, 77); g.restore(); g.getImageData(0, 0, 1, 1); }}  // getImageData força o desenho a terminar (senão mede só a fila)
    perf.push(`${{id}}\\t${{((performance.now() - t0) / 40).toFixed(2)}} ms`);
  }});
  document.getElementById('perf').textContent = 'PERF\\n' + perf.join('\\n') + '\\nFIM';
}});
</script>"""
out = H / 'teste'; out.mkdir(exist_ok=True)
html = out / f'{grp.stem}.html'; html.write_text(page)
n = len(re.findall(r"R\[['\"][a-z0-9-]+['\"]\]\s*=", grp.read_text()))
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
common = [CH, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=15000"]
subprocess.run(common + [f"--window-size=1860,{max(400, 196 * max(n, 1) + 60)}", f"--screenshot={out / (grp.stem + '.png')}", html.as_uri()], capture_output=True)
dom = subprocess.run(common + ["--dump-dom", html.as_uri()], capture_output=True, text=True).stdout
m = re.search(r"PERF\n(.*?)\nFIM", dom, re.S)
print(out / (grp.stem + '.png'))
print(m.group(1) if m else "sem medição (erro de script? abrir o .html no navegador e ver o console)")
