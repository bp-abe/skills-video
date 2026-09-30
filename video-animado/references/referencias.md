# Referências estudadas — o que copiar de cada uma

Fonte: thread do Eric Buess (X, 24/09/2026) com vídeos feitos 100% em código pelo Claude Opus 5.5.
Vídeos e folhas de contato locais em `referencias-brutas/` (fora do git, conteúdo de terceiros — só estudo).

A barra de qualidade está em [direcao.md](direcao.md) e nos critérios do [critica.md](critica.md).
Os estudos abaixo mostram de onde esses critérios vieram. **Não são modelos a seguir**: abrir só quando o pedido citar
uma dessas referências, e então pegar a gramática (ritmo, técnica), nunca o conteúdo nem o look.

---

# Estudos por vídeo — ler só quando o pedido citar uma destas referências

## 1. "How browsers work" — @addyosmani (40s, 16:9)
- **Dois mundos alternados**: ilustração quente e desenhada (papel creme, listras diagonais, mascote) × blueprint técnico escuro (azul-marinho, linhas finas, brilho). A troca de mundo **é** o ritmo — um conceito a cada 2–4s.
- **Mascote recorrente** (um robozinho-tomate) com expressões, que atravessa todas as cenas e "vive" cada conceito.
- **Uma metáfora visual por conceito**: renderer = caixa de areia, DOM = trepadeira com folhas, garbage collection = cerca com gerações "young/old", processos = vilarejo de casinhas.
- **HUD persistente**: rótulo do capítulo no canto superior esquerdo (minúsculo, sublinhado) + anel de progresso com etapa ("1 · fetch", "2 · parse") no canto superior direito.
- Cena densa, com movimento ambiente (nuvens, brilhos), nada parado.

## 2. História da IA — @kimmonismus (3 min, 16:9) — **mesmo pipeline da nossa skill** (Remotion + SVG/Canvas + TTS + trilha sintetizada em Python), ~7.400 linhas, ~1h
- **Motivo condutor**: um único elemento (o token "the") aparece no início, evolui em cada era (vê, ouve, age) e fecha o filme. Dá unidade a 3 minutos.
- **Paleta mínima**: preto + âmbar + um acento rosa, com **brilho (bloom)** em tudo que importa.
- **Legenda de assinatura**: serifa, com **uma palavra em itálico colorido** por frase ("Then it learned to *see*…").
- HUD de dado: era/data no canto superior esquerdo, contador animado (10^8 → 10^11 parâmetros) no inferior esquerdo.
- **Escalada**: a rede de palavras cresce até virar galáxia; o tamanho visual acompanha a narrativa.
- Mockups de interface (ChatGPT, terminal, arquivos) como prova concreta. O fim retoma o começo.
- Lição de escala: o exemplo do nosso template tem ~100 linhas. Vídeo bom é código grande — orçar esforço.

## 3. "From sketch to home" — @techartist_ (19s, Three.js)
- **Um objeto, quatro estágios**: wireframe → volumes → detalhe → casa iluminada. Revelação progressiva do mesmo objeto, câmera em órbita lenta.
- A interface (linha do tempo com 4 etapas numeradas) é o dispositivo narrativo.
- Clímax pela luz: do dia neutro para o entardecer com interiores acesos.

## 4. Colisão no LHC — @superalesha (34s, Blender)
- **Linguagem de câmera**: dolly acelerando pelo túnel, mergulho no detector, câmera lenta congelando o instante-chave.
- **Legenda de dado real** no rodapé ("Protons at 99.999999% of the speed of light", "Bunches cross every 25 ns"). O número real dá credibilidade.
- Simulação com dado real (campo magnético do detector) e som desenhado junto.

## 5. Mosaico — @LCSlates (80s, 1:1, um único HTML com WebGL2, sem bibliotecas nem arquivos)
- **Um meio só é o mundo inteiro**: tudo são tesselas. As cenas se desfazem e se refazem (redemoinho → nova imagem), e o dia vira noite trocando as peças.
- Física nas peças (sombra, empilhamento, dispersão). Loop que volta ao início.

## 6. Lançamento do video-use — @gregpr07 (18s, footage real)
- **Legenda cinética**: uma palavra grande por vez, caixa alta e negrito sobre o vídeo. Abertura só com texto + forma de onda da voz.
- Inserção de meme como piada de ritmo; terminal como prova; cartão final da marca com URL.

## 7. Mago em pixel art — @majidmanzarpour (11s, Canvas 2D)
- O prompt é o exemplo: **qualidade vem de restrições técnicas explícitas**. Resolução lógica de 128×96 com escala inteira, paleta fixa de ~24 cores, coordenadas inteiras, sem anti-aliasing, pose parametrizada e quantizada a 8–12 fps, máquina de estados IDLE→CHARGE→CAST→RECOVER, partículas pré-alocadas que passam de branco → cor mágica → escuro, rim light da gema. Fecha com uma linha de padrão de qualidade: "deve parecer um sprite 16-bit polido, não vetor reduzido".

## 8. História da Anthropic — @VincentWei93 (3min44, 16:9, sem narração)
Post: https://x.com/VincentWei93/status/2103381720410333314 · prompt: https://x.com/VincentWei93/status/2103494469983273308
Prompt (traduzido do chinês): "animação sobre a filosofia e a história da Anthropic, com efeitos sonoros e música;
use qualquer ferramenta ou técnica para o resultado mais impressionante; não use skills existentes nem se baseie em
vídeos ou textos feitos antes". Tudo em código, inclusive música e efeitos. Autor de uma skill de vídeo com 10k estrelas.
- **Sem voz**: a história é contada por texto na tela (frase curta, palavra-chave colorida, revelação com desfoque) e
  pela música. O som carrega o ritmo sozinho.
- **Dois mundos**: cósmico escuro (fogo, curvas, galáxia, a espera) → papel claro (era do produto) → pôr do sol/Terra
  → logo no claro. Motivo condutor: o **fogo** ("a humanidade aprendeu a usar o fogo") vira a faísca do asterisco do
  Claude e fecha em "a diferença está em quem segura o fogo".
- **Trilha medida** (librosa): ~96 BPM, ré menor/fá maior o filme inteiro (uma tonalidade dá unidade), −17,6 LUFS com
  LRA 10,8 LU (**dinâmica de verdade**, não achatada). O brilho do som acompanha a luz da cena: ~750 Hz nos capítulos
  escuros, ~1.750 Hz nos claros e no clímax. A densidade de eventos acompanha a densidade de informação: 0,1–0,5
  eventos/s na contemplação, 4–5,6/s na linha do tempo de lançamentos.
- **Técnicas vistas no espectrograma**:
  - *riser* (ruído subindo até ~8 kHz) que termina num impacto exatamente no evento visual (explosão do fogo aos 10s);
  - **subida → silêncio total de ~0,1s → impacto** na revelação do Claude (102,4s): o corte seco antes do golpe é o que dá peso;
  - *sub-drop* (grave em ~60 Hz) em cada troca de cena;
  - glissando descendente quando a curva de escala desce na tela: **o som imita o movimento**;
  - ostinato grave no tempo (0,625s) como batimento no capítulo da espera, e ostinato de pluck com melodia no
    capítulo de aceleração;
  - capítulo escuro que quase some (−23 dB) antes da virada; final que afina e esvazia os graves (9%).
