# Briefing: refinar as amostras da Mesa de Estilos

A Mesa de Estilos é uma página em que o usuário folheia 60 estilos de motion design. Cada cartão tem um "monitor" com
uma amostra animada, desenhada em canvas 2D. A primeira versão (`v1.js`) ficou com cara de rascunho. Sua tarefa é
reescrever as amostras do seu grupo para que cada uma **pareça um trecho de uma peça de portfólio de um estúdio de
motion naquele estilo**, e que dê para reconhecer o estilo em 1 segundo.

## A barra

- **Parece peça de estúdio, não esboço.** Compare com a coluna vermelha da bancada (v1): a nova tem que ser muito melhor,
  não um ajuste.
- **Fiel ao estilo.** Leia a ficha de cada id em `estilos.json` (descrição e `assinatura`) e deixe esses traços visíveis.
  Quem conhece o estilo tem que reconhecer na hora.
- **Lê em tamanho pequeno.** O monitor aparece com ~300 px de largura (o canvas tem 480×270 lógicos). Formas claras,
  texto ≥ 14 px lógicos, nada de detalhe que vira sujeira.

## Como chegar lá (o ofício da skill de vídeo)

- **Camadas com função:** 4–5 (fundo com luz, plano médio, sujeito, detalhe, primeiro plano ou grafismo).
- **Luz e material:**
  - degradê de luz no fundo;
  - realce e sombra própria nos objetos;
  - **sombra de contato** onde algo toca o chão;
  - textura quando o estilo tem material (`paper()`, `filmGrain()`, `noiseTile()`).
- **Tipografia em níveis**, quando houver texto: 2–3 níveis (sobretítulo, título, rótulo) com as fontes de `F`, nunca
  a fonte padrão. Texto em português.
- **A cena se constrói durante o loop** (algo novo a cada ~0,5–1 s) e tem **movimento secundário** (algo respira, balança,
  brilha). Nada linear sem intenção: use `ease`, `eio`, `spr` (mola).
- **Loop de 6–8 s**, com fim desenhado (volta suave, corte na batida, transição). O quadro nunca fica vazio: o
  monitor pode ser capturado em qualquer momento.
- **Um foco por quadro.** Contenção é cortar o que não tem função, não empobrecer.
- **Proibido:** gradiente, brilho ou partícula sem motivo; tudo entrando com fade; texto se mexendo antes de ser lido.

## Técnica

- Assinatura: `R['<id>'] = (g, t, W, H, seed) => { ... }`, com W = 480 e H = 270. O contexto já vem escalado pelo DPR.
  Use `save/restore` e nunca reinicie a transformação.
- **Tudo dentro de uma IIFE** `(() => { ... })();`. Nenhuma variável global nova, porque os 7 grupos rodam na mesma
  página. Se precisar de um utilitário, crie dentro da IIFE.
- Utilitários globais disponíveis (`helpers.js`, só leitura):
  - curvas e tempo: `TAU`, `clamp`, `ease`, `eio`, `spr`, `loop(t, d)`, `lerp`, `pingpong`;
  - aleatoriedade: `rng(seed)`, `noise(x, s)`;
  - desenho: `bg`, `txt`, `type(g, s, x, y, {f, fill, align, base, track, stroke, lw})`, `font(w, px, F.x)`, `poly`,
    `wobbleCircle`, `lin`, `rad`, `shadow`, `noShadow`, `contact(g, x, y, rx, ry, a)`, `vignette`;
  - textura: `paper(g, W, H, tom)`, `filmGrain(g, W, H, t, a)`, `noiseTile(seed)`, `cached(chave, w, h, fn)`;
  - fontes em `F`: `display` (Syne), `body` (Hanken Grotesk), `mono` (IBM Plex Mono), `serif` (Fraunces), `didone`
    (Playfair Display), `cond` (Bebas Neue), `slab` (Archivo Black), `pixel` (Press Start 2P), `term` (VT323), `hand`
    (Caveat), `marker` (Permanent Marker), `script` (Pacifico), `grot` (Inter Tight).
- Sem imagens externas nem `fetch`: tudo procedural. Determinístico pelo `t` (use `rng(Math.floor(t * fps) + seed)` para
  tremor e boil).
- **Custo ≤ 6 ms por quadro na bancada.** A página anima ~8 monitores ao mesmo tempo.
  - Efeito por pixel: numa tela pequena cacheada, ampliada com `drawImage`.
  - `shadowBlur` em muitos objetos: desenhar o objeto com sombra uma vez num sprite (`cached`) e reusar.
  - Não usar `getImageData` no loop. Para copiar faixas da própria tela (glitch), use
    `g.drawImage(g.canvas, 0, y*dpr, W*dpr, h*dpr, dx, y, W, h)`, com `dpr = g.getTransform().a`.

## Processo

1. Leia as fichas do seu grupo em `estilos.json` e as versões atuais em `v1.js` (o `MAPA` no fim diz qual função
   atende qual id).
2. Escreva o seu arquivo em `grupos/` (só ele: não edite `helpers.js`, `v1.js`, `shell.html` nem arquivos de outros
   grupos).
3. Rode `python3 teste.py grupos/<seu arquivo>.js`. A bancada imprime o custo de cada id e gera `teste/<arquivo>.png`,
   com a v1 à esquerda e a nova em 1,0 / 3,4 / 5,6 / 7,8 s.
4. **Olhe a folha** (Read no PNG) e critique como diretor de arte exigente: parece peça de estúdio? O estilo é
   reconhecível? Tem camadas, luz, tipografia, construção? Algum quadro vazio ou feio? Corrija.
   - Faça **pelo menos 2 rodadas** e só pare quando cada amostra estiver claramente no nível.
   - Para olhar um id de perto, recorte o PNG com PIL.
5. Resposta final, curta:
   - ids feitos;
   - ms por quadro de cada um;
   - uma linha por id sobre o que mudou;
   - quais você acha que ainda estão abaixo da barra, e por quê.
