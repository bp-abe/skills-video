# Biblioteca — o que já temos

Peças promovidas de vídeos anteriores. `novo.sh` copia tudo para o projeto novo:
`biblioteca/componentes/*` → `src/biblioteca/`, `biblioteca/assets/*` → `public/biblioteca/`.
Antes de criar algo do zero, procurar aqui.

## Componentes (`componentes/`)
| Arquivo | O que faz | Estilo | Origem |
|---|---|---|---|
| `SplitFlap.tsx` | Painel split-flap: `FlapBoard` vira plaquinhas em cascata a cada mensagem `{at, text, strike?}`; `flapSchedule()` dá os tempos para o som | legenda/HUD; cores do tema (ink/paper/accent2), fonte Space Mono | destro-canhoto (25/09) |
| `Isotype.tsx` | `Figure` (pessoa de costas, braços 0..1, caneta, respiração), `Hand` (mão pelo dorso, l/r, aceno), `Wire` (fio desenhado com pulso viajando) | pictograma flat, cor por prop | destro-canhoto (25/09) |

Já no template (não duplicar aqui): `Piece`, `Cut`, `Hand`, `Stroke`, `Stamp`, `Typed`, `Slam`, `Sticker`,
`Highlight`, `Finish`, transições `tear|flip|pull|wipe|zoom`, `Sheet`, `Soundtrack`.

## Efeitos sonoros (`sfx/`)
467 sons gravados (Kenney, CC0) em 107 famílias — catálogo em [sfx/INDEX.md](sfx/INDEX.md). Copiados para todo projeto
pelo `novo.sh` (som não enviesa o visual; a escolha das famílias é do conceito).

## Assets (`assets/`) — licença obrigatória em `assets/CREDITOS.md`
| Arquivo | Tipo | Licença | Origem |
|---|---|---|---|
| — | | | |

## Candidatos a promover (ideias, não pré-requisitos — construir quando um vídeo pedir)
- Retrato estilo xilogravura/nanquim em SVG parametrizável (o de um vídeo anterior é específico da pessoa — generalizar: óculos, cabelo, roupa como props)
- Recorte de jornal (`Clipping`) e foto de acervo com legenda (`Photo`) de um vídeo anterior → `componentes/`
- Calendário virando páginas (de um vídeo anterior)
- Personagem rabisco genérico (corpo de pauzinho, expressões) para o estilo rabisco
- Mockup de celular/tela para promo de produto digital
