"""Mapa de batidas de uma trilha pronta (Lyria ou arquivo) -> public/beats.json. A partitura grava o seu sozinha.

Uso:  ~/.venvs/tts-local/bin/python scripts/beatmap.py [public/audio/music.wav]
- andamento e batidas estimados (librosa), depois **conferidos pela energia**: a grade automática erra de fase
  com frequência (2 batidas fora é comum); a fase escolhida é a que põe mais ataque de grave em cima das batidas;
- "virada" = maior salto de energia de graves entre compassos, refinado em janelas de 20 ms (é onde a música
  "entra"); o momento visual principal deve cair nela (ou a trilha deve ser deslocada para isso);
- imprime a grade para conferir: compasso, tempo, energia de graves.
"""
import json, sys, warnings
warnings.filterwarnings("ignore")
from pathlib import Path
import numpy as np, librosa

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public" / "audio" / "music.wav"
y, sr = librosa.load(str(src), sr=22050, mono=True)
tempo, bt = librosa.beat.beat_track(y=y, sr=sr, units="time")
bpm = float(np.atleast_1d(tempo)[0]); beat = 60 / bpm
# graves (< 150 Hz): envelope de ataque
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=256)); fq = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = S[fq < 150].sum(0); env = np.maximum(0, np.diff(low, prepend=low[0])); tt = librosa.frames_to_time(np.arange(len(env)), sr=sr, hop_length=256)
at = lambda t: env[min(len(env) - 1, max(0, int(np.searchsorted(tt, t))))]
# fase: testa deslocamentos de 0 a 1 batida e fica com o que mais coincide com ataques de grave
fases = np.linspace(0, beat, 24, endpoint=False)
t0 = bt[0] if len(bt) else 0.0
score = [sum(at(t0 + f + k * beat) for k in range(int((len(y) / sr - t0) / beat))) for f in fases]
t0 = (t0 + fases[int(np.argmax(score))]) % beat
dur = len(y) / sr
batidas = [round(t0 + k * beat, 3) for k in range(int((dur - t0) / beat) + 1)]
compassos = batidas[::4]
# virada: maior salto de energia de graves entre compassos, refinado em 20 ms
en = [float(low[(tt >= a) & (tt < a + 4 * beat)].mean()) if a + 4 * beat <= dur else 0 for a in compassos]
k = int(np.argmax(np.diff(en))) + 1 if len(en) > 2 else 0
virada = compassos[k] if compassos else None
if virada is not None:
    w = [(t, float(np.mean(low[(tt >= t) & (tt < t + 0.02)]))) for t in np.arange(virada - 0.3, virada + 0.3, 0.02)]
    salto = [(w[i][0], w[i][1] - w[i - 1][1]) for i in range(1, len(w))]
    virada = round(max(salto, key=lambda x: x[1])[0], 3) if salto else virada
json.dump({"fonte": src.name, "bpm": round(bpm, 2), "batidas": batidas, "compassos": compassos, "virada": virada},
          open(ROOT / "public" / "beats.json", "w"))
print(f"{src.name}: {bpm:.1f} bpm, {len(batidas)} batidas, virada em {virada}s")
for i, (c, e) in enumerate(zip(compassos, en)):
    print(f"  compasso {i + 1:2d}  {c:6.2f}s  graves {e:9.1f} {'█' * int(30 * e / (max(en) or 1))}{'  ← virada' if i == k else ''}")
