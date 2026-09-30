"""Modo edição, passo 3: monta a edição (EDL) a partir das palavras e do edicao.json.

Uso:  python3 scripts/edicao/cortar.py
Lê  public/edit/palavras.json (transcrever.py) + public/edit/edicao.json (escrito depois de assistir ao vídeo).
Faz:
- mantém só os `trechos` pedidos (tempos do original; vazio = vídeo inteiro);
- corta silêncio: pausa > `max_pausa` vira `pausa_alvo`;
- tira tomada repetida (a pessoa recomeça a frase: fica a última) e palavra repetida em sequência ("que que");
- tira vícios soltos (`vicios`: "ahn", "hum"…);
- insere congelamentos e resolve TODAS as âncoras por palavra na linha do tempo já cortada.
Grava public/edit/edl.json (o Remotion lê) e public/timeline.json (para o sound.py: trilha, partitura, eventos).

Âncora = {"palavra": "curiosidade", "n": 0, "antes": 0.1}  (n = qual ocorrência depois dos cortes; "antes" antecipa)
      ou {"t": 12.5}  (segundos na edição final).
"""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
E = ROOT / "public" / "edit"
P = json.load(open(E / "palavras.json"))
C = json.load(open(E / "edicao.json"))
FPS = C.get("fps", 30)
cfg = {"max_pausa": .35, "pausa_alvo": .15, "repeticoes": True, "vicios": ["ahn", "ah", "hum", "hã", "éé", "é…", "uh", "hmm"],
       "pre": .06, "pos": .12, **C.get("cortes", {})}
norm = lambda w: re.sub(r"[^a-z0-9à-ÿ]", "", unicodedata.normalize("NFC", w.lower()))

W = [dict(p, i=i) for i, p in enumerate(P["palavras"])]
tr = C.get("trechos") or [[0, P["dur"]]]
W = [w for w in W if any(a - .05 <= w["s"] and w["e"] <= b + .05 for a, b in tr)]
removidas = []

# palavra esticada: o Whisper às vezes "engole" hesitação/tomada errada dentro de uma palavra (ex.: "comece" com 3,3 s).
# Duração impossível para o tamanho → apara, mantendo o FINAL (a parte colada na palavra seguinte é a tomada boa).
for w in W:
    plaus = .35 + .09 * len(norm(w["w"]))
    if w["e"] - w["s"] > max(.9, 2 * plaus):
        removidas.append(("palavra esticada", f"'{w['w']}' {w['e'] - w['s']:.1f}s → {plaus:.1f}s (conferir o trecho {w['s']:.1f}–{w['e'] - plaus:.1f}s)"))
        w["s"] = round(w["e"] - plaus, 3)

# vícios
vic = {norm(v) for v in cfg["vicios"]}
keep = [w for w in W if norm(w["w"]) not in vic]
removidas += [("vício", w["w"]) for w in W if norm(w["w"]) in vic]

# falas = trechos separados por pausa longa ou pontuação final
def falas(ws):
    out, cur = [], []
    for k, w in enumerate(ws):
        if cur and (w["s"] - cur[-1]["e"] > .6 or re.search(r"[.!?…]$", cur[-1]["w"])):
            out.append(cur); cur = []
        cur.append(w)
    if cur: out.append(cur)
    return out

