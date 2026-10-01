---
name: video-animado
description: Produz vídeo animado de ponta a ponta (Remotion, MP4 16:9 e/ou 9:16) a partir de um tema, de um roteiro, de anotações soltas ou de instruções — inventa o conceito a partir do conteúdo (ou segue uma linha de estilo pedida), com narração local (voz clonada no VoxCPM2) ou Gemini TTS, trilha composta em MIDI e tocada com orquestra gravada (ou Lyria, ou música fornecida), efeitos CC0 com verificação de diversidade e revisão por crítico independente com nota. Tem modo offline ("sem usar as APIs"). Também edita vídeo gravado (corte de silêncio e tomada errada, zoom, legenda palavra a palavra, XML para Premiere). Use quando o usuário pedir vídeo, animação, explainer, motion, reels/shorts, vídeo de produto/campanha/biográfico, ou editar/cortar uma gravação.
---

# Vídeo animado (Remotion)

**Infraestrutura, não gosto.** A skill guarda o que o modelo não traz sozinho — ferramentas (voz, trilha, render,
transcrição), contexto da empresa (vozes autorizadas, chaves, firewall, licenças), regras de verdade, técnica com
números, revisão e as lições técnicas — e **não prescreve como o vídeo deve parecer**. Estilo, dispositivo e look
nascem do conteúdo a cada vídeo. Ao evoluir a skill, nunca acrescentar exemplo de look, receita estética ou componente
"padrão" ao que é lido sempre: isso vicia e repete.

## O que ler

| Sempre | Sob demanda |
|---|---|
| este arquivo · `APRENDIZADOS.md` (técnica) · [direcao.md](references/direcao.md) (ofício) | [gemini.md](references/gemini.md) (vozes, APIs, capacidades) · [assets.md](references/assets.md) (licenças, fontes de asset) · [edicao.md](references/edicao.md) (gravação) · [musica.md](references/musica.md) (trilha em MIDI) · [critica.md](references/critica.md) (revisão) · [referencias.md](references/referencias.md) (só quando o pedido citar um dos vídeos estudados) · `biblioteca/` (só depois do conceito escolhido) · `VIDEOS.md` e projetos antigos (**só com linha de estilo pedida** — nem para "ver que voz os outros usaram") · `historico/` (quando um problema parecer conhecido) |

## Ler o pedido

A skill é a diretora: entende o que o pedido quer e age. Não faz questionário; pergunta só o que for bloqueante
(enquadramento político/histórico ambíguo, fato que as fontes não resolvem, direito de uso incerto), com recomendação.

| O pedido traz… | Fazer |
|---|---|
| Só um tema | Criar tudo (pesquisa, roteiro, conceito, voz, trilha) e entregar pronto. |
| Um roteiro | O texto fica como está (ajustes sugeridos à parte, opcionais); mostrar o **brief** e produzir após o ok ("faz direto" pula). |
| Anotações, relato, tópicos | Escrever o roteiro a partir delas (tom, cortes, anonimização) e mostrar roteiro + brief antes de produzir. |
| Consulta sem o conteúdo ("que animação você recomenda para…") | Não escolher conceito: o conceito nasce do texto. Dizer do que a escolha depende e pedir o conteúdo. |
| Pedido de proposta | Só o brief (`PROPOSTA.md`). |
| Instruções específicas | Seguir à risca; liberdade só no que não foi dito. |
| Uma gravação para cortar | **Modo edição**: [edicao.md](references/edicao.md). |
| Ajuste num vídeo existente | Mudar só aquilo e renderizar de novo. |
| Linha de estilo ("igual ao vídeo X", "série") | Carregar a entrada em `VIDEOS.md`, copiar `tema.ts` e peças daquele projeto, manter o look; `roteiro.linha_de_estilo`. |
| Folha em branco ("do zero", "sem nada pronto") | Só a base técnica; **nenhuma** peça da biblioteca nem referência estudada. |
| Referência externa (link, vídeo) | Estudar quadro a quadro, pegar a **gramática** (ritmo, técnica), nunca o conteúdo nem o look. |
| "Sem usar as APIs" | `"offline": true`, voz local, trilha `partitura` ou `arquivo`, sem geração de imagem. |

