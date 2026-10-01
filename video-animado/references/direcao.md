# Ofício — como fazer bem qualquer vídeo (não é estilo)

Este arquivo diz **como** executar com qualidade, nunca **qual** estilo, dispositivo ou look usar. Por isso não tem
exemplos de visual: exemplo aqui vira cardápio e todo vídeo passa a se parecer. Se uma regra abaixo começar a
empurrar um look (e não uma qualidade), ela está errada — tirar.

## Conceito (antes de qualquer cena)

- **Um dispositivo que dê unidade** ao vídeo inteiro, nascido do conteúdo. Não existe lista: inventar para o tema.
- **Cada ideia do roteiro ganha uma imagem concreta**, própria do conceito. Mostrar o texto na tela não conta.
- **Tudo tem propósito**: fonte, fundo, cor, música, transição. Se não sabe dizer por que está ali, sai.
- **Contenção é cortar o que não tem função, não empobrecer o quadro.** O que tira o premium é elemento sem motivo;
  quadro vazio e chapado também tira.

## Bíblia visual (no `PROPOSTA.md` ou no topo do `ANALISE.md`)

Restrições duras, **cada uma com o porquê**: grade/resolução · paleta com contagem fechada · traço · fps de sensação ·
luz · tipografia (poucas famílias) · como o texto entra e sai · **uma linha de padrão de qualidade** ("deve parecer X,
não Y"). Escrita antes do código; stills e crítica são conferidos contra ela.

## Roteiro

- **Gancho nos 2 primeiros segundos.** Nada de apresentação ("olá, hoje vamos…").
- **Cada bloco tem uma função** (e dá para dizer qual). Bloco sem função é bloco morto: corta.
- **Algo novo a cada 3–5 s** (visual, informação, virada). **Um plano, uma ideia.**
- **Orçamento de fala**: medir a voz escolhida (VoxCPM/Gemini ~2,4 palavras/s; Kokoro ~3,3).
- **Pontuação é direção**: vírgula e ponto viram pausas medidas; para sincronizar numa palavra, isolá-la ou usar `cueW`.
- Texto na tela ≤ 6 palavras por vez; reforça a fala, não transcreve.
- **Verdade na tela**: dado real com fonte; o que for ilustrativo leva "Ilustração"/"Exemplo"; nunca inventar tela,
  funcionalidade ou número. Legenda do post também verdadeira (nada de "feito com um prompt" se não foi).

## Sincronia

- O visual chega **2–4 frames antes** da palavra (`lead`). Um frame depois já soa atrasado.
- Substantivos que importam ganham imagem; conectivos, não.
- **Mapa de batidas antes de animar** (`public/beats.json`, ver `scripts/beatmap.py`): cortes, viradas e revelações
  caem **na batida ou 2 frames antes**; a virada da música cai no momento visual principal. A fala manda no conteúdo;
  a batida manda no corte.
- **Depois da frase-chave, segurar** 0,5–1,5 s (`extra` no bloco). A transição nunca come o momento principal.
- CTA na tela por ≥ 2,5 s, legível.

## Densidade e acabamento (o que separa peça de estúdio de peça correta)

- **Camadas com função**: cena principal com ≥ 5 camadas (fundo com luz, plano médio, sujeito, detalhe, primeiro plano
  ou elemento gráfico). Plano mais simples é escolha da bíblia, com o porquê.
- **Tipografia em níveis**, quando houver texto: 3–4 (sobretítulo, título, subtítulo, rótulo), numa escala fechada.
- **Um elemento estrutural atravessa o vídeo** (régua, luz que muda com a hora, contador, moldura) e amarra as cenas.
- **A cena se constrói durante o plano**: entra algo novo a cada ~0,5–1 s, em vez de aparecer pronta e parar.
- **Luz e material em tudo**: luz com direção, sombra de contato, textura, borda, movimento secundário (algo respira,
  balança, varre). Objeto sem sombra de contato parece colado.
- Degradê grande em CSS faz anéis (banding) no MP4: vinheta/halo em PNG com dither, ou ruído fino por cima.

## Movimento (números, não adjetivos)

- **Chegar rápido, pousar suave**: cada frame cobre ~12–19% da distância que falta (mola bem amortecida ou saída
  exponencial). Nunca velocidade constante, nunca parada seca.
- **Molas** com parâmetros por papel (stiffness/damping no `spring` do Remotion): interface ágil ~320/30 · cartões,
  câmera ~170/26 · tipografia grande, logo ~120/24 · personagem, objeto com graça ~180/12 (overshoot visível).
  Valor que muda de alvo várias vezes = uma mola por mudança, somadas (continua determinístico).
- **Nada morre, texto não treme**: em pausa, deriva lenta (~0,25% por frame) só em imagem, fundo ou câmera sem texto;
  texto parado fica parado em pixel inteiro (deriva em subpixel faz letra tremer). "Move e segura" vale mais que
  deriva contínua.
- **Saída é desenhada** como a entrada, e mais rápida (~⅔ do tempo); nada some por corte sem querer.
- Entrada com 2–3 propriedades juntas (posição + escala + opacidade), nunca só um fade.
- **Durações**: movimento ≥ 0,3 s; grandes 0,5–0,75 s. **Grupos escalonados** 2–4 frames. **Ritmo adaptativo**:
  acelera, desacelera, segura — nunca o mesmo passo o vídeo todo.
- **Texto parado ≥ 8 frames antes de se mexer**, e tempo de leitura real antes de sair.
- **Um foco por quadro**: sempre claro para onde olhar primeiro.
- **Borrão de movimento** segue direção e velocidade e some quando assenta (`@remotion/motion-blur`, 6–8 amostras
  nos movimentos rápidos; 4 dá fantasma). Nunca borrar através de um corte.
- Câmera: zoom interpolado em escala logarítmica; não emendar zoom-in e zoom-out seguidos.
- Transição que liga uma cena à outra vale mais que corte seco — a menos que o corte seco seja a intenção.

## Proibido (o "visual padrão de IA")

Título centralizado sobre gradiente · tudo entrando com fade · gradiente sem motivo · brilho em texto sem motivo ·
partículas sem motivo · dois elementos disputando atenção · movimento linear · texto que se mexe antes de ser lido ·
interface ou dado falso sem rótulo · efeito sonoro em toda transição.

A bíblia visual pode quebrar qualquer regra deste arquivo **se disser por quê** (um fade lento que é a ideia do vídeo,
um movimento linear de propósito). Quebra sem porquê escrito é erro.

## Som

**Trilha**
- Nasce do conceito, como a paleta (não reaproveitar a de outro vídeo sem linha de estilo pedida).
- **Andamento dita a energia** (referência, não receita): 60–80 bpm majestoso/cinematográfico · 90–110 suave ·
  115–123 elegante/cinético · acima disso, euforia (serve a poucos projetos).
- Composta para a edição: curva de intensidade por bloco (no `musica.py`, na `partitura` ou em `trilha.intensidade`), dinâmica de verdade
  (contemplação baixa, clímax alto), eventos na tela (`revelacao`, `corte`, `sobe`/`desce`, `silencio`).
- Prompt do Lyria: instrumentação concreta, andamento, clima, arco e final claro; sem adjetivo vazio ("cinematic").
- Trilha recebida pronta: medir andamento e virada **pela energia** (`beatmap.py`), nunca confiar na grade automática.

**Efeitos**
- O **material do mundo dita o som**; a paleta sonora nasce no conceito e só depois vira 3–6 famílias do catálogo.
- **Pico na ação**: o ponto mais forte do som cai no frame da ação (o `sfxVar` já compensa o pico medido).
- Poucos e certeiros: ~3–5 por minuto além dos pousos discretos. Hierarquia: o que importa soa mais forte.
- **Ouvir o todo e tirar**: o que estiver alto demais, fora de lugar ou não ajudar a entender, sai.
- Sempre `sfxVar` (rodízio + variação); sintetizados no máximo metade dos toques.

**Mix**: voz −19 dBFS RMS (o `tighten` faz), trilha ~−7 a −9 dB sob a fala, master **−14 LUFS** (padrão de X,
Instagram, LinkedIn) no `render.sh`, pico ≤ −1 dBTP.

## 9:16

- Zona segura: livres ~250 px do topo e ~380 px de baixo; o importante no terço central.
- Reenquadrar tipo e interface por formato (layout por `pick`/mundo), nunca só recortar o 16:9.
- Tamanho mínimo em 1080 px de largura: título ≥ ~84 px, texto de apoio ≥ ~44 px. É um vídeo, não uma página.

## QA

Na ordem dos portões do SKILL e no [critica.md](critica.md). Além deles: primeiro frame não é preto/vazio; duração e
CTA certos; mix sem clipping.
