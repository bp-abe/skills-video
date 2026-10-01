#!/bin/zsh
# Renderiza cada formato de roteiro.json, re-encoda (faststart, CRF 23) e extrai stills para QA.
# Uso: bash scripts/render.sh [16x9|9x16]   (sem argumento: todos os formatos do roteiro)
set -e
cd "$(dirname "$0")/.."
SLUG=$(python3 -c "import json,re,unicodedata;t=json.load(open('roteiro.json'))['titulo'];t=unicodedata.normalize('NFKD',t).encode('ascii','ignore').decode();print(re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-'))")
if [ $# -gt 0 ]; then LIST="$*"; else LIST=$(python3 -c "import json;print(' '.join(json.load(open('roteiro.json'))['formatos']))"); fi
# $(...) sem aspas é separado em palavras tanto no bash quanto no zsh (roda com `bash` ou `zsh`)
TOTAL=$(python3 -c "import json;t=json.load(open('public/timeline.json'));print(int(t['total']*t['fps']))")
COMP=$(python3 -c "import json;print('Edicao' if json.load(open('public/edit/edl.json')).get('segs') else 'Video')" 2>/dev/null || echo Video)  # modo edição x animação
FF=$(command -v ffmpeg || { echo "precisa do ffmpeg do sistema (brew install ffmpeg): o do Remotion não tem loudnorm" >&2; exit 1; })
mkdir -p out/stills
for F in $(echo $LIST); do
  npx remotion render "$COMP-$F" "out/_raw_$F.mp4" --crf=20 --log=error
  # −14 LUFS sem achatar o arco: mede o integrado, aplica ganho fixo e limita só os picos.
  # (o loudnorm, mesmo em duas passadas com linear=true, cai para o modo dinâmico quando o pico não cabe e comprime)
  G=$($FF -hide_banner -i "out/_raw_$F.mp4" -af loudnorm=I=-14:TP=-1:LRA=20:print_format=json -f null - 2>&1 | python3 -c "import sys,json,re;j=json.loads(re.findall(r'\{[^{}]*\}',sys.stdin.read())[-1]);print(round(-14-float(j['input_i']),2))")
  $FF -v error -i "out/_raw_$F.mp4" -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
    -af "volume=${G}dB,alimiter=limit=0.89:attack=4:release=60:level=disabled" -ar 48000 -c:a aac -b:a 192k -movflags +faststart -y "out/${SLUG}_$F.mp4"
  rm "out/_raw_$F.mp4"
  # stills em 8 pontos do vídeo para revisar layout (abrir os PNG e olhar)
  for i in 1 2 3 4 5 6 7 8; do
    npx remotion still "$COMP-$F" "out/stills/${F}_$i.png" --frame=$(( TOTAL * (2 * i - 1) / 16 )) --log=error
  done
  ls -lh "out/${SLUG}_$F.mp4"
done
