#!/bin/bash
# Confere se esta máquina tem tudo o que as skills de vídeo usam. Não imprime chaves.
# Uso: bash verificar.sh     (ou: bash <(curl -s https://raw.githubusercontent.com/bp-abe/skills-video/main/verificar.sh))
S=~/.claude/skills; VA=$S/video-animado; I=${VIDEO_INSTRUMENTOS:-~/.local/share/video-animado/instrumentos}
ok() { printf "  ✅ %s\n" "$1"; }; nao() { printf "  ❌ %s\n" "$1"; }; aviso() { printf "  ⚠️  %s\n" "$1"; }
tem() { command -v "$1" >/dev/null 2>&1; }

echo "== Skills instaladas"
for k in video-animado pedido-de-video subir-videos; do [ -f "$S/$k/SKILL.md" ] && ok "$k" || nao "$k (copiar do repositório para $S/)"; done
if [ -f "$VA/SKILL.md" ]; then
  grep -q "Barra, sempre" "$VA/SKILL.md" && ok "versão com refino (barra de estúdio, passe de assets)" || nao "versão ANTIGA da video-animado (sem refino): reinstalar do GitHub"
  [ -f "$VA/template/scripts/midi_lib.py" ] && ok "versão com trilha MIDI" || nao "sem trilha MIDI (versão antiga)"
  [ -f "$VA/references/critica.md" ] && ok "crítica com nota" || nao "sem crítica (versão antiga)"
  [ -d "$VA/template/node_modules" ] && ok "dependências do Remotion instaladas" || nao "falta: cd $VA/template && npm install"
fi

echo "== Ferramentas"
tem node && ok "node $(node -v)" || nao "node (brew install node)"
if tem ffmpeg; then ffmpeg -hide_banner -filters 2>/dev/null | grep -q alimiter && ok "ffmpeg do sistema com filtros" || aviso "ffmpeg sem alimiter/loudnorm"; else nao "ffmpeg do sistema (brew install ffmpeg)"; fi
python3 -c "import numpy, PIL" 2>/dev/null && ok "python3 com numpy e pillow" || nao "python3 -m pip install numpy pillow"
tem fluidsynth && ok "fluidsynth" || nao "fluidsynth (brew install fluid-synth) — trilha MIDI"
[ -x ~/.venvs/tts-local/bin/python ] && ~/.venvs/tts-local/bin/python -c "import faster_whisper" 2>/dev/null && ok "venv tts-local (transcrição)" || nao "venv tts-local com faster-whisper (conferir voz, alinhar)"
[ -x ~/.venvs/voxcpm/bin/python ] && ~/.venvs/voxcpm/bin/python -c "import voxcpm" 2>/dev/null && ok "venv voxcpm (voz local)" || aviso "sem VoxCPM: voz só pelo Gemini"
[ -x ~/.venvs/musica/bin/python ] && ~/.venvs/musica/bin/python -c "import pretty_midi" 2>/dev/null && ok "venv musica (trilha MIDI)" || nao "venv musica (trilha MIDI padrão)"
[ -d "$I/VSCO-2-CE" ] && ok "VSCO 2 (orquestra gravada)" || aviso "sem VSCO: a trilha toca só em General MIDI (som pior)"
[ -f "$I/GeneralUser-GS/GeneralUser-GS.sf2" ] && ok "GeneralUser GS" || nao "GeneralUser GS (trilha MIDI)"
ls "$VA/biblioteca/vozes/"*/ref.wav >/dev/null 2>&1 && ok "voz clonada: $(ls -d "$VA/biblioteca/vozes/"*/ | xargs -n1 basename | tr '\n' ' ')" || aviso "nenhuma voz clonada em biblioteca/vozes (o padrão VoxCPM fica sem referência)"

echo "== Chave do Gemini (voz, trilha Lyria, IMAGENS do passe de assets)"
[ -f ~/.config/secrets.env ] && . ~/.config/secrets.env
if [ -n "$GEMINI_API_KEY" ]; then
  c=$(curl -s -o /dev/null -w "%{http_code}" -H "x-goog-api-key: $GEMINI_API_KEY" "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1")
  [ "$c" = "200" ] && ok "chave válida (sem gastar nada; geração de imagem exige faturamento ativo no Google Cloud)" || nao "chave recusada (HTTP $c)"
else nao "GEMINI_API_KEY ausente: sem imagens geradas, o vídeo fica com desenho em código (bem mais pobre)"; fi

echo "== Máquina"
echo "  $(sysctl -n machdep.cpu.brand_string 2>/dev/null) · $(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1073741824 )) GB RAM"
CL=$(command -v claude || ls ~/.local/bin/claude 2>/dev/null); [ -n "$CL" ] && echo "  Claude Code $($CL --version 2>/dev/null | head -1)" || echo "  Claude Code não encontrado no terminal"
echo "  Modelo e esforço: no Claude Code, digite /model e /effort e anote (vídeo novo pede o modelo mais forte e esforço alto)."
