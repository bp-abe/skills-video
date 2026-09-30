---
name: subir-videos
description: Sobe vídeos prontos para uma pasta de nuvem sincronizada no computador (Google Drive para desktop, Dropbox, OneDrive) num padrão de nomes e pastas fixo (prefixo + título de 3 palavras, uma pasta por vídeo, variações VERTICAL/WIDE/SQUARE no nome, durações separadas) e registra cada vídeo num manifesto CSV para depois cruzar com o resultado dos anúncios. Use quando o usuário pedir para subir, entregar, mandar ou organizar vídeos no Drive, ou disser "sobe na pasta X". Separada da skill video-animado, que só produz os arquivos.
---

# Subir vídeos para a nuvem

A `video-animado` entrega os MP4 no projeto. Esta skill põe os arquivos numa pasta de nuvem com nomes que o time
reconhece. Esses nomes viram a chave para analisar depois o resultado de cada criativo.

## Padrão

```
<pasta de destino, confirmada pelo usuário>/
  <NOME DA CAMPANHA>/
    30S/                                     uma subpasta por duração
      VVS_<TITULO>_30S/                      uma pasta por vídeo
        VVS_<TITULO>_30S_VERTICAL.mp4        9:16 · 1080×1920
        VVS_<TITULO>_30S_WIDE.mp4            16:9 · 1920×1080
        VVS_<TITULO>_30S_SQUARE.mp4          1:1  · 1080×1080
    15S/
      VVS_<TITULO>_15S/ …
```

- **Prefixo** (`VVS` por padrão; outro com `"prefixo"` no manifesto): marca os vídeos feitos com a skill e
  separa esses vídeos dos do time.
- **Título: 3 palavras** que identificam o criativo (o gancho, o personagem, o dispositivo), em CAIXA ALTA, sem acento,
  separadas por `_`. Único dentro da campanha. Ex.: `MEDO_DO_ESCURO`, `FECHE_OS_OLHOS`, `VIAGEM_NO_TEMPO`.
- **Duração nominal no nome** (`30S`, `15S`, `60S`) é a do espaço de mídia. Um corte de 14,0 s vai como `15S`, e a
  duração real fica no registro.
- **Formato no fim do nome:** `VERTICAL`, `WIDE`, `SQUARE`. Formato que não existe fica de fora; não inventar.

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
     acrescenta linhas ao registro geral `~/videos/VVS_REGISTRO.csv`.
6. **Conferir na nuvem** depois de alguns minutos, porque o sync sobe em segundo plano e arquivo grande demora.
7. **Entregar** o link da pasta e a tabela de nomes, e registrar no `ANALISE.md` do projeto onde cada vídeo foi parar.

## Manifesto (modelo)

```json
{
  "destino_local": "~/Library/CloudStorage/GoogleDrive-<seu e-mail>/Drives compartilhados/<drive>/<pasta>",
  "campanha": "NOME DA CAMPANHA",
  "prefixo": "VVS",
  "drive_link": "https://drive.google.com/drive/folders/<id da pasta destino>",
  "videos": [
    {"titulo": "MEDO_DO_ESCURO", "duracao": "30S",
     "arquivos": {"VERTICAL": "…/out/30s_9x16.mp4", "WIDE": "…/out/30s_16x9.mp4", "SQUARE": "…/out/30s_1x1.mp4"},
     "atributos": {"direcao": "animação 2D com personagem", "processo": "pedido-de-video + video-animado",
                   "voz": "Gemini TTS", "trilha": "Lyria, ~120 bpm", "projeto": "~/videos/<slug>"}}
  ]
}
```

## Por que o registro existe

O nome `<PREFIXO>_<TITULO>_<DUR>` é a chave para cruzar com o resultado. O time sobe o criativo no gerenciador de
anúncios com esse nome, e ele aparece no nome do anúncio nos dados de mídia. O `VVS_REGISTRO.csv` guarda os atributos de
cada vídeo (direção, processo, voz, trilha, duração real), para comparar depois o que funciona e o que não funciona. Não
guardar dado pessoal nele.

## Não fazer

- Não subir em pasta que não foi confirmada, nem apagar ou renomear arquivos de outras pessoas na pasta.
- Não mudar o padrão de nomes por conta própria: mudança de padrão é decisão de quem pede.
- MP4 não vai para repositório git.
