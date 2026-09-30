"""Passe de assets: gera as imagens DESTE vídeo pelo modelo de imagem do Gemini, todas no tratamento da bíblia.

roteiro.json:
  "tratamento_imagem": "o tratamento da bíblia em inglês (técnica, traço, luz, paleta, textura)" — vai em TODO prompt;
  "imagens": [{"name", "prompt", "aspect": "9:16"|"16:9"|"1:1"|"3:4", "recorte": true?, "ref": ["public/img/plate.jpg"]?,
               "size": "2K"?, "model"?}]
- ref: imagens de referência de estilo (a 1ª gerada costuma virar a referência das outras: mesmo tratamento em tudo);
- recorte: pede fundo verde chapado e recorta com despill (fundo branco comia objetos claros — edredom, papel);
- 2K por padrão (plate de 768 px esticado em 1080×1920 fica mole).
Uso: source ~/.config/secrets.env && python3 scripts/img.py [nome ...]   (gera na ordem da lista; nomes = só esses)
Saída: public/img/<name>.png (recorte) ou .jpg; bruto em assets_raw/. Se todos os modelos falharem, sai com código 2
-> desenhar em código (SVG/Canvas) com o mesmo cuidado.
"""
import base64, io, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "img"; OUT.mkdir(parents=True, exist_ok=True)
RAW = ROOT / "assets_raw"; RAW.mkdir(exist_ok=True)
MODELS = ["gemini-3.1-flash-image", "gemini-3-pro-image", "gemini-2.5-flash-image"]
R = json.load(open(ROOT / "roteiro.json"))
if R.get("offline"):
    sys.exit("roteiro.offline = true: sem chamadas de API — desenhar os assets em código (SVG/Canvas)")
KEY = os.environ.get("GEMINI_API_KEY") or sys.exit("GEMINI_API_KEY ausente: rode `source ~/.config/secrets.env` antes")
TRAT = R.get("tratamento_imagem", "")


def call(model, prompt, aspect, size, refs):
    parts = [{"text": prompt}]
    for r in refs:
        parts.append({"inline_data": {"mime_type": "image/png" if r.endswith("png") else "image/jpeg",
                                      "data": base64.b64encode(Path(r).read_bytes()).decode()}})
    cfg = {"aspectRatio": aspect}
    if size and not model.startswith("gemini-2"):
        cfg["imageSize"] = size
    body = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": cfg}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                 data=json.dumps(body).encode(), headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        j = json.load(r)
    for part in j["candidates"][0]["content"]["parts"]:
        d = part.get("inlineData") or part.get("inline_data")
        if d:
            return base64.b64decode(d["data"])
    raise ValueError("resposta sem imagem: " + json.dumps(j)[:300])


def recorta_verde(raw, path):
    a = np.asarray(Image.open(io.BytesIO(raw)).convert("RGB"), float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    verde = g - np.maximum(r, b)  # quanto o pixel é "fundo verde"
    alpha = np.clip(1 - (verde - 25) / 60, 0, 1)
    g2 = np.where(verde > 0, np.maximum(r, b) + np.clip(verde, 0, 12), g)  # despill: tira o verde da borda
    im = Image.fromarray(np.dstack([r, g2, b]).clip(0, 255).astype("uint8"))
    im.putalpha(Image.fromarray((alpha * 255).astype("uint8")).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0)))
    im.crop(im.getbbox()).save(path)


def gen(s):
    prompt = s["prompt"] + (f"\n\nArt treatment (must match exactly): {TRAT}" if TRAT else "")
    if s.get("recorte"):
        prompt += ("\nIsolated single object on a perfectly flat, uniform pure chroma green background (#00FF00), no shadow "
                   "on the background, no floor, no gradient, sharp clean silhouette edges, nothing touching the frame border.")
    refs = [str(ROOT / r) for r in s.get("ref", [])]
    for model in [s["model"]] if s.get("model") else MODELS:
        for attempt in range(2):
            try:
                raw = call(model, prompt, s.get("aspect", "1:1"), s.get("size", "2K"), refs)
                (RAW / f"{s['name']}.png").write_bytes(raw)
                if s.get("recorte"):
                    recorta_verde(raw, OUT / f"{s['name']}.png")
                else:
                    Image.open(io.BytesIO(raw)).convert("RGB").save(OUT / f"{s['name']}.jpg", quality=92)
                print(f"ok {s['name']} [{model}] {Image.open(io.BytesIO(raw)).size}", flush=True); return True
            except urllib.error.HTTPError as e:
                msg = e.read()[:300].decode(errors="ignore")
                print(f"  {s['name']} {model} HTTP {e.code}: {msg}", file=sys.stderr, flush=True)
                if e.code in (400, 403, 404) or (e.code == 429 and "quota" in msg.lower()):
                    break
                time.sleep(15 * (attempt + 1))
            except Exception as e:
                print(f"  {s['name']} {model} {type(e).__name__}: {e}", file=sys.stderr, flush=True); time.sleep(5)
    return False


want = set(sys.argv[1:])
failed = [s["name"] for s in R.get("imagens", []) if (not want or s["name"] in want) and not gen(s)]
if failed:
    print("SEM IMAGEM para:", failed, "-> desenhar em código (SVG/Canvas)", file=sys.stderr); sys.exit(2)
