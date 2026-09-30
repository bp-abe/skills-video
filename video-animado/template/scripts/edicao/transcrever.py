"""Modo edição, passo 1: transcreve o vídeo gravado com o tempo de cada palavra (faster-whisper local, sem API).

Uso:  ~/.venvs/tts-local/bin/python scripts/edicao/transcrever.py <video> [--modelo small|medium] [--idioma pt]
Saída: public/edit/palavras.json  {"fonte", "dur", "w", "h", "palavras": [{"w", "s", "e", "p"}]}  (tempos no vídeo ORIGINAL)
e public/edit/fonte.<ext> (cópia/clone do vídeo, para o Remotion ler com staticFile).
"""
import argparse, json, shutil, subprocess, sys, warnings
warnings.filterwarnings("ignore")
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--modelo", default="small"); ap.add_argument("--idioma", default="pt")
a = ap.parse_args(); args_idioma = a.idioma
src = Path(a.video).expanduser().resolve()
if not src.exists(): sys.exit(f"vídeo não encontrado: {src}")
E = ROOT / "public" / "edit"; E.mkdir(parents=True, exist_ok=True)
dst = E / f"fonte{src.suffix.lower()}"
if not dst.exists() or dst.stat().st_size != src.stat().st_size:
    if subprocess.run(["cp", "-c", str(src), str(dst)]).returncode: shutil.copy(src, dst)  # clone APFS quando dá
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(dst)],
                                  capture_output=True, text=True).stdout)
vs = next(s for s in probe["streams"] if s["codec_type"] == "video")
from faster_whisper import WhisperModel
m = WhisperModel(a.modelo, device="cpu", compute_type="int8")
segs, info = m.transcribe(str(dst), language=a.idioma, beam_size=5, word_timestamps=True, vad_filter=False,
                          condition_on_previous_text=False)
pal = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)}
       for s in segs for w in (s.words or []) if w.word.strip()]

# 2ª passada nas palavras esticadas: o Whisper "limpa" hesitação e repetição engolindo-as numa palavra longa
# (ex.: "que" com 1,6 s escondendo "e o dia parece que"). Transcrita isolada, sem contexto, a palavra revela o que tinha.
import re
from faster_whisper.audio import decode_audio
audio = decode_audio(str(dst), sampling_rate=16000)
norm = lambda w: re.sub(r"[^a-z0-9à-ÿ]", "", w.lower())
refeitas = 0
for k in range(len(pal) - 1, -1, -1):
    w = pal[k]; plaus = .25 + .07 * len(norm(w["w"]))
    if w["e"] - w["s"] <= max(.8, 2 * plaus): continue
    a, b = max(0, w["s"] - .05), w["e"] + .05
    sub, _ = m.transcribe(audio[int(a * 16000):int(b * 16000)], language=args_idioma, beam_size=5, word_timestamps=True,
                          condition_on_previous_text=False)
    novas = [{"w": x.word.strip(), "s": round(a + x.start, 3), "e": round(a + x.end, 3), "p": round(x.probability, 2), "refeita": True}
             for sg in sub for x in (sg.words or []) if x.word.strip()]
    if len(novas) > 1 or (novas and novas[-1]["e"] - novas[-1]["s"] < w["e"] - w["s"] - .3):
        pal[k:k + 1] = novas; refeitas += 1
        print(f"  palavra esticada '{w['w']}' ({w['e'] - w['s']:.1f}s) → {' '.join(x['w'] for x in novas)}")
out = {"fonte": dst.name, "original": str(src), "dur": float(probe["format"]["duration"]),
       "w": vs["width"], "h": vs["height"], "palavras": pal}
json.dump(out, open(E / "palavras.json", "w"), ensure_ascii=False, indent=0)
print(f"{len(pal)} palavras em {out['dur']:.1f}s ({vs['width']}x{vs['height']}) → public/edit/palavras.json")
print(" ".join(p["w"] for p in pal)[:600])
