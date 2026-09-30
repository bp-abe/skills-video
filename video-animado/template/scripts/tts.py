"""Narração bloco a bloco -> audio_raw/<id>.wav. Gemini TTS (API) ou local (sem API).

Voz (roteiro.json -> voz):
- nome de voz do Gemini (Kore, Charon, …) → API; exige GEMINI_API_KEY
- "kokoro:pf_dora" | "kokoro:pm_alex" | "kokoro:pm_santa" → local, rápido (~3s/bloco)
- "chatterbox" → local, mais expressivo e lento (~20–40s/bloco); roteiro.voz_params = {"emocao", "ritmo", "referencia"}
- "voxcpm" → local (VoxCPM2, env ~/.venvs/voxcpm); clona com voz_params = {"referencia", "referencia_texto"} ou cria voz
  por descrição com voz_params.descricao ("mulher brasileira, 30 anos, calorosa…"); ~5–10 s/bloco
  Os locais rodam no ambiente ~/.venvs/tts-local (ver references/gemini.md §TTS local).
- roteiro.offline = true → recusa voz de API.

Uso:  source ~/.config/secrets.env && python3 scripts/tts.py [id ...]
- Sem ids: gera só os blocos cujo texto/voz/estilo mudou (cache em audio_raw/<id>.json).
  Isso importa: o free tier do 3.8 tem ~10 requisições/dia.
- TTS_MODEL=2.5 força o fallback; FORCE=1 regrava mesmo sem mudança; STRICT=1 insiste no 3.8 (sem fallback).
- Se o 3.8 devolver 429, cai para o 2.5 no mesmo bloco e avisa (timbre muda um pouco: registrar no ANALISE).
"""
import base64, hashlib, json, os, re, sys, time, urllib.error, urllib.request, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio_raw"; OUT.mkdir(exist_ok=True)
R = json.load(open(ROOT / "roteiro.json"))
VOICE, STYLE = R.get("voz"), R.get("estilo_voz", "")
if not VOICE: sys.exit("roteiro.json: definir `voz` (e `estilo_voz`) — sem padrão, de propósito")
LOCAL = VOICE.split(":")[0] in ("kokoro", "chatterbox", "voxcpm")
# cada motor local tem seu ambiente (VoxCPM2 exige torch mais novo que o do Chatterbox)
VENV = Path.home() / ".venvs" / ("voxcpm" if VOICE.startswith("voxcpm") else "tts-local") / "bin" / "python"
if R.get("offline") and not LOCAL:
    sys.exit("roteiro.offline = true: usar voz local (kokoro:pf_dora | kokoro:pm_alex | kokoro:pm_santa | chatterbox)")
if LOCAL and not VENV.exists():
    sys.exit(f"TTS local não instalado ({VENV}) — ver references/gemini.md §TTS local")
KEY = os.environ.get("GEMINI_API_KEY") if not LOCAL else None
if not LOCAL and not KEY: sys.exit("GEMINI_API_KEY ausente: rode `source ~/.config/secrets.env` antes")
BASE = "https://generativelanguage.googleapis.com/v1beta"


def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def find_audio(o):
    if isinstance(o, dict):
        for k in ("data", "audioData"):
            if isinstance(o.get(k), str) and len(o[k]) > 1000:
                return o[k]
        o = list(o.values())
    if isinstance(o, list):
        for v in o:
            r = find_audio(v)
            if r:
                return r


def tts_38(text, style):
    j = post(f"{BASE}/interactions", {
        "model": "gemini-3.8-flash-tts",
        "input": [{"type": "user_input", "content": [{"type": "text", "text": text,
                   "annotations": [{"type": "speech_metadata", "style": style}]}]}],
        "response_format": {"type": "audio"},
        "generation_config": {"speech_config": [{"voice": VOICE}]}})
    return base64.b64decode(find_audio(j))


