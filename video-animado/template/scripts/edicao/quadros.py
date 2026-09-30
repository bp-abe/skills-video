"""Modo edição, passo 2 (assistir): folhas de contato do vídeo com grade de coordenadas 0–1 e a fala de cada quadro.

Uso:  python3 scripts/edicao/quadros.py [--passo 2] [--ini 0 --fim 60]
Saída: out/edit/quadros_NN.png (12 quadros por folha). Abrir com Read e escolher:
trechos (tempos do original), zooms e focos (x, y em 0–1 lidos na grade), congelamentos e textos (âncora = palavra falada).
"""
import argparse, json, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
P = json.load(open(ROOT / "public" / "edit" / "palavras.json"))
ap = argparse.ArgumentParser(); ap.add_argument("--passo", type=float, default=2.0); ap.add_argument("--ini", type=float, default=0)
ap.add_argument("--fim", type=float, default=None); a = ap.parse_args()
fim = a.fim or P["dur"]; src = ROOT / "public" / "edit" / P["fonte"]
OUT = ROOT / "out" / "edit"; OUT.mkdir(parents=True, exist_ok=True)
tmp = Path(tempfile.mkdtemp()); W = 520; H = round(W * P["h"] / P["w"]); PAD, CAP = 6, 34
font = ImageFont.load_default()
ts, t = [], a.ini + a.passo / 2
while t < fim: ts.append(t); t += a.passo
fala = lambda t: " ".join(p["w"] for p in P["palavras"] if t - a.passo / 2 <= p["s"] < t + a.passo / 2)
for k in range(0, len(ts), 12):
    sheet = Image.new("RGB", (4 * W + 5 * PAD, 3 * (H + CAP) + 4 * PAD), "white"); d = ImageDraw.Draw(sheet)
    for j, t in enumerate(ts[k:k + 12]):
        f = tmp / f"{t:.2f}.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t}", "-i", str(src), "-frames:v", "1", "-q:v", "3", "-y", str(f)], check=True)
        im = Image.open(f).resize((W, H)); g = ImageDraw.Draw(im)
        for q in range(1, 10):  # grade 0.1
            g.line([(q * W / 10, 0), (q * W / 10, H)], fill=(255, 255, 0) if q == 5 else (255, 255, 255), width=1)
            g.line([(0, q * H / 10), (W, q * H / 10)], fill=(255, 255, 0) if q == 5 else (255, 255, 255), width=1)
            g.text((q * W / 10 + 2, 2), f".{q}", fill="yellow"); g.text((2, q * H / 10 + 2), f".{q}", fill="yellow")
        x, y = PAD + (j % 4) * (W + PAD), PAD + (j // 4) * (H + CAP + PAD)
        sheet.paste(im, (x, y)); d.rectangle([x, y, x + 56, y + 16], fill="black"); d.text((x + 4, y + 3), f"{t:.1f}s", fill="white")
        d.text((x + 2, y + H + 4), fala(t)[:95], fill="black")
    p = OUT / f"quadros_{k // 12 + 1:02d}.png"; sheet.save(p); print(p)