if cfg["repeticoes"]:
    # correção falada: "comece por onde te dá… Não, comece pelo que…" → sai de "comece" (1º) até "não".
    # Olha a sequência inteira (reticências e "Não." quebram as falas), antes das outras regras.
    CORR = ("não", "nao", "quer", "digo", "aliás", "alias", "perdão", "desculpa")
    mudou = True
    while mudou:
        mudou = False
        nn = [norm(x["w"]) for x in keep]
        for j in range(1, len(nn) - 1):
            if nn[j] in CORR and keep[j + 1]["s"] - keep[j]["e"] < 1.5:
                for q in range(j - 1, max(-1, j - 9), -1):
                    if nn[q] == nn[j + 1] and keep[j]["s"] - keep[q]["e"] < 4:
                        removidas.append(("correção", " ".join(x["w"] for x in keep[q:j + 1])))
                        keep = keep[:q] + keep[j + 1:]; mudou = True; break
            if mudou: break
    # palavra repetida em sequência ("que que", "eu eu"): fica a segunda
    k = []
    for j, w in enumerate(keep):
        if j + 1 < len(keep) and norm(w["w"]) == norm(keep[j + 1]["w"]) and keep[j + 1]["s"] - w["e"] < .6 and len(norm(w["w"])) > 0:
            removidas.append(("repetida", w["w"])); continue
        k.append(w)
    keep = k
    # sequência repetida ("e o dia aparece | e o dia parece que"): fica a última; comparação tolerante por palavra
    import difflib
    parecida = lambda x, y: difflib.SequenceMatcher(None, norm(x), norm(y)).ratio() >= .75
    mudou = True
    while mudou:
        mudou = False
        for n in range(6, 1, -1):
            for j in range(len(keep) - 2 * n + 1):
                A, B = keep[j:j + n], keep[j + n:j + 2 * n]
                if B[0]["s"] - A[-1]["e"] < 1.2 and all(parecida(x["w"], y["w"]) for x, y in zip(A, B)):
                    removidas.append(("sequência repetida", " ".join(x["w"] for x in A)))
                    keep = keep[:j] + keep[j + n:]; mudou = True; break
            if mudou: break
    # tomada repetida: fala recomeçada ("comece por onde te dá… não, comece pelo que…") → fica a última
    fs = falas(keep); drop = set()
    for a_, b_ in zip(fs, fs[1:]):
        na, nb = [norm(x["w"]) for x in a_], [norm(x["w"]) for x in b_]
        pref = 0
        while pref < min(len(na), len(nb)) and na[pref] == nb[pref]: pref += 1
        if pref >= 2 or (pref >= 1 and len(na) <= 3):
            drop |= {x["i"] for x in a_}; removidas.append(("tomada", " ".join(x["w"] for x in a_)))
    keep = [w for w in keep if w["i"] not in drop]

if not keep: sys.exit("nenhuma palavra sobrou — conferir trechos/cortes")

# segmentos contínuos do original
segs, cur = [], None
for w in keep:
    a, b = max(0, w["s"] - cfg["pre"]), w["e"] + cfg["pos"]
    if cur and a - cur[1] <= cfg["max_pausa"] and w["i"] == cur[2] + 1:
        cur[1], cur[2] = b, w["i"]
    else:
        if cur: segs.append(cur)
        cur = [a, b, w["i"]]
segs.append(cur)
for x, y in zip(segs, segs[1:]):  # sem sobreposição
    if x[1] > y[0]: x[1] = y[0] = (x[1] + y[0]) / 2

# linha do tempo final: trechos + pausa_alvo entre eles + congelamentos
Q = lambda t: round(t * FPS) / FPS
tl, t, mapa = [], 0.0, []
cong = C.get("congelar", [])
for k, (a, b, _) in enumerate(segs):
    a, b = Q(a), Q(b)
    tl.append({"tipo": "trecho", "in": a, "out": b, "at": Q(t), "dur": Q(b - a)}); mapa.append((a, b, t)); t += b - a
    if k + 1 < len(segs): t += cfg["pausa_alvo"] if segs[k + 1][0] - b > cfg["pausa_alvo"] else 0
t = Q(t)

def src2dst(s):
    for a, b, d in mapa:
        if a - 1e-3 <= s <= b + 1e-3: return d + (s - a)
    return None

pal = [{"w": w["w"], "at": round(src2dst(w["s"]), 3), "end": round(src2dst(w["e"]) or src2dst(w["s"]), 3), "s": w["s"]} for w in keep]