def tts_25(text, style):
    j = post(f"{BASE}/models/gemini-2.5-flash-preview-tts:generateContent", {
        "contents": [{"parts": [{"text": f"Leia como {style}: {text}" if style else text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
                             "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}})
    return base64.b64decode(find_audio(j))


def synth(text, style):
    models = [("2.5", tts_25)] if os.environ.get("TTS_MODEL") == "2.5" else [("3.8", tts_38), ("2.5", tts_25)]
    strict = os.environ.get("STRICT") == "1"  # insiste no 3.8 (o 429 "per day" é intermitente), sem cair para o 2.5
    if strict: models = models[:1]
    for name, fn in models:
        for attempt in range(30 if strict else 4):
            try:
                return name, fn(text, style)
            except urllib.error.HTTPError as e:
                msg = e.read()[:200].decode(errors="ignore")
                print(f"  {name} HTTP {e.code}: {msg}", file=sys.stderr)
                if e.code == 429 and "quota" in msg.lower():
                    break  # cota diária: não adianta esperar, vai para o próximo modelo
                m = re.search(r"retry in (\d+)s", msg)
                time.sleep(int(m.group(1)) + 2 if m else 20 * (attempt + 1))
            except Exception as e:
                print(f"  {name} {type(e).__name__}", file=sys.stderr); time.sleep(10)
    sys.exit("TTS falhou em todos os modelos")


only = set(sys.argv[1:])
pending = []
for b in R["blocos"]:
    if only and b["id"] not in only:
        continue
    wav, meta = OUT / f"{b['id']}.wav", OUT / f"{b['id']}.json"
    style = b.get("estilo_voz", STYLE)  # estilo por bloco (ex.: slogan lido numa só respiração)
    key = [b["texto"], VOICE, style] + ([R.get("voz_params", {})] if LOCAL else [])
    h = hashlib.sha1(json.dumps(key, sort_keys=True).encode()).hexdigest()[:12]
    if not only and not os.environ.get("FORCE") and wav.exists() and meta.exists() and json.load(open(meta))["hash"] == h:
        print(f"{b['id']}: sem mudança (cache)"); continue
    pending.append((b, wav, meta, h, style))

if LOCAL and pending:
    import subprocess
    motor, _, voz = VOICE.partition(":")
    job = {"motor": motor, "voz": voz, "params": R.get("voz_params", {}),
           "blocos": [{"id": b["id"], "texto": b["texto"], "saida": str(wav)} for b, wav, *_ in pending]}
    print(f"gravando {len(pending)} bloco(s) localmente com {VOICE}…", file=sys.stderr)
    proc = subprocess.run([str(VENV), str(Path(__file__).with_name("tts_local.py"))], input=json.dumps(job),
                          text=True, capture_output=True)
    if proc.returncode != 0:
        sys.exit("TTS local falhou:\n" + proc.stderr[-1500:])
    for b, wav, meta, h, _ in pending:
        json.dump({"hash": h, "model": f"local:{VOICE}", "voice": VOICE}, open(meta, "w"))
        with wave.open(str(wav)) as w:
            print(f"{b['id']}: {w.getnframes() / w.getframerate():.2f}s  [local:{VOICE}]")
else:
    for b, wav, meta, h, style in pending:
        model, raw = synth(b["texto"], style)
        if raw[:4] != b"RIFF":  # PCM cru 24 kHz mono 16-bit
            with wave.open(str(wav), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(raw)
        else:
            wav.write_bytes(raw)
        json.dump({"hash": h, "model": model, "voice": VOICE}, open(meta, "w"))
        with wave.open(str(wav)) as w:
            print(f"{b['id']}: {w.getnframes() / w.getframerate():.2f}s  [{model}]")
ids = {b["id"] for b in R["blocos"]}
models = {json.load(open(p))["model"] for p in OUT.glob("*.json") if p.stem in ids}
if len(models) > 1:
    print(f"AVISO: blocos gravados em modelos diferentes {sorted(models)} — timbre pode variar", file=sys.stderr)
