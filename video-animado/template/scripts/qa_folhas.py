"""Folhas de revisão do MP4 para a crítica (references/critica.md).

Uso:  python3 scripts/qa_folhas.py out/<slug>_9x16.mp4 [--momentos 1.2,4.5,...]
Saída em out/qa/<nome do mp4>/:
  geral.png      2 quadros por segundo, com o tempo
  tira_NN.png    12 quadros em volta de cada movimento rápido (pico de diferença entre quadros)
  celular.png    1 quadro/s a 360 px de largura (leitura no celular)
  storyboard.png um quadro por momento de --momentos (ou pelo início de cada bloco do timeline.json)
  relatorio.txt  duração, loudness integrado, pico, lista de picos de diferença (cortes, pulos, flashes)
"""
import argparse, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FF = shutil.which("ffmpeg") or sys.exit("precisa do ffmpeg do sistema (brew install ffmpeg)")
ap = argparse.ArgumentParser(); ap.add_argument("mp4"); ap.add_argument("--momentos", default="")
a = ap.parse_args()
mp4 = Path(a.mp4).resolve()
OUT = ROOT / "out" / "qa" / mp4.stem; OUT.mkdir(parents=True, exist_ok=True)
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(mp4)],
                                  capture_output=True, text=True).stdout)
vs = next(s for s in probe["streams"] if s["codec_type"] == "video")
dur, W, H = float(probe["format"]["duration"]), vs["width"], vs["height"]
tmp = Path(tempfile.mkdtemp())


def quadro(t, w):
    t = min(max(0, t), float(vs.get("duration", dur)) - 3 / 30)  # nunca pedir quadro depois do último do VÍDEO (o áudio pode ser mais longo)
    f = tmp / f"{t:08.3f}_{w}.jpg"
    if not f.exists():
        subprocess.run([FF, "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", str(mp4), "-frames:v", "1", "-vf", f"scale={w}:-2", "-q:v", "3", "-y", str(f)], check=True)
    return Image.open(f).convert("RGB")


def folha(ts, w, cols, nome, rotulo=lambda t: f"{t:.1f}s"):
    ims = [quadro(t, w) for t in ts]
    if not ims: return
    h = ims[0].height; P = 4; rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * (w + P) + P, rows * (h + P + 14) + P), "white"); d = ImageDraw.Draw(S)
    for k, (t, im) in enumerate(zip(ts, ims)):
        x, y = P + (k % cols) * (w + P), P + (k // cols) * (h + P + 14)
        d.text((x, y), rotulo(t), fill="black"); S.paste(im, (x, y + 14))
    S.save(OUT / nome); print(OUT / nome)


# 1. geral: 2 quadros/s
folha([i / 2 for i in range(int(dur * 2))], 240 if W > H else 150, 10 if W > H else 12, "geral.png")
# 2. celular: 1 quadro/s a 360 px
folha([i + .5 for i in range(int(dur))], 360, 6 if W < H else 4, "celular.png")
# 3. picos de diferença entre quadros (baixa resolução, 30 fps)
raw = subprocess.run([FF, "-v", "error", "-i", str(mp4), "-vf", "scale=96:-2,format=gray", "-r", "30", "-f", "rawvideo", "-"],
                     capture_output=True).stdout
fw = 96; fh = int(round(96 * H / W / 2) * 2)
fr = np.frombuffer(raw, np.uint8)[: (len(raw) // (fw * fh)) * fw * fh].reshape(-1, fh, fw).astype(np.float32)
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
med = np.median(diff) + 1e-6
picos = [i + 1 for i in range(1, len(diff) - 1) if diff[i] > 3 * med and diff[i] >= diff[i - 1] and diff[i] >= diff[i + 1] and diff[i] > 4]
# agrupa picos próximos e gera tiras
grupos = []
for p in picos:
    if not grupos or p - grupos[-1][-1] > 15: grupos.append([p])
    else: grupos[-1].append(p)
for k, g in enumerate(grupos[:12]):
    c = g[int(np.argmax([diff[i - 1] for i in g]))] / 30
    folha([c + (j - 6) / 30 for j in range(12)], 200 if W > H else 120, 12, f"tira_{k + 1:02d}.png", lambda t: f"{t:.2f}")
# 4. storyboard
mom = [float(x) for x in a.momentos.split(",") if x.strip()]
if not mom and (ROOT / "public" / "timeline.json").exists():
    mom = [b["start"] + min(1.0, b["dur"] / 2) for b in json.load(open(ROOT / "public" / "timeline.json"))["blocks"]]
if mom: folha(mom, 320 if W > H else 180, 5, "storyboard.png")
# 5. relatório
lufs = subprocess.run([FF, "-hide_banner", "-i", str(mp4), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", lufs); pk = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lufs)
rel = [f"{mp4.name}: {dur:.1f}s {W}x{H}", f"loudness integrado: {I[-1] if I else '?'} LUFS (alvo -14) | pico: {pk[-1] if pk else '?'} dBFS",
       f"picos de diferença (cortes, pulos, flashes) em s: {', '.join(f'{p / 30:.2f}' for p in picos) or 'nenhum'}",
       f"tiras geradas: {min(len(grupos), 12)} (uma por grupo de picos)"]
(OUT / "relatorio.txt").write_text("\n".join(rel) + "\n"); print("\n".join(rel))