def ancora(x):
    if "t" in x: return float(x["t"])
    alvo = norm(x["palavra"]); hits = [p for p in pal if norm(p["w"]) == alvo]
    if not hits: sys.exit(f"âncora: palavra '{x['palavra']}' não está na edição (conferir grafia na transcrição)")
    return hits[min(x.get("n", 0), len(hits) - 1)]["at"] - x.get("antes", 0)

# congelamentos: inserem tempo depois da palavra-âncora (empurram o resto)
for c in sorted(cong, key=ancora):
    at, dur = Q(ancora(c) + c.get("depois", .25)), c.get("dur", 1.2)
    src = next((s["in"] + (at - s["at"]) for s in tl if s["tipo"] == "trecho" and s["at"] <= at < s["at"] + s["dur"]), None)
    novo = []
    for s in tl:
        if s["tipo"] == "trecho" and s["at"] < at < s["at"] + s["dur"]:
            cut = at - s["at"]
            novo += [dict(s, out=Q(s["in"] + cut), dur=Q(cut)),
                     {"tipo": "congela", "src": Q(src), "at": at, "dur": dur, "texto": c.get("texto", "")},
                     dict(s, **{"in": Q(s["in"] + cut), "at": Q(at + dur), "dur": Q(s["dur"] - cut)})]
        elif s["at"] >= at: novo.append(dict(s, at=Q(s["at"] + dur)))
        else: novo.append(s)
    if not any(s["tipo"] == "congela" and s["at"] == at for s in novo):  # âncora caiu na junção de dois trechos
        nxt = next((s for s in novo if s["tipo"] == "trecho" and s["at"] >= at + dur - 1e-6), None)
        novo.append({"tipo": "congela", "src": Q(nxt["in"] if nxt else src or 0), "at": at, "dur": dur, "texto": c.get("texto", "")})
        novo.sort(key=lambda s: s["at"])
    tl = novo; t = Q(t + dur)
    for p in pal:
        if p["at"] >= at: p["at"] = round(p["at"] + dur, 3); p["end"] = round(p["end"] + dur, 3)

res = lambda lst, extra=(): [dict({k: v for k, v in x.items() if k not in ("palavra", "n", "antes", "t")}, at=round(ancora(x), 3)) for x in lst]
edl = {"video": f"edit/{P['fonte']}", "fps": FPS, "total": t, "src": {"w": P["w"], "h": P["h"], "dur": P["dur"]},
       "segs": tl, "palavras": pal, "enquadramento": C.get("enquadramento", {"x": .5, "y": .5}),
       "zooms": res(C.get("zooms", [])), "focos": res(C.get("focos", [])), "textos": res(C.get("textos", [])),
       "sfx": res(C.get("sfx", [])), "legendas": {"ativo": True, "palavras_por_grupo": 3, "pos_y": .72, **C.get("legendas", {})},
       "volume_voz": C.get("volume_voz", 1.0)}
json.dump(edl, open(E / "edl.json", "w"), ensure_ascii=False, indent=0)

# timeline.json para o sound.py (blocos = falas da edição)
fl = falas([dict(p, s=p["at"], e=p["end"]) for p in pal]) if pal else []
blocks = [{"id": f"f{k + 1}", "start": f[0]["at"], "dur": round(f[-1]["end"] - f[0]["at"], 3), "phrases": [[0, round(f[-1]["end"] - f[0]["at"], 3)]]} for k, f in enumerate(fl)]
json.dump({"fps": FPS, "total": t, "blocks": blocks, "modo": "edicao"}, open(ROOT / "public" / "timeline.json", "w"), indent=1)

print(f"original {P['dur']:.1f}s → edição {t:.1f}s  ({len([s for s in tl if s['tipo'] == 'trecho'])} trechos, {len(cong)} congelamentos)")
for tipo, txt in removidas: print(f"  − {tipo}: {txt[:90]}")
print(f"  falas: {len(blocks)} (ids f1..f{len(blocks)} para trilha.intensidade)")
