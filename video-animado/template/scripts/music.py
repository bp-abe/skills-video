"""Trilha pelo Gemini Lyria -> public/audio/music_src.wav (44,1 kHz estéreo). Depois o sound.py ajusta à duração.

Uso:  python3 scripts/music.py            (rodar depois do tighten, para saber a duração)
      FORCE=1 python3 scripts/music.py    (gerar de novo mesmo sem mudança)
roteiro.json -> trilha: {"fonte": "lyria", "prompt": "…"}
- O prompt descreve a música do CONCEITO do vídeo: gênero, instrumentos, andamento (BPM), clima, arco
  (onde cresce, onde respira, final claro) e "instrumental, no vocals". A duração é acrescentada sozinha.
- Até 30s usa lyria-3-clip-preview; acima, lyria-3-pro-preview (respeita a duração pedida).
- Cache pelo hash do prompt + duração: não gasta requisição à toa.
"""
import base64, hashlib, json, os, shutil, subprocess, sys, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
R = json.load(open(ROOT / "roteiro.json"))
TR = R.get("trilha", {})
if TR.get("fonte") != "lyria": sys.exit("trilha.fonte não é 'lyria' — nada a fazer")
PROMPT = TR.get("prompt") or sys.exit("roteiro.json: definir trilha.prompt (a música do conceito)")
if json.load(open(ROOT / "roteiro.json")).get("offline"):
    sys.exit("roteiro.offline = true: sem chamadas de API — usar trilha.fonte = partitura ou arquivo")
KEY = os.environ.get("GEMINI_API_KEY") or sys.exit("GEMINI_API_KEY ausente: rode `source ~/.config/secrets.env` antes")

# duração: fala medida + intro/gaps/outro (mesma conta do sound.py) + 3s de sobra para o fade
d = json.load(open(ROOT / "public" / "audio" / "durations.json"))
total = R.get("intro", .8) + sum(v["dur"] for v in d.values()) + R.get("gap", .4) * (len(d) - 1) \
    + sum(b.get("extra", 0) for b in R["blocos"]) + R.get("outro", 2.6)
secs = int(total + 3)
model = "lyria-3-clip-preview" if secs <= 30 else "lyria-3-pro-preview"
text = f"{secs}-second instrumental track. {PROMPT} Clear ending at {secs} seconds. No vocals."

out = ROOT / "public" / "audio" / "music_src.wav"
meta = ROOT / "audio_raw" / "music.json"; meta.parent.mkdir(exist_ok=True)
h = hashlib.sha1(json.dumps([text, model]).encode()).hexdigest()[:12]
if out.exists() and meta.exists() and json.load(open(meta)).get("hash") == h and not os.environ.get("FORCE"):
    sys.exit(f"trilha sem mudança (cache) — {out.name}")

print(f"gerando {secs}s com {model}…")
req = urllib.request.Request(
    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    data=json.dumps({"contents": [{"parts": [{"text": text}]}], "generationConfig": {"responseModalities": ["AUDIO"]}}).encode(),
    headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=300) as r:
        j = json.load(r)
except urllib.error.HTTPError as e:
    sys.exit(f"Lyria HTTP {e.code}: {e.read()[:300].decode(errors='ignore')} — usar trilha.fonte = partitura como plano C")
parts = j["candidates"][0]["content"]["parts"]
audio = next((p["inlineData"] for p in parts if "inlineData" in p), None) or sys.exit("Lyria não devolveu áudio")
mp3 = ROOT / "audio_raw" / "music.mp3"
mp3.write_bytes(base64.b64decode(audio["data"]))
ff = [shutil.which("ffmpeg")] if shutil.which("ffmpeg") else ["npx", "remotion", "ffmpeg"]
subprocess.run(ff + ["-v", "error", "-y", "-i", str(mp3), "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", str(out)], check=True, cwd=ROOT)
json.dump({"hash": h, "model": model, "secs": secs, "prompt": text}, open(meta, "w"), indent=1)
print(f"ok {out.name} ({secs}s pedidos) — estrutura: {' '.join(p.get('text', '') for p in parts if 'text' in p)[:120]}")
