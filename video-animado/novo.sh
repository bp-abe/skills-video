#!/bin/zsh
# Cria um projeto de vídeo a partir do template.
# Uso: bash ~/.claude/skills/video-animado/novo.sh <pasta-destino>
set -e
SKILL="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:?informe a pasta de destino}"
[ -e "$DEST/roteiro.json" ] && { echo "já existe projeto em $DEST"; exit 1; }
mkdir -p "$DEST" && rsync -a --exclude node_modules "$SKILL/template/" "$DEST/"
cd "$DEST"
# node_modules: clone APFS (instantâneo, sem ocupar disco) do template, que é a base de dependências da skill
if [ -d "$SKILL/template/node_modules" ]; then cp -Rc "$SKILL/template/node_modules" node_modules; else npm install --silent; fi
# Efeitos gravados da biblioteca (CC0): clone APFS, não ocupa disco. Catálogo: biblioteca/sfx/INDEX.md
mkdir -p public/audio/sfx/lib
for SRC in "$SKILL"/biblioteca/sfx/*/; do SRC="${SRC%/}"; cp -Rc "$SRC" public/audio/sfx/lib/ 2>/dev/null || cp -R "$SRC" public/audio/sfx/lib/; done
cp "$SKILL/biblioteca/sfx/index.json" public/audio/sfx/lib.json
cp "$SKILL/biblioteca/sfx/picos.json" public/audio/sfx/lib_picos.json 2>/dev/null || true
# Nada visual é pré-copiado (texturas, biblioteca): o projeto nasce neutro para não enviesar o estilo.
# Texturas: python3 scripts/textures.py <nome> · peças da biblioteca: copiar só a que o conceito escolhido pedir.
echo "projeto criado em $DEST — editar roteiro.json"
