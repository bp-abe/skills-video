"""Timeline + trilha + efeitos.
Grava public/timeline.json (fonte única de tempo do Remotion), public/audio/music.wav, public/audio/sfx/synth/*.wav
e public/audio/sfx/index.json (famílias de efeitos: biblioteca gravada + sintetizados).

Trilha (roteiro.json -> trilha.fonte):
- "lyria": usa public/audio/music_src.wav gerado por scripts/music.py (música do Gemini Lyria, no tamanho do vídeo)
- "arquivo": usa trilha.arquivo (música licenciada fornecida), convertida para public/audio/music_src.wav
- "partitura": música em camadas composta pela cena (trilha.tom, modo, bpm, intensidade por bloco, progressao)
Nos casos lyria/arquivo: ajuste à duração (corte com fade ou loop com crossfade) + acentos por frase
(bloco.acentos = [[indice_frase, "hit"|"chime"|"boom"], ...]).
Efeitos sintetizados saem em VARIAÇÕES (semente = título do vídeo): cada vídeo soa diferente e nada repete igual.
"""
import hashlib, json, shutil, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "public" / "audio"; SFX = A / "sfx"; SFX.mkdir(parents=True, exist_ok=True)
R = json.load(open(ROOT / "roteiro.json"))
SR = 44100
SEED = int(hashlib.sha1(R.get("titulo", "").encode()).hexdigest()[:8], 16)
rng = np.random.default_rng(SEED)  # por vídeo: dois vídeos nunca geram os mesmos efeitos
INTRO, GAP, OUTRO = R.get("intro", .8), R.get("gap", .4), R.get("outro", 2.6)

# ---------- timeline ----------
EDL = ROOT / "public" / "edit" / "edl.json"
if EDL.exists() and json.load(open(EDL)).get("segs"):  # modo edição: timeline.json já veio do scripts/edicao/cortar.py
    TLJ = json.load(open(ROOT / "public" / "timeline.json")); blocks, total = TLJ["blocks"], TLJ["total"]
else:
    nar = json.load(open(A / "durations.json"))
    t, blocks = INTRO, []
    for b in R["blocos"]:
        d = nar[b["id"]]
        blocks.append({"id": b["id"], "start": round(t, 3), "dur": d["dur"], "phrases": d["phrases"]})
        t += d["dur"] + GAP + b.get("extra", 0)
    total = round(blocks[-1]["start"] + blocks[-1]["dur"] + OUTRO, 3)
    json.dump({"fps": R.get("fps", 30), "total": total, "blocks": blocks}, open(ROOT / "public" / "timeline.json", "w"), indent=1)
print("total", total, "s")


# ---------- utilidades ----------
def write(p, x):
    x = np.asarray(x, float)
    if x.ndim == 1: x = np.stack([x, x], 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)
def env(n, a, r):
    e = np.ones(n); na, nr = max(int(a * SR), 1), max(int(r * SR), 1)
    e[:na] = np.linspace(0, 1, na) ** 2; e[n - nr:] *= np.linspace(1, 0, nr) ** 2; return e
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def noise(d): return rng.normal(0, 1, int(d * SR))

N = int(total * SR)
music = np.zeros((N, 2))
def add(x, at, gain=1.0, pan=.5):
    a = int(max(at, 0) * SR); b = min(a + len(x), N)
    if b <= a: return
    x = x[: b - a] * gain
    music[a:b, 0] += x * (1 - pan) * 1.41; music[a:b, 1] += x * pan * 1.41

def pad(ms, n, cutoff=900):
    tn = np.arange(n) / SR; out = np.zeros((n, 2))
    for j, m in enumerate(ms):
        v = np.zeros(n)
        for d in (-.12, 0, .12):
            f = hz(m) * 2 ** (d / 12); ph = rng.random() * 6.28
            for h in range(1, 8): v += np.sin(2 * np.pi * f * h * tn + ph * h) / h / (1 + .15 * h)
        v *= (.5 if m < 45 else .25) / 3; pan = .5 + (j - len(ms) / 2) * .1
        out[:, 0] += v * (1 - pan); out[:, 1] += v * pan
    return lp(out, cutoff)



TR = R.get("trilha", {})
FONTE, HUMOR = TR.get("fonte"), TR.get("humor")
if FONTE not in ("lyria", "arquivo", "partitura", "sintetizada"):
    raise SystemExit("roteiro.json: definir trilha.fonte (lyria | arquivo | partitura | sintetizada) — sem padrão, de propósito")


def ffmpeg_bin():
    return [shutil.which("ffmpeg")] if shutil.which("ffmpeg") else ["npx", "remotion", "ffmpeg"]


