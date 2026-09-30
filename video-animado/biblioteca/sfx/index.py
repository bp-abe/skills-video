"""Indexa a biblioteca de efeitos em famílias de variações.
Família = pacote/nome sem o número final (ex.: impact-sounds/impactWood_medium → 5 variações).
Gera index.json (família → caminhos relativos a public/) e INDEX.md (catálogo legível).
Uso: python3 index.py   (rodar de novo ao acrescentar pacotes; cada pacote numa subpasta com LICENSE.txt)
"""
import json, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXT = {".ogg", ".wav", ".mp3"}

def dur(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    try: return round(float(r.stdout.strip()), 2)
    except ValueError: return None

fam = {}
for src in sorted(p for p in HERE.iterdir() if p.is_dir()):  # fonte (ex.: kenney)
    for pack in sorted(p for p in src.iterdir() if p.is_dir()):
        for f in sorted(pack.iterdir()):
            if f.suffix.lower() not in EXT: continue
            base = re.sub(r"[_\-\s]*\d+$", "", f.stem)
            key = f"{pack.name}/{base}"
            fam.setdefault(key, {"files": [], "durs": [], "source": src.name})
            fam[key]["files"].append(f"audio/sfx/lib/{src.name}/{pack.name}/{f.name}")
            fam[key]["durs"].append(dur(f))
json.dump({k: v["files"] for k, v in fam.items()}, open(HERE / "index.json", "w"), indent=0)

# pico (s) de cada arquivo: o sfxVar alinha o PICO do som ao frame da ação, não o início do arquivo
import numpy as np
picos = {}
for k, v in fam.items():
    for rel in v["files"]:
        f = HERE / rel.replace("audio/sfx/lib/", "")
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "1", "-ar", "22050", "-f", "f32le", "-"], capture_output=True).stdout
        x = np.frombuffer(raw, np.float32)
        picos[rel] = round(float(np.argmax(np.abs(x))) / 22050, 3) if len(x) else 0.0
json.dump(picos, open(HERE / "picos.json", "w"), indent=0)

lines = ["# Efeitos sonoros — catálogo", "",
         "Gerado por `index.py`. Uso no código: `sfxVar(at, 'pacote/família', volume)` alterna as variações",
         "sem repetir a mesma em seguida e varia levemente altura e volume a cada toque.", "",
         "Licença de cada pacote no `LICENSE.txt` da pasta (Kenney: CC0, sem crédito obrigatório).", ""]
for pack in sorted({k.split("/")[0] for k in fam}):
    lines += [f"## {pack}", "", "| família | variações | duração (s) |", "|---|---|---|"]
    for k in sorted(x for x in fam if x.startswith(pack + "/")):
        ds = [d for d in fam[k]["durs"] if d]
        rng = f"{min(ds):.2f}–{max(ds):.2f}" if ds else "?"
        lines.append(f"| `{k}` | {len(fam[k]['files'])} | {rng} |")
    lines.append("")
(HERE / "INDEX.md").write_text("\n".join(lines))
print(len(fam), "famílias,", sum(len(v["files"]) for v in fam.values()), "arquivos")
