"""Texturas procedurais (numpy/PIL) -> public/img/. Quadradas (1920x1920) para servir 16:9 e 9:16 com `cover`.
Fallback para quando o modelo de imagem do Gemini não tem cota (free tier = 0 para imagem).
Uso: python3 scripts/textures.py [nome ...]   (sem nomes: gera todas)"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(1914)
W = H = 1920

def fbm(h, w, octaves=6, base=4, persistence=0.55):
    """Ruído fractal por soma de ruídos de valor interpolados."""
    out = np.zeros((h, w)); amp = 1.0; tot = 0
    for o in range(octaves):
        f = base * 2 ** o
        g = rng.random((int(h / w * f) + 2, f + 2))
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * np.asarray(img, float) / 255; tot += amp; amp *= persistence
    return out / tot

def fibers(h, w, n, length=(10, 60), alpha=18):
    im = Image.new("L", (w, h), 0); d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = rng.random() * w, rng.random() * h
        a = rng.random() * np.pi; L = rng.uniform(*length)
        pts = [(x, y)]
        for _ in range(4):
            a += rng.normal(0, 0.35); x += np.cos(a) * L / 4; y += np.sin(a) * L / 4; pts.append((x, y))
        d.line(pts, fill=int(rng.uniform(alpha * .4, alpha)), width=1)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(0.6)), float) / 255

def stain(h, w, cx, cy, r, ring=True):
    yy, xx = np.mgrid[0:h, 0:w]
    n = fbm(h, w, 4, 3) - .5
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r + n * .35
    s = np.clip(1 - dist, 0, 1) ** 1.5 * .35
    if ring: s += np.exp(-((dist - 1) ** 2) / .002) * .5
    return s

def aged_paper(w, h, base=(233, 220, 190), dark=(150, 112, 62), stains=2, seed_vignette=.55):
    n = fbm(h, w, 7, 3)
    blotch = fbm(h, w, 3, 2)
    fib = fibers(h, w, int(w * h / 900))
    t = (n - .5) * .5 + (blotch - .5) * .9
    yy, xx = np.mgrid[0:h, 0:w]
    vig = ((xx / w - .5) ** 2 + (yy / h - .5) ** 2) ** 1.2 * 2.2 * seed_vignette
    k = np.clip(.12 + t * .35 + vig + fib * .5, 0, 1)
    for _ in range(stains):
        cx = rng.choice([rng.uniform(-.05, .18), rng.uniform(.82, 1.05)]) * w
        cy = rng.choice([rng.uniform(-.05, .2), rng.uniform(.8, 1.05)]) * h
        k = np.clip(k + stain(h, w, cx, cy, rng.uniform(.05, .09) * w, rng.random() < .5) * .35, 0, 1)
    fox = np.zeros((h, w))
    yy2, xx2 = np.mgrid[0:h, 0:w]
    for _ in range(int(w * h / 60000)):
        cx, cy, r = rng.random() * w, rng.random() * h, rng.uniform(1.5, 7)
        x0, x1, y0, y1 = int(max(cx - 3 * r, 0)), int(min(cx + 3 * r, w)), int(max(cy - 3 * r, 0)), int(min(cy + 3 * r, h))
        d2 = ((xx2[y0:y1, x0:x1] - cx) ** 2 + (yy2[y0:y1, x0:x1] - cy) ** 2) / r ** 2
        fox[y0:y1, x0:x1] += np.exp(-d2) * rng.uniform(.15, .45)
    k = np.clip(k + fox, 0, 1)
    b, dk = np.array(base, float), np.array(dark, float)
    rgb = b * (1 - k[..., None]) + dk * k[..., None]
    rgb += rng.normal(0, 3, (h, w, 1))
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))

WORDS = ("o a de que do da em um para com não uma os no se na por mais as dos como mas foi ao ele das tem à seu sua ou ser quando muito nos já está também só pelo pela até isso ela entre era depois sem mesmo aos ter seus quem nas me esse eles estão você tinha foram essa num nem suas meu às minha têm numa pelos elas havia seja qual será nós tenho lhe deles essas esses pelas este fosse dele governo ministro câmara deputado senado república presidente capital oposição partido tribuna imprensa sessão ontem hoje público nacional federal palácio comissão inquérito rádio notícia povo cidade estado lei projeto votação debate discurso eleição reunião assembleia jornal redação edição semana ainda sobre segundo contra durante após diante").split()

def paragraph_lines(font, width, n):
    lines = []; cur = ""
    while len(lines) < n:
        w = rng.choice(WORDS)
        t = (cur + " " + w).strip()
        if font.getlength(t) > width:
            lines.append(cur); cur = w
        else:
            cur = t
    return lines

def newsprint(w, h):
    paper = aged_paper(w, h, base=(226, 214, 186), dark=(160, 130, 85), stains=1, seed_vignette=.3)
    S = 2  # supersampling
    im = Image.new("L", (w * S, h * S), 255); d = ImageDraw.Draw(im)
    body = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 13 * S)
    bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf", 17 * S)
    cols, margin, gutter = 6, 50, 22
    cw = (w - 2 * margin - gutter * (cols - 1)) / cols
    lh = 15
    for c in range(cols):
        x0 = margin + c * (cw + gutter)
        if c: d.line([((x0 - gutter / 2) * S, margin * S), ((x0 - gutter / 2) * S, (h - margin) * S)], fill=70, width=S)
        y = margin
        while y < h - margin:
            if rng.random() < .12:
                t = rng.choice(["VIDA POLÍTICA", "NOTÍCIAS DA CAPITAL", "CÂMARA FEDERAL", "O TEMPO", "ECONOMIA", "INTERNACIONAL", "ESPORTES", "CULTURA", "ÚLTIMA HORA"])
                d.text(((x0 + cw / 2) * S, y * S), t, font=bold, fill=10, anchor="ma"); y += 24
            n = int(rng.integers(5, 14))
            for i, line in enumerate(paragraph_lines(body, (cw - (10 if False else 0)) * S, n)):
                if y > h - margin: break
                ind = 12 * S if i == 0 else 0
                d.text((x0 * S + ind, y * S), line, font=body, fill=15)
                y += lh
            y += 5
    im = im.resize((w, h), Image.LANCZOS)
    ink = np.asarray(im.filter(ImageFilter.GaussianBlur(.85)), float) / 255
    ink_var = .6 + .3 * fbm(h, w, 4, 3)
    p = np.asarray(paper, float)
    out = p * (1 - (1 - ink[..., None]) * ink_var[..., None] * .88)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def grain(w, h):
    g = rng.normal(128, 38, (h, w)).clip(0, 255).astype(np.uint8)
    return Image.fromarray(g).filter(ImageFilter.GaussianBlur(.5))

def notebook(w, h):
    """Papel branco levemente texturizado com pauta de caderno (estilo rabisco)."""
    p = np.asarray(aged_paper(w, h, base=(250, 248, 242), dark=(215, 205, 185), stains=0, seed_vignette=.15), float)
    for y in range(160, h, 64):
        p[y:y + 2] = p[y:y + 2] * .75 + np.array([150, 190, 230]) * .25
    p[:, 190:192] = p[:, 190:192] * .7 + np.array([235, 120, 120]) * .3
    return Image.fromarray(np.clip(p, 0, 255).astype(np.uint8))

def cardstock(w, h, rgb):
    """Cartolina colorida lisa com fibra (estilo rabisco/flat artesanal)."""
    return aged_paper(w, h, base=rgb, dark=tuple(int(c * .82) for c in rgb), stains=0, seed_vignette=.12)

JOBS = {
    "paper_bg": lambda: aged_paper(W, H),
    "paper_light": lambda: aged_paper(W, H, base=(242, 234, 212), dark=(170, 140, 95), stains=1, seed_vignette=.25),
    "paper_white": lambda: aged_paper(W, H, base=(250, 248, 243), dark=(210, 200, 182), stains=0, seed_vignette=.12),
    "kraft": lambda: aged_paper(W, H, base=(158, 118, 76), dark=(92, 62, 34), stains=0, seed_vignette=.8),
    "newsprint": lambda: newsprint(1600, 1200),
    "notebook": lambda: notebook(W, H),
    "card_yellow": lambda: cardstock(1200, 1200, (247, 214, 102)),
    "card_pink": lambda: cardstock(1200, 1200, (242, 160, 170)),
    "card_blue": lambda: cardstock(1200, 1200, (130, 180, 230)),
    "card_green": lambda: cardstock(1200, 1200, (150, 205, 150)),
}
want = [n for n in sys.argv[1:] if n != "grain"] if sys.argv[1:] else list(JOBS)  # grain.png sai sempre (abaixo)
for name in want:
    JOBS[name]().save(OUT / f"{name}.jpg", quality=92); print("ok", name)
grain(960, 960).save(OUT / "grain.png")