def read_wav(path):
    with wave.open(str(path)) as w:
        ch, sr, n = w.getnchannels(), w.getframerate(), w.getnframes()
        x = np.frombuffer(w.readframes(n), np.int16).astype(float) / 32768
    x = x.reshape(-1, ch)
    if ch == 1: x = np.repeat(x, 2, 1)
    if sr != SR: raise SystemExit(f"{path}: esperado {SR} Hz")
    return x[:, :2]


def fit(x, n, fade=2.0, xf=1.5):
    """Ajusta a faixa ao vídeo: corta com fade-out, ou repete com crossfade se for curta."""
    k = int(xf * SR)
    while len(x) < n:
        r = np.linspace(0, 1, k)[:, None]
        x = np.concatenate([x[:-k], x[-k:] * (1 - r) + x[:k] * r, x[k:]])
    x = x[:n].copy(); f = int(fade * SR)
    x[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
    return x


# ---------- partitura por cena ----------
NOTAS = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
         "A": 9, "A#": 10, "Bb": 10, "B": 11}


def intensity_curve():
    """Intensidade 0..1 por amostra: um valor por bloco (trilha.intensidade), intro/final próprios, transições suaves."""
    I = TR.get("intensidade", {})
    pts = [(0.0, TR.get("inicio", 0.15))]
    for b in blocks:
        v = I.get(b["id"], 0.4)
        pts += [(b["start"] + .4, v), (b["start"] + b["dur"], v)]
    pts.append((total, TR.get("final", 0.2)))
    ts, vs = zip(*pts)
    return np.interp(np.arange(N) / SR, ts, vs)


def pluck(m, dur=.6, bright=.5):
    n = int(dur * SR); tn = np.arange(n) / SR; f = hz(m); x = np.zeros(n)
    for h, amp in enumerate([1, .55 * bright + .1, .35 * bright, .2 * bright, .1 * bright], 1):
        x += amp * np.sin(2 * np.pi * f * h * tn) * np.exp(-tn * (5 + 3 * h))
    return x * np.minimum(tn / .002, 1)


def kick():
    n = int(.4 * SR); tn = np.arange(n) / SR
    return np.sin(2 * np.pi * (45 + 90 * np.exp(-tn * 30)) * tn) * np.exp(-tn * 9)


def hat(d=.05):
    n = int(d * SR); tn = np.arange(n) / SR
    return bp(noise(d), 6000, 14000) * np.exp(-tn * 80) * .4


