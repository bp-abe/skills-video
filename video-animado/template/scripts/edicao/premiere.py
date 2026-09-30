"""Modo edição, entrega editável: exporta a edição como XML (FCP7 xmeml) que o Premiere Pro abre (Arquivo > Importar).

Uso:  python3 scripts/edicao/premiere.py [9x16|16x9|1x1]
Saída: out/<slug>_edicao.xml — sequência com os cortes (vídeo + áudio do original, com o arquivo apontando para o vídeo
ORIGINAL), congelamentos como quadro parado, e marcadores para zooms, focos, textos e efeitos (o editor refina no Premiere).
Legenda: out/<slug>_legenda.srt (palavra a palavra agrupada), importável no Premiere como legenda.
"""
import json, re, sys, unicodedata
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[2]
E = json.load(open(ROOT / "public" / "edit" / "edl.json")); P = json.load(open(ROOT / "public" / "edit" / "palavras.json"))
R = json.load(open(ROOT / "roteiro.json"))
fmt = (sys.argv[1] if len(sys.argv) > 1 else (R.get("formatos") or ["16x9"])[0])
SW, SH = {"16x9": (1920, 1080), "9x16": (1080, 1920), "1x1": (1080, 1080)}[fmt]
fps = E["fps"]; fr = lambda s: int(round(s * fps))
slug = re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", R.get("titulo", "edicao")).encode("ascii", "ignore").decode().lower()).strip("-")
orig = Path(P.get("original") or ROOT / "public" / E["video"]).resolve()
url = "file://localhost" + str(orig).replace(" ", "%20")
rate = f"<rate><timebase>{fps}</timebase><ntsc>FALSE</ntsc></rate>"
filedef = (f'<file id="f1"><name>{escape(orig.name)}</name><pathurl>{escape(url)}</pathurl>{rate}<duration>{fr(P["dur"])}</duration>'
           f'<media><video><samplecharacteristics><width>{P["w"]}</width><height>{P["h"]}</height></samplecharacteristics></video>'
           f'<audio><channelcount>2</channelcount></audio></media></file>')
vclips, aclips, first = [], [], True
for k, s in enumerate(E["segs"]):
    st, en = fr(s["at"]), fr(s["at"] + s["dur"])
    ref = filedef if first else '<file id="f1"/>'; first = False
    if s["tipo"] == "trecho":
        i, o = fr(s["in"]), fr(s["out"])
        vclips.append(f'<clipitem id="v{k}"><name>corte {k + 1}</name>{rate}<start>{st}</start><end>{en}</end><in>{i}</in><out>{o}</out>{ref}</clipitem>')
        aclips.append(f'<clipitem id="a{k}"><name>corte {k + 1}</name>{rate}<start>{st}</start><end>{en}</end><in>{i}</in><out>{o}</out><file id="f1"/>'
                      '<sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack></clipitem>')
    else:  # congelamento: quadro parado (Time Remap 0%) — o editor pode trocar por Frame Hold
        i = fr(s["src"])
        vclips.append(f'<clipitem id="v{k}"><name>congela: {escape(s.get("texto", ""))}</name>{rate}<start>{st}</start><end>{en}</end>'
                      f'<in>{i}</in><out>{i + 1}</out>{ref}<filter><effect><name>Time Remap</name><effectid>timeremap</effectid>'
                      '<parameter><parameterid>speed</parameterid><value>0</value></parameter></effect></filter></clipitem>')
marks = []
for tipo in ("zooms", "focos", "textos", "sfx"):
    for x in E.get(tipo, []):
        nota = {"zooms": lambda x: f'zoom {x["escala"]}x em ({x["x"]:.2f},{x["y"]:.2f}) por {x["dur"]}s',
                "focos": lambda x: f'foco em ({x["x"]:.2f},{x["y"]:.2f}) {x["w"]:.2f}x{x["h"]:.2f} seta {x.get("seta", "esquerda")}',
                "textos": lambda x: f'texto: {x["texto"]}', "sfx": lambda x: f'som: {x["familia"]}'}[tipo](x)
        marks.append(f'<marker><name>{escape(tipo[:-1] if tipo != "sfx" else "sfx")}</name><comment>{escape(nota)}</comment>'
                     f'<in>{fr(x["at"])}</in><out>{fr(x["at"] + x.get("dur", 0))}</out></marker>')
xml = (f'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4"><sequence id="seq"><name>{escape(R.get("titulo", "edição"))}</name>'
       f'{rate}<duration>{fr(E["total"])}</duration><media><video><format><samplecharacteristics>{rate}<width>{SW}</width><height>{SH}</height>'
       f'</samplecharacteristics></format><track>{"".join(vclips)}</track></video><audio><track>{"".join(aclips)}</track></audio></media>'
       f'{"".join(marks)}</sequence></xmeml>\n')
out = ROOT / "out"; out.mkdir(exist_ok=True)
(out / f"{slug}_edicao.xml").write_text(xml)
# SRT
def ts(t): h, r = divmod(max(0, t), 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"
g, cur = [], []
for p in E["palavras"]:
    if cur and (len(cur) >= E["legendas"]["palavras_por_grupo"] or p["at"] - cur[-1]["end"] > .35 or re.search(r"[.!?,;:…]$", cur[-1]["w"])):
        g.append(cur); cur = []
    cur.append(p)
if cur: g.append(cur)
srt = "\n".join(f"{k + 1}\n{ts(x[0]['at'])} --> {ts((g[k + 1][0]['at'] if k + 1 < len(g) else x[-1]['end'] + .4))}\n{' '.join(p['w'] for p in x)}\n" for k, x in enumerate(g))
(out / f"{slug}_legenda.srt").write_text(srt)
print(out / f"{slug}_edicao.xml"); print(out / f"{slug}_legenda.srt")
