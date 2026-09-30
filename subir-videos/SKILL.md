---
name: subir-videos
description: Sobe vídeos prontos para uma pasta de nuvem sincronizada no computador (Google Drive para desktop, Dropbox, OneDrive) num padrão de nomes e pastas fixo (vvs_<formato>_<palavras do título>.mp4, formato vertical/square/wide, uma pasta por vídeo com um como_foi_feito.md do processo, durações separadas) e registra cada vídeo num manifesto CSV para depois cruzar com o resultado dos anúncios. Use quando o usuário pedir para subir, entregar, mandar ou organizar vídeos no Drive, ou disser "sobe na pasta X". Separada da skill video-animado, que só produz os arquivos.
---

# Subir vídeos para a nuvem

A `video-animado` entrega os MP4 no projeto. Esta skill põe os arquivos numa pasta de nuvem com nomes que o time
reconhece. Esses nomes viram a chave para analisar depois o resultado de cada criativo.

## Padrão

```
<pasta de destino, confirmada pelo usuário>/
  <NOME DA CAMPANHA>/
    30S/                                     uma subpasta por duração
      vvs_bala_coroa/                        uma pasta por vídeo
        vvs_vertical_bala_coroa.mp4          9:16 · 1080×1920
        vvs_wide_bala_coroa.mp4              16:9 · 1920×1080
        vvs_square_bala_coroa.mp4            1:1  · 1080×1080
        como_foi_feito.md                    processo de criação do vídeo
    15S/
      vvs_bala_coroa/ …
```

- **Nome do arquivo:** `<prefixo>_<formato>_<palavras>.mp4`, tudo em minúsculas. O prefixo é `vvs` por padrão e muda
  com `"prefixo"` no manifesto.
- **Formato:** o vertical vira `vertical`, o quadrado vira `square` e o horizontal vira `wide`. Formato que não existe
  fica de fora; não inventar.
- **Palavras:** de 1 a 4, tiradas do **título do vídeo**, em minúsculas e sem acento. Artigos, preposições, "e" e
  "que" ficam de fora (o script tira sozinho).
  - "A bala na coroa" vira `vvs_vertical_bala_coroa.mp4`.
  - "Três crianças diante do poder" vira `vvs_wide_tres_criancas_diante_poder.mp4`.
  - Se sobrarem mais de 4, escolher em `"palavras"` no manifesto; o script recusa até lá.
- **A pasta do vídeo** é `<prefixo>_<palavras>`. A duração fica só na subpasta (`30S/`, `15S/`) e no registro. Um
  corte de 14,0 s vai em `15S/`.
- **O mesmo título em duas durações** gera o mesmo nome de arquivo em pastas diferentes. O script avisa. No
  gerenciador de anúncios, pôr a duração no nome do anúncio.
- **`como_foi_feito.md`** em toda pasta de vídeo, para qualquer pessoa analisar o processo de criação. O script monta o
  documento a partir do projeto de origem (`atributos.projeto`):
  - ficha técnica;
  - direção, voz e trilha;
  - conceito e roteiro, tirados do `roteiro.json`;
  - o `ANALISE.md` e o `RELATORIO.md` do projeto: brief, conceitos, bíblia e notas da crítica.

## Passo a passo

1. **Pasta de destino: quem pede sempre confirma.** Nunca adivinhar. Se não disserem, perguntar.
2. **Achar o caminho local da pasta sincronizada.** No macOS, o Google Drive para desktop fica em
   `~/Library/CloudStorage/GoogleDrive-<seu e-mail>/` (`Meu Drive/`, `Drives compartilhados/`). Se vier um link do
   Drive e houver conector do Drive, dá para subir pela cadeia de pastas-pai (`parentId`) até o nome que existe no sync.
   Copiar para a pasta sincronizada é o upload; não mandar MP4 grande pela API.
3. **Montar o manifesto** (`manifesto.json`, modelo abaixo): cada vídeo com título, duração nominal e o caminho dos
   arquivos por formato, mais os atributos para análise (direção criativa, processo, voz, trilha, projeto de origem).
4. **Mostrar a tabela de nomes e o destino** antes de copiar, a menos que já tenham dito para subir direto. Costuma ser
   uma pasta compartilhada.
5. **Rodar** `python3 ~/.claude/skills/subir-videos/subir.py manifesto.json`.
   - Antes, rodar com `--seco`: só valida e mostra os nomes.
   - Se os arquivos já estiverem na nuvem, usar `--so-registro`: grava só o registro.
   - O script confere dimensão e duração, recusa nome fora do padrão ou título repetido, cria as pastas, copia e
     escreve o `como_foi_feito.md` de cada vídeo e acrescenta linhas ao registro geral `~/videos/VVS_REGISTRO.csv`.
6. **Conferir na nuvem** depois de alguns minutos, porque o sync sobe em segundo plano e arquivo grande demora.
7. **Entregar** o link da pasta e a tabela de nomes, e registrar no `ANALISE.md` do projeto onde cada vídeo foi parar.

## Manifesto (modelo)

```json
{
  "destino_local": "~/Library/CloudStorage/GoogleDrive-<seu e-mail>/Drives compartilhados/<drive>/<pasta>",
  "campanha": "NOME DA CAMPANHA",
  "prefixo": "vvs",
  "drive_link": "https://drive.google.com/drive/folders/<id da pasta destino>",
  "videos": [
    {"titulo": "A bala na coroa", "duracao": "30S",
     "arquivos": {"vertical": "…/out/30s_9x16.mp4", "wide": "…/out/30s_16x9.mp4", "square": "…/out/30s_1x1.mp4"},
     "atributos": {"direcao": "animação 2D com personagem", "processo": "pedido-de-video + video-animado",
                   "voz": "Gemini TTS", "trilha": "Lyria, ~120 bpm", "projeto": "~/videos/<slug>"}}
  ]
}
```

## Por que o registro existe

O nome `<prefixo>_<formato>_<palavras>` é a chave para cruzar com o resultado (com a duração no nome do anúncio). O time sobe o criativo no gerenciador de
anúncios com esse nome, e ele aparece no nome do anúncio nos dados de mídia. O `VVS_REGISTRO.csv` guarda os atributos de
cada vídeo (direção, processo, voz, trilha, duração real), para comparar depois o que funciona e o que não funciona. Não
guardar dado pessoal nele.

## Não fazer

- Não subir em pasta que não foi confirmada, nem apagar ou renomear arquivos de outras pessoas na pasta.
- Não mudar o padrão de nomes por conta própria: mudança de padrão é decisão de quem pede.
- MP4 não vai para repositório git.
