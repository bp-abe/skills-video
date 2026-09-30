"""Confere a narração gravada contra o roteiro, com transcrição local (faster-whisper, sem API).

Uso:  ~/.venvs/tts-local/bin/python scripts/check_voz.py [id ...]
Para cada bloco: transcreve audio_raw/<id>.wav, compara palavra a palavra com o texto do roteiro e aponta
palavras faltando, trocadas ou sobrando (número lido errado, palavra engolida, nome mal pronunciado).
Sai com código 1 se algum bloco passar de 10% de erro — regravar esse bloco (FORCE=1 python3 scripts/tts.py <id>)
ou ajustar a grafia no texto (ex.: sigla por extenso, número por extenso, nome estrangeiro aportuguesado).
Obs.: a transcrição também erra; diferença só de pontuação/maiúscula é ignorada.
"""
import difflib, json, re, sys, unicodedata, warnings
warnings.filterwarnings("ignore")
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
R = json.load(open(ROOT / "roteiro.json"))
LIMITE = 0.10


def palavras(t):
    t = unicodedata.normalize("NFC", t.lower())
    t = re.sub(r"(\d)\.(\d{3})", r"\1\2", t)  # "28.800" → "28800" (o Whisper escreve milhar com ponto)
    try:
        from num2words import num2words
        t = re.sub(r"\d+", lambda m: num2words(int(m.group()), lang="pt_BR").replace(",", ""), t)
    except ImportError:
        pass
    return re.findall(r"[a-zà-ÿ0-9]+", t)


from faster_whisper import WhisperModel
model = WhisperModel("small", device="cpu", compute_type="int8")
only = set(sys.argv[1:])
ruins = []
for b in R["blocos"]:
    if only and b["id"] not in only: continue
    wav = ROOT / "audio_raw" / f"{b['id']}.wav"
    if not wav.exists():
        print(f"{b['id']}: sem áudio"); continue
    segs, _ = model.transcribe(str(wav), language="pt", beam_size=5)
    ouvido = " ".join(s.text.strip() for s in segs)
    ref, hyp = palavras(b["texto"]), palavras(ouvido)
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    erros, notas = 0, []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal": continue
        erros += max(i2 - i1, j2 - j1)
        esperado, veio = " ".join(ref[i1:i2]), " ".join(hyp[j1:j2])
        notas.append({"replace": f"'{esperado}' → '{veio}'", "delete": f"faltou '{esperado}'", "insert": f"sobrou '{veio}'"}[op])
    taxa = erros / max(1, len(ref))
    marca = "ok" if taxa <= LIMITE else "REGRAVAR"
    print(f"{b['id']}: {taxa:.0%} de diferença — {marca}")
    for n in notas: print(f"    {n}")
    if taxa > LIMITE: ruins.append(b["id"])
if ruins:
    print(f"\nBlocos acima de {LIMITE:.0%}: {' '.join(ruins)}"); sys.exit(1)
