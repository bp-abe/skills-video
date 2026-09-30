"""Encurta silêncios internos (sem tocar na fala), normaliza loudness e mede cada bloco.
audio_raw/<id>.wav -> public/audio/<id>.wav + public/audio/durations.json
durations.json traz a duração REAL e o início/fim de cada frase (detecção de pausa) — é daí que a animação cronometra.
"""
import json, re, subprocess, tempfile, wave
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "public" / "audio"; A.mkdir(parents=True, exist_ok=True)
R = json.load(open(ROOT / "roteiro.json"))
EDGE, SR, TARGET_DB = .12, 24000, -19.0
WIN = int(.02 * SR)
MIN_PAUSE = .12  # silêncio acima disso separa frases

out = {}
for b in R["blocos"]:
    bid = b["id"]
    src = ROOT / "audio_raw" / f"{bid}.wav"
    tempo = b.get("tempo", R.get("tempo_voz", 1))  # >1 acelera a fala sem mudar o tom (atempo); TTS lento demais
    if tempo != 1:
        tmp = Path(tempfile.mkdtemp()) / f"{bid}.wav"
        subprocess.run(["npx", "remotion", "ffmpeg", "-v", "error", "-i", str(src), "-filter:a", f"atempo={tempo}",
                        "-ar", str(SR), "-ac", "1", "-y", str(tmp)], cwd=ROOT, check=True)
        src = tmp
    with wave.open(str(src)) as w:
        assert w.getframerate() == SR, f"{bid}: esperado {SR} Hz"
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
    e = np.array([np.sqrt(np.mean(a[j:j + WIN] ** 2)) for j in range(0, len(a) - WIN, WIN)])
    idx = np.where(e > e.max() * .025)[0]
    segs, start, prev = [], idx[0], idx[0]
    for k in idx[1:]:
        if (k - prev) * WIN / SR > MIN_PAUSE:
            segs.append((start, prev + 1)); start = k
        prev = k
    segs.append((start, prev + 1))
    # alinha com a pontuação: com mais pausas que trechos, mantém as fronteiras mais próximas de onde cada
    # trecho deveria começar (proporcional aos caracteres) e funde o resto (micro-pausas/respiração no meio da frase)
    chunks = [c for c in re.split(r"(?<=[,.;:!?—…])\s+", b["texto"].strip()) if c]
    if len(segs) > len(chunks) > 1:
        t0, t1 = segs[0][0], segs[-1][1]
        cum = np.cumsum([0] + [len(c) for c in chunks])[1:-1] / sum(len(c) for c in chunks)
        want = t0 + cum * (t1 - t0)  # frame esperado de cada fronteira
        cand = [s0 for s0, _ in segs[1:]]  # frames candidatos (início de cada segmento)
        m, n = len(want), len(cand)
        # DP: escolhe m candidatos em ordem minimizando a distância total
        INF = float("inf"); D = [[INF] * (n + 1) for _ in range(m + 1)]; D[0] = [0.0] * (n + 1)
        for i in range(1, m + 1):
            for j in range(i, n + 1):
                D[i][j] = min(D[i][j - 1] if j > i else INF, D[i - 1][j - 1] + abs(cand[j - 1] - want[i - 1]))
        keep, i, j = set(), m, n
        while i:
            if j > i and D[i][j] == D[i][j - 1]: j -= 1
            else: keep.add(j); i -= 1; j -= 1
        merged = [[segs[0]]]
        for k, sg in enumerate(segs[1:], 1):
            if k in keep: merged.append([sg])
            else: merged[-1].append(sg)  # micro-pausa dentro da frase: guarda os pedaços para encurtá-la também
        subs = merged
    else:
        subs = [[sg] for sg in segs]
    segs = [(g[0][0], g[-1][1]) for g in subs]

    max_gap, fade = b.get("max_gap", .42), int(.008 * SR)
    pieces, phrases = [np.zeros(int(EDGE * SR))], []
    for n, (s0, s1) in enumerate(segs):
        inner = b.get("max_inner", .2)  # pausa interna (vírgula não escrita, respiração) — limitada, não removida
        parts = []
        for m, (u0, u1) in enumerate(subs[n]):
            if m: parts.append(np.zeros(int(min((u0 - subs[n][m - 1][1]) * WIN / SR, inner) * SR)))
            parts.append(a[max(u0 * WIN - fade, 0): u1 * WIN + fade])
        seg = np.concatenate(parts).copy()
        ramp = np.linspace(0, 1, fade); seg[:fade] *= ramp; seg[-fade:] *= ramp[::-1]
        t0 = sum(len(p) for p in pieces) / SR
        pieces.append(seg); phrases.append([round(t0, 3), round(t0 + len(seg) / SR, 3)])
        if n < len(segs) - 1:
            pieces.append(np.zeros(int(min((segs[n + 1][0] - s1) * WIN / SR, max_gap) * SR)))
    pieces.append(np.zeros(int(EDGE * SR)))
    y = np.concatenate(pieces)
    # RMS só das partes faladas: blocos de tomadas/modelos diferentes ficam no mesmo nível
    fr = np.array([np.sqrt(np.mean(y[j:j + WIN] ** 2)) for j in range(0, len(y) - WIN, WIN)])
    rms = np.sqrt(np.mean(fr[fr > fr.max() * .05] ** 2)) / 32768
    y = y * (10 ** (TARGET_DB / 20) / rms) / 32768
    # limitador suave: acima de -2 dBFS comprime com tanh em vez de cortar (vozes com picos fortes, ex. Kokoro)
    th = 0.8; over = np.abs(y) > th
    y[over] = np.sign(y[over]) * (th + (0.98 - th) * np.tanh((np.abs(y[over]) - th) / (0.98 - th)))
    y = (y * 32767).astype(np.int16)
    with wave.open(str(A / f"{bid}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
    with wave.open(str(A / f"{bid}.wav")) as w:  # mede o arquivo gravado, não a conta
        dur = round(w.getnframes() / w.getframerate(), 3)
    out[bid] = {"dur": dur, "phrases": phrases}
    words = len(b["texto"].split())
    print(f"{bid}: {len(a) / SR:.2f}s -> {dur:.2f}s | {len(phrases)} frases | {words / dur:.1f} palavras/s | pico {np.abs(y).max() / 32768:.2f}")
    # mapa índice -> trecho: é o que cue(id, i) usa. Se a contagem não bater com a pontuação, ouvir/ajustar.
    if len(chunks) == len(phrases):
        for i, (c, ph) in enumerate(zip(chunks, phrases)):
            print(f"    [{i}] {ph[0]:5.2f}s  {c}")
    else:
        print(f"    ATENÇÃO: só {len(phrases)} pausas para {len(chunks)} trechos (o TTS emendou frases) — ouvir e conferir índices de cue()")
        for i, ph in enumerate(phrases):
            print(f"    [{i}] {ph[0]:5.2f}s")
json.dump(out, open(A / "durations.json", "w"), indent=1)
print("fala total", round(sum(v["dur"] for v in out.values()), 2), "s")