Pedidos se combinam. **Defaults**: ~45–60 s como referência · 16:9 + 9:16 · **voz VoxCPM2 clonada de uma referência autorizada** (`"voz": "voxcpm"`, já
no template) **só para uso interno** — vídeo que vai a público (campanha, redes, cliente)
pede outra voz: perguntar junto do brief, com recomendação. Pedido de outra voz: nome → usar; descrição →
[gemini.md](references/gemini.md); "opções" → amostras · CTA com URL só se o objetivo for vender.
A duração é a que o conteúdo pedir; estimar pela taxa **medida** da voz escolhida (nunca prometer antes de medir).
Vídeo longo: atos com função cada e passe completo dividido entre subagentes.

## Brief do diretor (antes de qualquer código)

Na ordem — **logline e limites primeiro, estética depois, ferramentas por último** (começar pela técnica faz a técnica
engolir a ideia). Vai no `PROPOSTA.md` (roteiro recebido/proposta) ou no topo do `ANALISE.md`.
**Barra, sempre**: peça de portfólio de um estúdio de motion design — o máximo de acabamento, não o básico que funciona.
Vale para qualquer estilo (minimalista ou denso); o que muda é onde o acabamento aparece.
1. **Logline**: o vídeo numa frase + público + onde vai passar + o que a pessoa deve sentir/fazer no fim.
2. **Limites**: duração, formatos, verdade (fontes; o que é ilustração), direitos, orçamento de API.
3. **Ideação sem viés**: 3 conceitos bem diferentes, **só do conteúdo** (sem abrir biblioteca nem vídeos anteriores),
   cada um **completo**: dispositivo, mundo visual, materiais, paleta, tipografia, movimento, paleta sonora e trilha.
   Declarar em `conceitos.json` e rodar `python3 scripts/diversidade.py --conceitos` — o modelo tem reflexos de mundo que
   se repetem mesmo sem ver o histórico; o script (que só ele lê o registro) aponta. Menos de 2 livres → inventar de
   novo. **Um quadro rápido de cada** em `out/conceitos/` e escolher olhando; quando houver brief para aprovar, os 3
   quadros vão junto. Registrar os 3 e o porquê; os materiais do escolhido vão para `roteiro.conceito.materiais`.
4. **Bíblia visual** com o porquê de cada escolha e uma frase de padrão de qualidade → `src/tema.ts`.
   Personagem recorrente → **bíblia de personagem** (proporções, paleta, expressões, o que nunca muda).
5. **Decupagem**: bloco a bloco, a função de cada um, o que aparece, transição, som.
6. **Ferramentas**: voz; trilha; assets — web com licença ([assets.md](references/assets.md), `CREDITOS.md`), geração
   (`scripts/img.py`, Veo: ver [gemini.md](references/gemini.md)) ou desenho em código.
7. **Passe de assets** (depois da bíblia, antes de animar): um conjunto feito para ESTE vídeo, um asset por ideia do
   roteiro (personagem, objetos, cenário, texturas), todos no mesmo tratamento. Gerado: `tratamento_imagem` + `imagens`
   no `roteiro.json`, a 1ª imagem aprovada vira `ref` de estilo das outras, `recorte` para elemento solto
   (`python3 scripts/img.py`). Sem cota ou offline: desenhar em código com o mesmo cuidado. Imagem gerada nunca
   representa pessoa real ou fato sem rótulo "Ilustração". Foi o que mais separou peça de estúdio de peça correta.

## Portões (não pular)

```
brief → roteiro → voz → medir → som + batidas → assets → storyboard → animatic → passe completo → crítica → render → entrega → evoluir
```

1. **Projeto**: `bash ~/.claude/skills/video-animado/novo.sh ~/videos/<slug>`. O `ANALISE.md` do projeto
   já vem com o checklist dos portões: **marcar cada um ao passar**; pular só o que o pedido dispensar, com o porquê.
2. **Roteiro** em `roteiro.json` (fonte única) + `ROTEIRO.md` com fontes. Checagem factual antes da voz, sempre.
3. **Voz**: `python3 scripts/tts.py` (só regrava blocos alterados). Conferir: `~/.venvs/tts-local/bin/python scripts/check_voz.py`.
4. **Medir**: `python3 scripts/tighten.py`; fala natural ou ATENÇÃO → `~/.venvs/tts-local/bin/python scripts/align.py` (`cueW`).
5. **Som + batidas**: trilha **padrão em MIDI** (`trilha.fonte` vazio): escrever o `musica.py` do projeto, composto na
   timeline e tocado com orquestra gravada ([musica.md](references/musica.md)); `arquivo` quando o pedido trouxer música;
   `lyria` (`scripts/music.py`) para gênero fora da orquestra; `partitura` para som sintético de propósito. Depois
   `python3 scripts/sound.py` (timeline, roda o `musica.py`, efeitos, picos, `beats.json`). Trilha pronta (arquivo,
   lyria) → `~/.venvs/tts-local/bin/python scripts/beatmap.py`. Efeitos por família
   (`biblioteca/sfx/INDEX.md`), escolhidas pelo material, via `sfxVar` (o pico cai na ação sozinho).