def partitura():
    """Música em camadas guiada pela curva de intensidade: pad sempre; pulso grave > .3; arpejo > .5; percussão > .7;
    brilho (filtro) abre com a intensidade. Uma tonalidade e um andamento para o vídeo inteiro."""
    tom = NOTAS.get(TR.get("tom", "D"), 2); menor = TR.get("modo", "menor") == "menor"
    bpm = TR.get("bpm", 90); beat = 60 / bpm; bar = 4 * beat
    esc = [0, 2, 3, 5, 7, 8, 10] if menor else [0, 2, 4, 5, 7, 9, 11]
    graus = TR.get("progressao", [0, 5, 2, 6] if menor else [0, 4, 5, 3])  # i–VI–III–VII | I–V–vi–IV
    I = intensity_curve()
    out = np.zeros((N, 2))
    def put(x, at, g=1.0, pan=.5):
        a = int(max(at, 0) * SR); b = min(a + len(x), N)
        if b <= a: return
        x = x[: b - a] * g
        out[a:b, 0] += x * (1 - pan) * 1.41; out[a:b, 1] += x * pan * 1.41
    def triade(g, base):
        return [base + esc[(g + k) % 7] + 12 * ((g + k) // 7) for k in (0, 2, 4)]
    smooth = lambda v, a, b: float(np.clip((v - a) / (b - a), 0, 1))
    nb = int(total / bar) + 2
    for k in range(nb):
        t0 = k * bar
        if t0 >= total: break
        v = float(I[min(int((t0 + bar / 2) * SR), N - 1)])
        ch = triade(graus[k % len(graus)], 48 + tom)
        n = int((bar + 1.5) * SR)
        cut = 450 + 5200 * v ** 1.6
        seg = pad(ch + [ch[0] - 12], n, cutoff=cut) * (env(n, .6, 1.2) * (.08 + .7 * v ** 1.3))[:, None]
        a = int(t0 * SR); b = min(a + n, N); out[a:b] += seg[: b - a]
        g_pulse, g_arp, g_perc = smooth(v, .3, .5), smooth(v, .5, .7), smooth(v, .7, .85)
        for i in range(4):
            tb = t0 + i * beat
            if g_pulse: put(pluck(ch[0] - 24, .5, .2) * .9, tb, g_pulse * (1 if i == 0 else .7))
            if g_perc:
                if i in (0, 2): put(kick(), tb, .8 * g_perc)
                if i in (1, 3) and v > .85: put(bp(noise(.2), 900, 6000) * np.exp(-np.arange(int(.2 * SR)) / SR * 25) * .5, tb, g_perc, .55)
            for h in range(2):
                if g_perc: put(hat(), tb + h * beat / 2, g_perc * (.5 if h else .8), .65)
                if g_arp:
                    m = ch[(i * 2 + h) % 3] + 12 * (1 + (i + h) % 2)
                    put(pluck(m, .5, .3 + .6 * v), tb + h * beat / 2, g_arp * (.22 + .1 * rng.random()), .3 + .4 * ((i + h) % 2))
        if v > .8:
            put(pad([ch[1] + 24, ch[2] + 24], int(bar * SR), cutoff=7000)[:, 0] * .12 * smooth(v, .8, 1), t0, 1)
    grade = [round(k * beat, 3) for k in range(int(total / beat) + 1)]
    json.dump({"fonte": "partitura", "bpm": bpm, "batidas": grade, "compassos": grade[::4], "virada": None},
              open(ROOT / "public" / "beats.json", "w"))
    return out


if FONTE in ("lyria", "arquivo"):
    src = ROOT / "public" / "audio" / "music_src.wav"
    if FONTE == "arquivo":
        arq = Path(TR.get("arquivo", "")).expanduser()
        if not arq.exists(): raise SystemExit(f"trilha.arquivo não encontrado: {arq}")
        subprocess.run(ffmpeg_bin() + ["-v", "error", "-y", "-i", str(arq), "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", str(src)], check=True, cwd=ROOT)
    if not src.exists(): raise SystemExit("falta public/audio/music_src.wav — rodar scripts/music.py antes (trilha.fonte = lyria)")
    music = fit(read_wav(src), N) * 0.9
    HUMOR = FONTE
else:  # "partitura" (e "sintetizada", nome antigo): música composta pela cena, sem preset de estilo
    music = partitura()
    HUMOR = f"partitura {TR.get('tom', 'D')} {TR.get('modo', 'menor')} {TR.get('bpm', 90)} bpm"

# acentos pontuais sincronizados com frases
def hit():
    n = int(3.5 * SR); tn = np.arange(n) / SR
    return (np.sin(2 * np.pi * 55 * tn * (1 - .03 * np.exp(-tn * 8))) * np.exp(-tn * 1.6) + .3 * lp(noise(3.5), 300) * np.exp(-tn * 12)) * .8
def chime():
    n = int(2.5 * SR); tn = np.arange(n) / SR; x = np.zeros(n)
    for m, dl in ((84, 0), (88, .06), (91, .12)):
        k = int(dl * SR); tt = tn[: n - k]
        x[k:] += (np.sin(2 * np.pi * hz(m) * tt) + .3 * np.sin(2 * np.pi * hz(m) * 2.76 * tt)) * np.exp(-tt * 3)
    return x * .25
def boom():
    n = int(2.5 * SR); tn = np.arange(n) / SR
    return (np.sin(2 * np.pi * 40 * tn * (1 - .4 * np.exp(-tn * 5))) * np.exp(-tn * 2.2) + .4 * lp(noise(2.5), 150) * np.exp(-tn * 6)) * .9
ACC = {"hit": hit, "chime": chime, "boom": boom}
B = {b["id"]: b for b in blocks}
for b in R.get("blocos", []):
    for ph, kind in b.get("acentos", []):
        add(ACC[kind](), B[b["id"]]["start"] + B[b["id"]]["phrases"][ph][0] - .05, .55)

# ---------- eventos da cena (valem para qualquer trilha) ----------
# bloco.eventos = [[frase, tipo, deslocamento_s?], ...]
#   revelacao: subida de ruído → silêncio de 0,12s → impacto no instante (o corte seco dá o peso)
#   corte:     grave caindo (sub-drop) na troca de cena
#   sobe/desce: nota em glissando (o som imita o movimento na tela)
#   silencio:  trilha some por 1,5s a partir do instante (respiro antes de uma virada)
def riser(d=2.0):
    n = int(d * SR); tn = np.arange(n) / SR; x = noise(d); y = np.zeros(n)
    for i in range(0, n, 1024):
        f = 300 * (30 ** (i / n)); y[i:i + 1024] = bp(x[i:i + 1024], f * .7, min(f * 1.5, 18000))
    return y * (tn / d) ** 2.2 * .5
def impact():
    n = int(2.2 * SR); tn = np.arange(n) / SR
    body = np.sin(2 * np.pi * (38 + 60 * np.exp(-tn * 12)) * tn) * np.exp(-tn * 2.5)
    crash = bp(noise(2.2), 2000, 12000) * np.exp(-tn * 3.2) * .35
    return (body + crash) * .9
def subdrop(d=1.4):
    n = int(d * SR); tn = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(70 - 35 * (tn / d)) / SR) * np.exp(-tn * 2.2) * .8
def gliss(up=True, d=1.0):
    n = int(d * SR); tn = np.arange(n) / SR; m0 = 64
    f = hz(m0) * 2 ** ((12 if up else -12) * (tn / d) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + .3 * np.sin(2 * ph)) * env(n, .05, .3) * .25

gaps = []
for b in R.get("blocos", []):
    for ev in b.get("eventos", []):
        ph, kind = ev[0], ev[1]; off = ev[2] if len(ev) > 2 else 0
        bb = B[b["id"]]; t = bb["start"] + bb["phrases"][min(ph, len(bb["phrases"]) - 1)][0] + off
        if kind == "revelacao":
            r = riser(); add(r, t - .12 - len(r) / SR, .7); add(impact(), t, .8); gaps.append((t - .12, t))
        elif kind == "corte": add(subdrop(), t, .9)
        elif kind in ("sobe", "desce"): add(gliss(kind == "sobe"), t, .8)
        elif kind == "silencio": gaps.append((t, t + 1.5))
        else: raise SystemExit(f"evento desconhecido: {kind}")

music += lp(rng.normal(0, 1, (N, 2)), 1800) * .004  # ar de sala
music *= env(N, 1.2, 2.2)[:, None]
music = music / np.max(np.abs(music)) * .5
for g0, g1 in gaps:  # silêncios da cena: aplicados depois de tudo (nada vaza dentro do vão)
    a, b = int(g0 * SR), int(g1 * SR); r = int(.02 * SR)
    music[a:b] *= 0
    music[max(a - r, 0):a] *= np.linspace(1, 0, a - max(a - r, 0))[:, None]
    music[b:b + r] *= np.linspace(0, 1, len(music[b:b + r]))[:, None]
write(A / "music.wav", music)

# ---------- foley (biblioteca fixa; usar em src/sfx.ts) ----------
def pop():  # elemento aparecendo (estilos flat/rabisco)
    n = int(.18 * SR); tn = np.arange(n) / SR
    return np.sin(2 * np.pi * (500 + 900 * np.exp(-tn * 40)) * tn) * np.exp(-tn * 30) * .6
def whoosh(d=.5):
    n = int(d * SR); tn = np.arange(n) / SR; x = noise(d); y = np.zeros(n)
    for i in range(0, n, 512):  # passa-banda que sobe
        f = 400 + 5000 * (i / n); y[i:i + 512] = bp(x[i:i + 512], f * .6, min(f * 1.6, 20000))
    return y * np.sin(np.pi * tn / d) ** 2 * .5
def click():
    n = int(.05 * SR); tn = np.arange(n) / SR
    return bp(noise(.05), 2000, 9000) * np.exp(-tn * 200) * .7
def vary(x, k):
    """Variação k de um efeito: altura (reamostragem), brilho e volume sorteados."""
    r = rng.uniform(.88, 1.14)
    y = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
    if rng.random() < .5: y = lp(y, rng.uniform(3500, 9000))
    return y * rng.uniform(.8, 1.0)


NVAR = 5
SYN = SFX / "synth"; SYN.mkdir(exist_ok=True)
index = {}
for name, fn in [("pop", pop), ("whoosh", whoosh), ("click", click), ("chime", chime), ("hit", hit), ("boom", boom)]:
    index[f"synth/{name}"] = []
    for k in range(NVAR):
        write(SYN / f"{name}_{k}.wav", vary(fn(), k))
        index[f"synth/{name}"].append(f"audio/sfx/synth/{name}_{k}.wav")
lib = SFX / "lib.json"  # biblioteca gravada (copiada pelo novo.sh)
if lib.exists(): index.update(json.load(open(lib)))
json.dump(index, open(SFX / "index.json", "w"), indent=0)
# pico (s) de cada efeito: o sfxVar alinha o pico ao frame da ação
picos = json.load(open(SFX / "lib_picos.json")) if (SFX / "lib_picos.json").exists() else {}
for fam, files in index.items():
    if not fam.startswith("synth/"): continue
    for rel in files:
        x = read_wav(ROOT / "public" / rel)[:, 0]
        picos[rel] = round(float(np.argmax(np.abs(x))) / SR, 3)
json.dump(picos, open(SFX / "picos.json", "w"), indent=0)
print("trilha:", HUMOR, f"| efeitos: {len(index)} famílias ({sum(len(v) for v in index.values())} arquivos)")
