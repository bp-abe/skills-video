"""Monta a Mesa de Estilos: shell.html + estilos.json + (helpers.js + v1.js + grupos/g*.js) -> mesa-de-estilos.html.
Ordem das amostras: helpers (utilitários comuns) -> v1 (primeira versão, fallback) -> grupos (versões refinadas, sobrescrevem).
Estilo novo: ficha em estilos.json + R['<id>'] num arquivo de grupos/."""
import json
from pathlib import Path
H = Path(__file__).parent
js = "\n".join([(H / "helpers.js").read_text(), (H / "v1.js").read_text()] + [p.read_text() for p in sorted((H / "grupos").glob("g*.js"))])
data = "const DATA = " + json.dumps(json.load(open(H / "estilos.json")), ensure_ascii=False).replace("</", "<\\/") + ";"
out = (H / "shell.html").read_text().replace("/*__DATA__*/", data).replace("/*__RENDERERS__*/", js)
(H / "mesa-de-estilos.html").write_text(out); print("mesa-de-estilos.html", len(out) // 1024, "KB")
