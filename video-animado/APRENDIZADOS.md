# Aprendizados técnicos — ler antes de cada vídeo

Só o que vale para **qualquer** vídeo (técnica, nunca estética — estética vai em `VIDEOS.md`). Detalhe de um projeto
só vai para o ANALISE dele. Versão completa com datas e projetos: `historico/APRENDIZADOS_ate_2026-09-29.md`
(consultar quando um problema parecer conhecido). Manter este arquivo curto: ao acrescentar, fundir ou tirar.

## Voz e sincronia
- Toda voz gerada: `check_voz.py` (transcrição local) antes de seguir; erro persistente em palavra difícil → reescrever
  com palavra fácil de dizer e gravar 3 tomadas, ficar com a de menor diferença. Conferir som inventado no fim do bloco.
- Fala natural (gravação, voz clonada) quase nunca bate com a pontuação: rodar `align.py` e usar `cueW`.
- Fato a corrigir num roteiro → bloco próprio (regravar custa 1 requisição).
- Leitura solene/dramática (VoxCPM `controle`) fica ~2 palavras/s: 32 palavras deram 16 s, não 13. Orçar a duração com a
  taxa do tom pedido, não a média.
- O Whisper engole a pausa do "…" dentro da palavra anterior: para acertar o gesto na pausa, medir o silêncio pela energia
  do WAV, não pelo `words.json`.
- Voz lenta (Gemini 2.5): `tempo_voz`/`tempo` por bloco (atempo) sem mudar o tom; estilo "dramático" faz ler palavra por
  palavra — slogan pede `estilo_voz` próprio ("numa só respiração").
- Nunca desacelerar voz com atempo < 1: a voz clonada a 0,82–0,88 soou "chapado" (usuário, 01/10). Fala rápida se resolve no texto
  ou na gravação, não esticando. Acelerar (até ~1,22) é seguro. E `estilo_voz` com "pausado" fez o Gemini arrastar (144 s
  para 106 s de texto): pedir "ritmo firme e fluido".
- Gravação pronta como narração: cortar por frase em `audio_raw/<id>.wav` + `.json`, **não rodar tts.py**;
  áudio já mixado com trilha: alinhar por palavra e tratar cada palavra como frase.
- **Uma voz local pesada por vez na máquina**: VoxCPM2 ocupa 10–13 GB; duas juntas (agentes em paralelo) levaram o
  Mac de 24 GB a 39 GB de swap. O `tts_local.py` tem trava global (`~/.cache/tts-local.lock`): a segunda espera na fila.
  Vídeos em paralelo: gravar as vozes em sequência, ou usar Gemini TTS nos demais.
- Não misturar modelos de TTS num vídeo (timbre muda); cota do Gemini 3.8 é intermitente e acaba — voz local resolve.
- VoxCPM2 corta o fim de bloco longo (~40+ palavras): dividir o bloco (b11 → b11 + b11b); `check_voz` acusa 'faltou …'.
- `cueW` ignora maiúsculas: palavra repetida no bloco ("Eu"/"eu", "foi") → passar o índice `n`.

## Revisão
- **A folha do MP4 pega o que os quadros-chave não pegam** (momento-chave comido pela transição, texto sumindo no fundo da
  mesma cor). Sempre `qa_folhas.py` + crítica, nunca só stills.
- Faixa clara em still que não existe no MP4 = artefato do Chrome com `mix-blend`: conferir o quadro extraído do vídeo.
- Depois da frase-chave, `extra` no bloco; a transição nunca come o momento principal.
- Cena longa: o 1º frame visível de cada cena já traz o cenário ~70% desenhado (fundo nasce antes do `from`); página em branco a cada corte é o que o crítico mais pune.
- Transição de deslize curta (12 frames) lê como travamento na folha: dentro do capítulo, corte seco 3 frames antes da 1ª sílaba; virada só na quebra de capítulo.
- Crítico só vê o 9:16 → conferir o storyboard do 16:9 antes de entregar (HUD pode colidir só no paisagem).

## Código e render
- Nunca hook (`useCurrentFrame`) dentro de laço/condição do JSX: usar o `f` da cena.
- `Root.tsx` com `lazyComponent`: um modo não executa o código do outro.
- Textura só em CSS `background-image` pode faltar no render sob carga: pré-carregar com `<Img>` invisível na raiz.
- Overlays globais (HUD, vinheta, grão) precisam de `zIndex` acima das cenas.
- SVG com `id` (clipPath, gradiente) usado duas vezes na tela: `React.useId()`.
- `mix()` de cor precisa aceitar a própria saída (`rgb(...)`); `mix-blend` dentro de grupo isolado não multiplica o fundo.
- Conferir para onde o desenho base de uma seta/ícone aponta antes da rotação; ângulo positivo = horário.
- Grão animado custa bitrate (CRF 23–24). Vídeo com clipe do Veo: projeto em 24 fps.
- Componente copiado para `src/biblioteca/` importa `../lib` e `../tema`.
- Fonte: `loadFont()` do `@remotion/google-fonts` no topo do módulo, só pesos usados; medir texto só depois de carregar
  (senão cai em fonte do sistema e o layout muda no render).
- Render com `--scale` que não dá dimensão inteira (0,6667) faz camadas pularem: usar 0,5 ou 0,4.
- Traço animado com `vectorEffect="non-scaling-stroke"` + dasharray sai picotado (dash em px de tela): usar `pathLength={1}` e dasharray `1 1`.
- `<filter>` com região em % corta traço grosso quase reto (bbox sem espessura): `filterUnits="userSpaceOnUse"` no quadro inteiro.

## Som
- Medir o mix por trecho (voz × trilha) antes de entregar; trilha de mercado vem alta (−14 dB RMS): baixar sob a voz.
- Efeito em toda transição cansa: reservar para 3–5 momentos (feedback de uso).
- `loudnorm` (mesmo em duas passadas, `linear=true`) cai sozinho para o modo dinâmico quando o pico não cabe no ganho
  linear, e achata o arco da música (introdução e ápice ficam quase no mesmo volume). O `render.sh` e o `midi_lib.py`
  medem o integrado, aplicam ganho fixo até −14 LUFS e limitam só os picos (`alimiter`). Conferir no `relatorio.txt`.
- VSCO: a camada fraca das cordas curtas é baixa demais (acento que troca de camada vira solavanco de ~8 dB): curtas
  sempre na camada forte, dinâmica pelo ganho (o `midi_lib.py` já faz).
- Lyria (clip) devolve mais que o pedido (18 s → 28,7 s): cortar pela edição, ancorando ataque e fim em eventos.
- Trilha real com cadência final: entrar a cadência com o último bloco, não pelo fim do vídeo (o CTA fica mudo).
- API com teto de gasto (429 "monthly spending cap") ou sem cota: cair para `partitura`/voz local sem insistir.

## Rede e ambiente
- Firewall corporativo intercepta alguns sites com certificado próprio: não desligar a verificação, buscar
  espelho (GitHub, archive.org). Hugging Face e PyPI passam.
- ffmpeg do Remotion é mínimo (sem filtros): usar o do sistema.

## Processo
- Avisar antes de rodar algo que pareça produção quando o pedido era sobre a skill.
- Portões pulados em silêncio foram a regra nos primeiros vídeos: o checklist do `ANALISE.md` existe por isso.
