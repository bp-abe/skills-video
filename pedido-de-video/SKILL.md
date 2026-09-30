---
name: pedido-de-video
description: Monta o pedido (prompt) certo para gerar um vídeo com a skill video-animado — ou um prompt autocontido para quem não tem a skill. Identifica o caso (tema, roteiro, gravação para cortar, pasta de assets, referência a seguir, série/linha de estilo, teste sem API), pergunta só o que falta numa rodada e entrega o pedido pronto para colar ou já dispara a produção. Use quando o usuário (ou alguém do time) disser "me ajuda a pedir um vídeo", "monta o prompt do vídeo", "como eu peço esse vídeo", ou chamar /pedido-de-video.
---

# Pedido de vídeo

Um bom pedido diz **o que o vídeo precisa conseguir** e **o que não pode acontecer** — e deixa o **como** para a
`video-animado`. Pedido que descreve o look ("premium", "cinematográfico", "estilo Apple") sem motivo só encolhe a
criação; pedido que esquece o público, o canal ou a verdade dos dados gera retrabalho.

## 1. Identificar o caso (pelo que o usuário já disse)

| Caso | Sinal |
|---|---|
| Tema | só o assunto ("um vídeo sobre X") |
| Roteiro | texto pronto colado, arquivo ou doc |
| Anotações | tópicos, relato, rascunho — a skill escreve o roteiro e mostra antes |
| Gravação | vídeo/áudio gravado para cortar, legendar, dar ritmo |
| Pasta de assets | fotos, clipes, logo, textos soltos numa pasta |
| Referência | link/vídeo que ele quer seguir ("desse jeito") |
| Série | "igual ao vídeo X", "mesma identidade" |
| Teste | "sem usar as APIs", "só para testar" |

Consulta antes do conteúdo ("que animação você recomenda para uma crônica?"): não sugerir estilo — o conceito
nasce do texto. Pedir o conteúdo e montar o pedido com ele.

## 2. O que precisa ser pedido e o que pode ficar aberto

Perguntar numa rodada só, com uma recomendação em cada item, e **só o que está na coluna "precisa" e ainda não veio**.

**Precisa estar no pedido** (a skill não tem como adivinhar; se faltar, sai o vídeo errado):

| Item | Por quê | Exemplo de resposta |
|---|---|---|
| **Para quê** | define o roteiro e o fim do vídeo | explicar, vender (ação + URL), contar história, anunciar |
| **Para quem e onde** | define linguagem, formato e ritmo | "assinantes, Reels" → 9:16; "apresentação interna" → 16:9 |
| **Mensagem única** | é o que o vídeo inteiro serve | "o livro custa menos que um café por semana" |
| **Material** (se existir) | a skill não acha sozinha | caminho do roteiro, gravação, pasta, logo, telas do produto |
| **Verdade** (se houver dado/fato/produto real) | nada inventado na tela | fonte dos números; o que é só ilustração |
| **Interno ou público** | define voz e direitos | voz clonada só com autorização; vídeo público pede voz com direito de uso |
| **O que não pode** | risco que só quem pede conhece | não mostrar pessoa X, não citar preço |

**Pode ficar aberto** (a skill decide bem, e deixar aberto dá mais criatividade — não perguntar):

| Item | O que a skill faz sozinha |
|---|---|
| Estilo, paleta, fonte, "vibe" | cria 3 conceitos a partir do conteúdo e escolhe (ou mostra) |
| Roteiro (se só tem tema) | pesquisa e escreve, com checagem factual |
| Duração | a que o conteúdo pedir (referência: 45–60 s); a skill mede antes de prometer |
| Formato | 16:9 + 9:16 |
| Voz | voz clonada (VoxCPM2, local) em uso interno; em vídeo público, propõe outra |
| Trilha e efeitos | compõe/gera para o vídeo, sem repetir os anteriores |
| Transições, câmera, ritmo | decupagem própria, revisada por crítico |

**Só entra se o usuário fizer questão** (senão, fica aberto): direção de estilo, voz específica, duração exata,
referência a seguir (dizer o que pegar dela — ritmo, transições — e o que não pegar — conteúdo, marca, cores),
série ("igual ao vídeo X"), "sem usar as APIs", prazo. Direção de estilo com motivo vale; adjetivo solto
("premium", "cinematográfico", "moderno") não entra — só encolhe a criação sem dizer nada.

## 3. Montar o pedido

Formato, nesta ordem (logline e limites primeiro, estética por último, ferramentas quase nunca). As 3 primeiras
linhas são obrigatórias; as entre `[ ]` só entram se existirem:

```
Faz um vídeo [duração] para [canal/formato] sobre [tema].
Objetivo: [o que a pessoa deve sentir/fazer no fim]. Público: [quem].
Mensagem principal: "[a frase]".
[Material: roteiro abaixo / gravação em <caminho> / pasta <caminho> / logo e telas em <caminho>.]
[Verdade: fontes em <…>; o que for ilustrativo precisa de rótulo.]
[Restrições: sem API / uso externo — só assets com licença / não mostrar <…>.]
[Referência: <link> — pegar <ritmo, transições>; não pegar <conteúdo, cores, marca>.]
[Série: no mesmo estilo do vídeo "<título>".]
[Instruções que o usuário fez questão: <…>.]
[Roteiro:
<texto>]
```

Tirar do pedido o que for default ou adjetivo vazio. Um pedido bom costuma ter de 3 a 8 linhas (mais o roteiro).

Exemplos de caso (a forma, não o conteúdo):
- **Gravação**: "Edita a gravação `<caminho>` num Reels de 45 s. Mensagem: '…'. Legenda palavra a palavra, zoom nas
  partes importantes, tirar tropeços. Entregar também o XML para o Premiere."
- **Referência**: "Faz um vídeo de 30 s sobre X seguindo o ritmo e as transições de `<link>`, mas com o nosso conteúdo
  e sem copiar cores nem marca."
- **Teste**: "Faz um vídeo de teste de 20 s sobre X sem usar as APIs."

## 4. Entregar

- Mostrar o pedido pronto num bloco para copiar e dizer em uma linha o que ficou como default.
- Se o usuário disser "já faz"/"pode rodar": invocar a skill `video-animado` com o pedido.
- **Sem a skill** (é para alguém que não tem a `video-animado`): gerar a versão autocontida — o pedido acima seguido do
  método em [METODO.md](METODO.md) (conceito sem viés, regras visuais, quadros antes do render,
  voz, sincronia medida, som, revisão). Não incluir chaves, caminhos pessoais nem vozes clonadas.