6. **Storyboard**: um still por momento do roteiro, criticado contra a bíblia e contra "o que dá para tirar?".
7. **Animatic**: render rápido (`npx remotion render Video-9x16 out/animatic.mp4 --scale=0.4`) para acertar ritmo e
   batidas antes do acabamento.
8. **Passe completo** em `src/Video.tsx` (o exemplo do template é só sincronia: substituir; construir os componentes
   que o conceito pedir). Vídeo longo: dividir grupos de cenas entre subagentes, com `tema.ts` e regras centrais.
9. **Crítica**: `python3 scripts/qa_folhas.py out/<mp4>` + subagente limpo com nota ([critica.md](references/critica.md)),
   até tudo ≥ 8 (no máximo 3 rodadas; o crítico julga contra a bíblia do vídeo, não contra um gosto dele).
   `python3 scripts/diversidade.py` ok (continuidade pedida: `roteiro.linha_de_estilo`).
10. **Render**: `bash scripts/render.sh` (−14 LUFS por ganho fixo + limitador de pico, sem achatar o arco; os formatos do roteiro); conferir no
    `relatorio.txt` do `qa_folhas.py` (−14 ± 1).
11. **Entrega**: MP4s + frame de capa (`npx remotion still … out/capa.png`) + folhas de revisão + `ANALISE.md` (brief,
    decisões, fontes, notas da crítica, o que precisa de escuta humana) + arquivo mostrado no Finder (`open -R`).
    A mensagem final **pede a nota (1–5)** e o que mudaria.
12. **Evoluir a skill**: nota de quem pediu → `diversidade.py --registrar` → lição **técnica** no `APRENDIZADOS.md`
    (curta; fundir ou tirar ao acrescentar), escolhas **estéticas** no `VIDEOS.md`, peça reutilizável e sem tema na
    `biblioteca/` (+ `INDEX.md`), bug do template corrigido e testado nos dois formatos, capacidade nova no `gemini.md`.
    Lição de ofício repetida em 2 vídeos → `direcao.md` (sem exemplo de look).

## Contrato do código

- **Tempo nunca é número solto**: `cue`, `cueW`, `blockStart`, `naBatida(frame)`, `batida(i)`, `virada()`.
- **Formato**: `useFmt()` + `pick(paisagem, retrato)`; toda cena roda nos dois (reenquadrar, não recortar).
- **Movimento**: `mola(frame, at, 'ui'|'padrao'|'pesada'|'viva')`; regras em [direcao.md](references/direcao.md).
- **Núcleo neutro** do template: `tema.ts` (cores e fontes do vídeo), `lib.ts` (tempo, formato, batidas, molas),
  `stage.tsx` (`SceneStack` com `corte`/`wipe`/`zoom` ou transição própria `TransFn`, `Sheet`, `Soundtrack`, `sfxVar`),
  `acabamento.tsx`. Peças prontas ficam na `biblioteca/componentes/`, opcionais, abertas só depois do conceito.
- Toda animação sai do frame (`useCurrentFrame` + `interpolate`/`mola`); `interpolate` sempre com
  `extrapolateLeft/Right: 'clamp'`; nunca `transition`/`animation` de CSS (não aparecem no render).
- Pacotes `@remotion/*` 4.0.528 no template (transitions, paths, shapes, noise, motion-blur, lottie, three,
  media-utils, layout-utils); novos na mesma versão.

## Regras duras

- Chaves em `~/.config/secrets.env` (`source` antes; nunca imprimir). Sem cota/teto de gasto: voz local e `partitura`.
- Clonagem de voz só com autorização por escrito; voz clonada de pessoa real é **uso interno**, salvo autorização expressa para uso público.
- Asset de terceiros só com licença clara, registrado em `CREDITOS.md`; nunca foto de pessoa real sem base de direito,
  música comercial ou logo de terceiros imitando peça oficial.
- **Verdade**: dado com fonte ou rótulo "Ilustração/Exemplo"; nada inventado na tela nem na legenda do post.
- MP4 e áudio não vão para repositório público. Não commitar sem perguntar.
- **Sessões paralelas** mexendo na skill (`git status` com mudanças que não são suas): só trocas pontuais, ou worktree
  própria (`claude --worktree`) e merge — nunca reescrever arquivo de outra sessão.
