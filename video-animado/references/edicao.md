# Modo edição — vídeo gravado

Para quando o material é **uma gravação** (entrevista, depoimento, trecho de documentário, live, tela gravada) e o
pedido é cortar, dar ritmo, legendar e finalizar — não criar animação do zero. Referências: Pause (pausevfx.com) e o
vídeo do video-use em `referencias.md`.

## Fluxo

```
transcrever → quadros (assistir) → edicao.json → cortar → sound → render → premiere
```

1. `bash ~/.claude/skills/video-animado/novo.sh ~/videos/<slug>` e, no `roteiro.json`: `titulo`, `formatos`
   (9x16 para Reels, 16x9, 1x1), `trilha` (pode ser `partitura`, `lyria` ou `arquivo`), `blocos: []`.
2. **Transcrever**: `~/.venvs/tts-local/bin/python scripts/edicao/transcrever.py <video> [--modelo medium]`
   → `public/edit/palavras.json` (tempo de cada palavra) + cópia do vídeo em `public/edit/`.
   Palavra "esticada" (o Whisper engole hesitação ou repetição dentro de uma palavra longa) é transcrita de novo,
   isolada, e revela o que escondia. O relatório lista cada caso.
3. **Assistir**: `python3 scripts/edicao/quadros.py [--passo 2]` → `out/edit/quadros_NN.png` com grade 0–1 e a fala de
   cada quadro. Abrir com Read. Decidir o que fica, onde dar zoom e foco (x, y lidos na grade), onde congelar e escrever.
4. **Escrever `public/edit/edicao.json`** (esquema abaixo). Âncoras sempre por **palavra falada**, não por segundo.
5. **Cortar**: `python3 scripts/edicao/cortar.py` → `public/edit/edl.json` + `public/timeline.json`. Relata o que saiu
   (vícios, repetições, correções, tomadas). **Conferir a lista**: é a parte mais sensível.
6. **Som**: `python3 scripts/sound.py` (a trilha usa a linha do tempo da edição; `trilha.intensidade` por fala `f1..fn`).
7. **Render**: `bash scripts/render.sh 9x16` (detecta o modo e usa a composição `Edicao-*`).
8. **Conferir**: transcrever o MP4 final (`check` rápido com faster-whisper) — tem que ler como fala limpa, sem
   repetição nem pedaço de tomada errada. Extrair quadros dos momentos de efeito e olhar.
9. **Entrega editável**: `python3 scripts/edicao/premiere.py 9x16` → `out/<slug>_edicao.xml` (Premiere: Arquivo >
   Importar; aponta para o vídeo ORIGINAL) + `out/<slug>_legenda.srt`. Zooms, focos, textos e sons vão como marcadores.

## `edicao.json`

```json
{
  "trechos": [[12.0, 48.5], [95.2, 130.0]],
  "cortes": {"max_pausa": 0.35, "pausa_alvo": 0.15, "repeticoes": true, "vicios": ["ahn", "hum", "hã", "éé"]},
  "enquadramento": {"x": 0.5, "y": 0.45},
  "zooms":   [{"palavra": "livro", "n": 1, "antes": 0.3, "dur": 2.2, "x": 0.3, "y": 0.45, "escala": 1.6}],
  "focos":   [{"palavra": "gráfico", "dur": 2.0, "x": 0.72, "y": 0.3, "w": 0.3, "h": 0.28, "seta": "auto"}],
  "congelar":[{"palavra": "né?", "dur": 1.2, "texto": "Espera…"}],
  "textos":  [{"palavra": "mudou", "dur": 1.6, "texto": "UM LIVRO\nQUE MUDOU TUDO", "y": 0.3}],
  "sfx":     [{"palavra": "senhora", "familia": "impact-sounds/impact_soft_medium", "v": 0.35}],
  "legendas":{"palavras_por_grupo": 3, "pos_y": 0.68, "cor": "#ffd400"},
  "volume_voz": 1.0
}
```

- `trechos`: tempos do **original** (para tirar um Reels de uma entrevista longa). Vazio = vídeo inteiro.
- Âncora: `palavra` (grafia da transcrição, sem acento faz diferença), `n` = ocorrência depois dos cortes, `antes` =
  antecipação em s. Ou `t` em segundos da edição final.
- `enquadramento`: centro do recorte (0–1 do original). No 9:16 a partir de 16:9, é quem fica no quadro.
- `zooms`: `x, y` = ponto que vai para o centro; `escala` 1.2–2; curva de velocidade de editor (entra e sai devagar).
- `focos`: caixa em coordenadas 0–1 do original; escurece o resto; `seta` = para onde ela aponta (`auto` escolhe o
  lado de dentro da tela), `false` sem seta.
- `congelar`: quadro parado em P&B, encolhido na moldura, com o texto; empurra o resto do vídeo (o áudio para).
- Cores e fontes: `src/tema.ts`, como em qualquer vídeo (cor da seta = `T.accent`, títulos = `T.highlight`).

## Critério de edição (o que faz parecer editor, não corte automático)

- **Manter a personalidade**: não cortar respiração que dá ritmo nem a pausa antes da piada. `pausa_alvo` 0,12–0,2s.
- **Zoom onde o olho iria**, não no centro; 1 a cada 6–10s no máximo; mais forte na frase-chave.
- **Legenda**: 1–3 palavras, a falada acende; no 9:16 acima da zona da interface (`pos_y` ≤ 0,72).
- **Efeitos com parcimônia**: 3–5 por minuto, no que tem emoção (piada, virada, revelação). Mesmo critério de `direcao.md`.
- **Trilha**: por baixo da voz (`volume` 0,1–0,15), mudando por trecho (`partitura` com intensidade por fala).
- **Checagem obrigatória do corte**: a lista de removidas do `cortar.py` e a transcrição do MP4 final. O corte
  automático erra para os dois lados (deixa repetição, tira palavra boa).
