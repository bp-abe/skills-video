"""Alinha cada bloco por PALAVRA (faster-whisper local) e reescreve as frases do durations.json.
Rodar depois do tighten, quando ele acusar ATENÇÃO ou trecho com duração estranha:
  ~/.cache/whisper-venv/bin/python scripts/align.py
- frases = trechos da pontuação do roteiro (mesmo índice de cue(id, i)), com início/fim medidos nas palavras;
- public/words.json = {bloco: [[palavra_do_roteiro, início, fim], ...]} para cueW(id, 'palavra').
Texto do roteiro × transcrição casados por difflib (número por extenso, hífen etc. não quebram)."""
import difflib, json, re, unicodedata
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "public" / "audio"
R = json.load(open(ROOT / "roteiro.json"))
D = json.load(open(A / "durations.json"))
norm = lambda w: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", w.lower()).encode("ascii", "ignore").decode())
model = WhisperModel("medium", compute_type="int8")
words_out = {}
for b in R["blocos"]:
    bid, text = b["id"], b["texto"].strip()
    segs, _ = model.transcribe(str(A / f"{bid}.wav"), language="pt", word_timestamps=True, initial_prompt=text)
    hw = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    tw = text.split()
    sm = difflib.SequenceMatcher(None, [norm(w) for w in tw], [norm(w[0]) for w in hw], autojunk=False)
    t2h = {}
    for a, bb, n in sm.get_matching_blocks():
        for k in range(n): t2h[a + k] = bb + k
    # palavras do roteiro sem par: interpolar entre vizinhas casadas
    times = []
    for i in range(len(tw)):
        if i in t2h: times.append([hw[t2h[i]][1], hw[t2h[i]][2]]); continue
        prev = max([j for j in t2h if j < i], default=None); nxt = min([j for j in t2h if j > i], default=None)
        s = hw[t2h[prev]][2] if prev is not None else 0.12
        e = hw[t2h[nxt]][1] if nxt is not None else D[bid]["dur"] - 0.12
        times.append([s, e])
    miss = len(tw) - len(t2h)
    words_out[bid] = [[w, round(s, 3), round(e, 3)] for w, (s, e) in zip(tw, times)]
    chunks = [c for c in re.split(r"(?<=[,.;:!?—…])\s+", text) if c]
    ph, k = [], 0
    for c in chunks:
        n = len(c.split()); ph.append([round(times[k][0], 3), round(times[k + n - 1][1], 3)]); k += n
    D[bid]["phrases"] = ph
    print(f"{bid}: {len(tw)} palavras, {miss} sem par | transcrito: {' '.join(w[0] for w in hw)}")
    for i, (c, p) in enumerate(zip(chunks, ph)):
        print(f"    [{i}] {p[0]:5.2f}–{p[1]:5.2f}s  {c}")
json.dump(D, open(A / "durations.json", "w"), indent=1)
json.dump(words_out, open(ROOT / "public" / "words.json", "w"), ensure_ascii=False, indent=0)
