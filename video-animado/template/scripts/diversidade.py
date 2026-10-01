"""QA de diversidade: este vídeo está repetindo os anteriores?

Uso:  python3 scripts/diversidade.py --conceitos (na ideação: confere os 3 conceitos de conceitos.json antes de escolher)
      python3 scripts/diversidade.py              (no QA, antes do render final)
      python3 scripts/diversidade.py --registrar  (na fase "evoluir a skill", depois da entrega)

conceitos.json = [{"nome": "A", "materiais": ["substantivos do mundo visual: superfície, técnica, objeto"],
                   "paleta": ["#hex", ...]}, ...]; o escolhido vai para roteiro.json "conceito": {"materiais": [...]}.

O conceito é criado SEM olhar o histórico. Este script compara depois, com um registro que só ele lê
(~/.claude/skills/video-animado/biblioteca/uso.json — nunca abrir esse arquivo para decidir nada).

Dentro do vídeo (efeitos): famílias distintas, peso da família mais usada, fatia de sintetizados.
Entre vídeos:
- paleta (hex em src/tema.ts): distância de cor média (ΔE Lab) com cada vídeo anterior;
- fontes (@remotion/google-fonts importadas em src/): sobreposição com cada vídeo anterior;
- efeitos: sobreposição das famílias com cada vídeo anterior;
- voz e trilha: iguais às dos 3 últimos vídeos.
roteiro.linha_de_estilo = "<título de um vídeo>" → a comparação com aquele vídeo é pulada (continuidade pedida).
Sai com código 1 se algo repetir (lista o que trocar).
"""
import json, re, sys
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REG = Path.home() / ".claude" / "skills" / "video-animado" / "biblioteca" / "uso.json"
R = json.load(open(ROOT / "roteiro.json"))
VIDEO = R.get("titulo", ROOT.name)
LINHA = R.get("linha_de_estilo")

MIN_FAMILIAS, MAX_TOPO, MAX_SYNTH = 4, 0.40, 0.50
MAX_JACCARD_SONS, MAX_JACCARD_FONTES, MIN_DELTA_E, RECENTES = 0.35, 0.34, 15.0, 3

# stage.tsx só define as funções; arquivos/pastas com "_" na frente (ex.: src/_conceitos/, quadros de ideação) não entram no vídeo
files = [p for p in (ROOT / "src").rglob("*.ts*") if p.name != "stage.tsx" and not any(x.startswith("_") for x in p.relative_to(ROOT / "src").parts)]
src = "\n".join(p.read_text() for p in files)
src = re.sub(r"/\*.*?\*/|//[^\n]*", "", src, flags=re.S)  # comentários não contam


# ---------- efeitos ----------
def calls(name):
    for m in re.finditer(rf"\b{name}\(", src):
        i, depth, args, cur = m.end(), 1, [], ""
        while i < len(src) and depth:
            c = src[i]
            if c in "([{": depth += 1
            elif c in ")]}": depth -= 1
            if depth == 1 and c == ",": args.append(cur); cur = ""
            elif depth: cur += c
            i += 1
        args.append(cur)
        line = src[src.rfind("\n", 0, m.start()) + 1: m.start()]
        arr = re.search(r"\[([\d,\s]+)\]\.map\(", line)
        n = len(re.findall(r"\d+", arr.group(1))) if arr else 1
        lit = re.match(r"\s*'([^']+)'", args[1]) if len(args) > 1 else None
        yield (lit.group(1) if lit else None), n

hits = Counter()
for fam, n in calls("sfxVar"): hits[fam or "?dinâmica"] += n
for fam, n in calls("sfx"): hits[f"synth/{fam}" if fam else "?dinâmica"] += n
for _, n in calls("slap"): hits["synth/slap"] += n
hits = Counter({k: v for k, v in hits.items() if v})
sons = sorted(k for k in hits if not k.startswith("?"))

# ---------- paleta, fontes, voz, trilha ----------
tema = re.sub(r"/\*.*?\*/|//[^\n]*", "", (ROOT / "src" / "tema.ts").read_text(), flags=re.S)
paleta = sorted({h.lower() for h in re.findall(r"#[0-9a-fA-F]{6}\b", tema)})
fontes = sorted(set(re.findall(r"@remotion/google-fonts/([A-Za-z0-9]+)", src)))
voz = R.get("voz")
tr = R.get("trilha", {})
trilha = {"fonte": tr.get("fonte"), "carater": tr.get("humor") or " ".join(str(tr.get(k, "")) for k in ("tom", "modo")).strip() or None,
          "prompt": tr.get("prompt") or None}


