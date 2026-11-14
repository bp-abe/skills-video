# Crítica independente — uma rodada, para apontar problemas (a aprovação é do usuário)

Quem construiu o vídeo defende as próprias escolhas. A crítica é feita por **um subagente de contexto limpo**
(ferramenta Agent, `general-purpose`), que não construiu o vídeo e **não recebe nem abre histórico da skill**
(`VIDEOS.md`, `uso.json`, outros projetos). Ele recebe só: as folhas do MP4, a bíblia visual, o roteiro e o ANALISE.

## 1. Gerar as folhas

```bash
python3 scripts/qa_folhas.py out/<slug>_9x16.mp4      # e de novo para o 16x9
```
Saída em `out/qa/`: `geral.png` (2 quadros/s), `tira_NN.png` (12 quadros em volta de cada movimento rápido,
detectado por diferença entre quadros), `celular.png` (360 px de largura, 1 quadro/s), `storyboard.png` se houver
lista de momentos, e `relatorio.txt` (duração, loudness, picos de diferença = cortes/pulos).

## 2. Chamar o crítico (prompt do subagente)

```
Você é um diretor de motion design exigente. Você NÃO fez este vídeo; o padrão é reprovar.
Não abra nenhum outro arquivo além destes: <caminhos das folhas>, <bíblia visual>, <roteiro.json>, <ANALISE.md>.
Olhe cada imagem com atenção (use Read em todas).

Dê nota de 1 a 10, com uma frase de justificativa, para:
1. Gancho (os 2 primeiros segundos seguram?)
2. Leitura no celular (folha de 360 px: tudo legível, nada cortado, zona segura do 9:16)
3. Qualidade do movimento (nada linear, nada congelado, pousos suaves, sem parada seca depois de movimento rápido)
4. Variedade e ritmo (algo novo a cada 3–5 s, ritmo que varia, nenhum trecho morto)
5. Composição (um foco por quadro, hierarquia, respiro, fidelidade à bíblia visual)
6. Verdade (dado com fonte ou rótulo; nada inventado)
7. Sincronia (o visual acompanha a fala e a batida; o momento principal tem tempo)
8. Originalidade (parece o "visual padrão de IA"? Título centralizado em gradiente, tudo em fade, partículas sem
   motivo? Ou parece feito de propósito para ESTE conteúdo?)
9. Acabamento (parece peça de portfólio de estúdio? luz, sombra de contato, textura, camadas, nada chapado ou colado)
10. Efeito pretendido (o vídeo faz o que prometeu: a piada tem graça e timing, a emoção chega, a explicação fica clara)

Depois:
- Os 3 piores problemas, cada um com o tempo exato (s), o que está errado, por que piora o vídeo e a correção exata
  ("o título pousa 6 frames cedo: atrasar para o frame 44").
- **O que dá para tirar** (efeito, elemento, som, cena) sem perder nada.
- **O que falta para parecer peça de estúdio** (luz, material, camadas, construção do plano), com o frame e o como.
Responda só com as notas, os 3 problemas e as duas listas.
```

## 3. Depois da rodada

**Uma rodada só, sem barra de nota.** A nota serve para localizar onde o vídeo está fraco, não para aprovar: o crítico vê
quadros estáticos (não vê movimento nem ouve) e não é calibrado contra o gosto do usuário — em out/2026, 3 rodadas em 3
vídeos moveram a média em menos de 1 ponto. Corrigir o que for barato e certeiro (se localizado, conferir com
`npx remotion still` antes do render inteiro); o que pedir outro tipo de asset ou refazer cena vai para o ANALISE e para
a mensagem de entrega como opção, não vira retrabalho automático. Registrar notas, problemas e o que foi corrigido.

A escuta continua humana: o crítico lê imagem, não ouve. Sincronia de som ele só avalia pelo relatório (picos) e pelo
roteiro; o resto vai para "escuta humana" no ANALISE.
