"""TTS local (sem API). Roda no ambiente ~/.venvs/tts-local — chamado pelo tts.py, não direto.

Entrada (stdin, JSON): {"motor": "kokoro"|"chatterbox", "voz": "pf_dora"|…, "params": {...},
                        "blocos": [{"id": "b1", "texto": "…", "saida": "/…/b1.wav"}, …]}
Carrega o modelo UMA vez e grava todos os blocos em WAV 24 kHz mono 16-bit (o formato que o tighten espera).
- voxcpm: VoxCPM2 (48 kHz, reamostrado): params.referencia + referencia_texto (clone fiel) · params.referencia +
  params.controle (clone controlável: mesmo timbre, leitura dirigida — ex. "narrador de documentário, grave, solene") ·
  params.descricao (voz desenhada, sem clone).
- kokoro: vozes PT-BR pf_dora (F), pm_alex (M), pm_santa (M); params.velocidade (padrão 1.0).
- chatterbox: params.emocao (exaggeration, 0.25–1.0, padrão 0.5), params.ritmo (cfg_weight, padrão 0.5),
  params.referencia (WAV de ~10s para clonar a voz — só com autorização de quem fala).
  Números viram extenso (o modelo erra algarismos: "1914" saía "1994").
"""
import json, os, re, sys, warnings
warnings.filterwarnings("ignore"); os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
import numpy as np, soundfile as sf

SR = 24000
job = json.load(sys.stdin)
motor, params = job["motor"], job.get("params", {})

# Uma voz pesada por vez NA MÁQUINA (VoxCPM2 ocupa 10–13 GB; duas juntas levam o Mac a dezenas de GB de swap).
# Trava global: outro projeto/sessão que chamar espera aqui, sem carregar o modelo. Solta ao sair do processo.
if motor in ("voxcpm", "chatterbox"):
    import fcntl, time
    _trava = open(os.path.expanduser("~/.cache/tts-local.lock"), "a+")
    try:
        fcntl.flock(_trava, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("outra voz local está gravando: esperando ela terminar…", file=sys.stderr, flush=True)
        t0 = time.time(); fcntl.flock(_trava, fcntl.LOCK_EX)
        print(f"liberado após {time.time() - t0:.0f}s", file=sys.stderr, flush=True)


def to_24k(w, sr):
    w = np.asarray(w, dtype=np.float32).squeeze()
    if sr != SR:
        w = np.interp(np.arange(0, len(w), sr / SR), np.arange(len(w)), w)
    return w


def extenso(t):
    from num2words import num2words
    return re.sub(r"\d+", lambda m: num2words(int(m.group()), lang="pt_BR").replace(",", ""), t)


if motor == "kokoro":
    from kokoro import KPipeline
    pipe = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M")
    voz = job.get("voz") or "pf_dora"
    def gen(t):
        parts = [a.numpy() if hasattr(a, "numpy") else a for _, _, a in pipe(t, voice=voz, speed=params.get("velocidade", 1.0))]
        return np.concatenate(parts), 24000
elif motor == "chatterbox":
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    m = ChatterboxMultilingualTTS.from_pretrained(device="mps" if torch.backends.mps.is_available() else "cpu")
    kw = dict(language_id="pt", exaggeration=params.get("emocao", 0.5), cfg_weight=params.get("ritmo", 0.5))
    if params.get("referencia"):
        kw["audio_prompt_path"] = os.path.expanduser(params["referencia"])
    def gen(t):
        return m.generate(extenso(t), **kw).squeeze().cpu().numpy(), m.sr
elif motor == "voxcpm":
    from voxcpm import VoxCPM
    m = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
    ref, ref_txt, desc = params.get("referencia"), params.get("referencia_texto"), params.get("descricao")
    kw = dict(cfg_value=params.get("cfg", 2.0), inference_timesteps=params.get("passos", 10))
    ctrl = params.get("controle")  # clone controlável: timbre da referência + direção de leitura entre parênteses
    if ref and ctrl:
        kw["reference_wav_path"] = os.path.expanduser(ref)
    elif ref:
        kw["prompt_wav_path"] = os.path.expanduser(ref)
        if ref_txt: kw["prompt_text"] = ref_txt  # transcrição exata da referência melhora muito a clonagem
    pre = f"({ctrl})" if (ref and ctrl) else (f"({desc})" if desc and not ref else "")
    def gen(t):
        return m.generate(text=pre + t, **kw), m.tts_model.sample_rate
else:
    sys.exit(f"motor desconhecido: {motor}")

for b in job["blocos"]:
    w, sr = gen(b["texto"])
    w = to_24k(w, sr)
    w = w / max(1e-6, np.abs(w).max()) * 0.9
    sf.write(b["saida"], (w * 32767).astype(np.int16), SR, subtype="PCM_16")
    print(json.dumps({"id": b["id"], "dur": round(len(w) / SR, 2)}), flush=True)