def lab(hx):
    r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))
    lin = lambda c: c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    r, g, b = lin(r), lin(g), lin(b)
    x, y, z = (r * .4124 + g * .3576 + b * .1805) / .95047, r * .2126 + g * .7152 + b * .0722, (r * .0193 + g * .1192 + b * .9505) / 1.08883
    f = lambda t: t ** (1 / 3) if t > .008856 else 7.787 * t + 16 / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def delta_paleta(a, b):
    """Distância média de cada cor de A até a cor mais próxima de B (simétrica). < ~18 = paletas quase iguais."""
    if not a or not b: return 999
    la, lb = [lab(c) for c in a], [lab(c) for c in b]
    d = lambda p, q: sum((u - v) ** 2 for u, v in zip(p, q)) ** .5
    m = lambda X, Y: sum(min(d(x, y) for y in Y) for x in X) / len(X)
    return (m(la, lb) + m(lb, la)) / 2


# sinônimos de mundo (só o script lê): o mesmo reflexo descrito com outras palavras conta como repetição
SIN = {"papel": "caderno dossie dossiê pergaminho jornal recorte colagem carimbo envelope mapa papelao papelão livro pop-up origami arquivo ficha",
       "tinta": "nanquim pena aquarela sepia sépia lapis lápis grafite carvao carvão gravura xilogravura"}
NORM = {w: k for k, v in SIN.items() for w in v.split()}
norm = lambda ms: {NORM.get(m.lower().strip(), m.lower().strip()) for m in ms or []}


def conceitos():
    """Confere cada conceito de conceitos.json contra o registro: mundo (materiais) e paleta."""
    if not (ROOT / "conceitos.json").exists():
        sys.exit("falta conceitos.json: [{\"nome\", \"materiais\": [...], \"paleta\": [...]}, ...] com os 3 conceitos")
    cs = json.load(open(ROOT / "conceitos.json"))
    reg = json.load(open(REG)) if REG.exists() else {}
    ant = sorted(((k, v) for k, v in reg.items() if k not in (VIDEO, LINHA)), key=lambda kv: kv[1].get("data", ""))
    rec = ant[-5:]
    freq = Counter(m for _, u in ant for m in norm(u.get("materiais")))
    livres = 0
    for c in cs:
        ms, pr = norm(c.get("materiais")), []
        if not ms: pr.append("sem 'materiais' declarados")
        for m in sorted(ms):
            n = sum(m in norm(u.get("materiais")) for _, u in rec)
            if n >= 2: pr.append(f"'{m}' em {n} dos {len(rec)} vídeos mais recentes")
            elif ant and freq[m] / len(ant) >= .4: pr.append(f"'{m}' em {freq[m]} de {len(ant)} vídeos anteriores")
        for outro, u in ant:
            if c.get("paleta") and u.get("paleta") and delta_paleta([x.lower() for x in c["paleta"]], u["paleta"]) < MIN_DELTA_E:
                pr.append(f"paleta quase igual à de '{outro}'")
        livres += not pr
        print(f"  {c.get('nome', '?')}: {'ok' if not pr else 'REPETE — ' + '; '.join(pr)}")
    if livres < 2:
        print("\nMenos de 2 conceitos livres de repetição: o reflexo está puxando para o mesmo mundo. Inventar de novo a partir do")
        print("conteúdo (outra superfície, outra técnica, outra luz) — ou, se o pedido exige esse mundo, dizer por quê no PROPOSTA.")
        sys.exit(1)
    print("conceitos ok (escolher entre os livres; escolher um que repete só com o porquê escrito)")


jac = lambda a, b: len(set(a) & set(b)) / len(set(a) | set(b)) if set(a) | set(b) else 0
palavras = lambda t: set(re.findall(r"[a-z]{4,}", (t or "").lower()))

if "--conceitos" in sys.argv:
    conceitos(); sys.exit(0)

# ---------- relatório ----------
prob = []
total = sum(hits.values())
print(f"{VIDEO}")
print(f"  voz: {voz} · trilha: {trilha['fonte']} {trilha['carater'] or ''} · fontes: {', '.join(fontes) or '—'}")
print(f"  paleta: {' '.join(paleta) or '— (tema.ts sem cores)'}")
if total:
    top, ntop = hits.most_common(1)[0]
    synth = sum(v for k, v in hits.items() if k.startswith("synth/"))
    print(f"  efeitos: {total} toques, {len(hits)} famílias, sintetizados {synth / total:.0%}")
    if total >= 10 and len(hits) < MIN_FAMILIAS: prob.append(f"efeitos: só {len(hits)} famílias para {total} toques (mín. {MIN_FAMILIAS})")
    if total >= 10 and ntop / total > MAX_TOPO: prob.append(f"efeitos: '{top}' tem {ntop / total:.0%} dos toques (máx. {MAX_TOPO:.0%})")
    if hits.get('synth/whoosh', 0) >= 2:
        prob.append(f"efeitos: whoosh sintetizado {hits['synth/whoosh']}× — é o som genérico de transição; tirar, ou usar um som do material do conceito em 1–2 momentos")
    if synth / total > MAX_SYNTH: prob.append(f"efeitos: sintetizados em {synth / total:.0%} (máx. {MAX_SYNTH:.0%}) — usar sons gravados do material do conceito")
if paleta and set(paleta) <= {"#808080", "#a6a6a6", "#d9d9d9", "#1a1a1a", "#4d4d4d", "#666666", "#bfbfbf", "#000000"}:
    prob.append("paleta: tema.ts ainda é o placeholder cinza do template")

reg = json.load(open(REG)) if REG.exists() else {}
anteriores = [(k, v) for k, v in reg.items() if k not in (VIDEO, LINHA)]
recentes = sorted(anteriores, key=lambda kv: kv[1].get("data", ""))[-RECENTES:]
for outro, u in anteriores:
    if sons and u.get("sons") and jac(sons, u["sons"]) > MAX_JACCARD_SONS:
        prob.append(f"efeitos: {jac(sons, u['sons']):.0%} iguais a '{outro}' — em comum {sorted(set(sons) & set(u['sons']))[:6]}")
    if fontes and u.get("fontes") and jac(fontes, u["fontes"]) > MAX_JACCARD_FONTES:
        prob.append(f"fontes: {sorted(set(fontes) & set(u['fontes']))} já usadas em '{outro}'")
    if paleta and u.get("paleta") and delta_paleta(paleta, u["paleta"]) < MIN_DELTA_E:
        prob.append(f"paleta: quase igual à de '{outro}' (ΔE médio {delta_paleta(paleta, u['paleta']):.0f}, mín. {MIN_DELTA_E:.0f}) — {u['paleta'][:5]}")
for outro, u in recentes:
    if voz and u.get("voz") == voz:
        prob.append(f"voz: '{voz}' também em '{outro}' (um dos {RECENTES} últimos)")
    t2 = u.get("trilha") or {}
    if trilha["fonte"] and t2.get("fonte") == trilha["fonte"] and t2.get("carater") == trilha["carater"] and trilha["carater"]:
        prob.append(f"trilha: '{trilha['fonte']} {trilha['carater']}' também em '{outro}'")
    if trilha["prompt"] and t2.get("prompt") and jac(palavras(trilha["prompt"]), palavras(t2["prompt"])) > .45:
        prob.append(f"trilha: prompt do Lyria parecido com o de '{outro}'")

if "--registrar" in sys.argv:
    reg[VIDEO] = {"data": date.today().isoformat(), "voz": voz, "trilha": trilha, "fontes": fontes, "paleta": paleta, "sons": sons,
                  "materiais": sorted((R.get("conceito") or {}).get("materiais", []))}
    REG.parent.mkdir(parents=True, exist_ok=True)
    json.dump(reg, open(REG, "w"), ensure_ascii=False, indent=1); print(f"registrado em {REG.name}")
if prob:
    print("\nREPETINDO VÍDEOS ANTERIORES / POUCA VARIEDADE:"); [print(" -", p) for p in prob]
    print("\nTrocar o que foi apontado e rodar de novo. Continuidade pedida? roteiro.linha_de_estilo = \"<vídeo>\".")
    sys.exit(1)
print("diversidade ok")
