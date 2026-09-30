# Busca de assets na internet

Liberdade para buscar e baixar o que deixar o vídeo melhor: fotos de acervo, ilustrações, ícones, fontes, efeitos
sonoros e trilha. Preferir asset real e bom a um procedural genérico. A condição é a licença.

## Regra de licença

| Pode | Não pode |
|---|---|
| Domínio público, CC0, CC-BY (com crédito), MIT/OFL (ícones e fontes), licenças do tipo Pixabay/Unsplash (uso livre) | Resultado de busca de imagem sem licença clara, print de site, frame de filme/TV |
| Acervos públicos com a base de direito declarada (Arquivo Nacional, Wikimedia Commons, Library of Congress) | Foto de pessoa real sem base de direito; logo/marca de terceiros (salvo para citar o próprio produto do vídeo) |
| Música/efeito CC0 ou com licença de uso comercial explícita | Música comercial, mesmo trecho curto |

Na dúvida sobre a licença, não usar e anotar a candidata no ANALISE para quem pediu decidir (padrão de um vídeo anterior:
`referencias/FONTES_IMAGENS.md` com a base de direito de cada peça). Uso externo de material de acervo: o jurídico confirma.

## Onde procurar (por tipo)

- **Fotos históricas e documentos**: Arquivo Nacional (SIAN), Wikimedia Commons (conferir a licença na página do arquivo), Library of Congress, Biblioteca Nacional Digital.
- **Fotos genéricas**: Openverse (filtrar CC0/PD), Unsplash, Pexels, Pixabay.
- **Ilustração no estilo rabisco/flat**: Open Peeps e Humaaans (CC0, personagens desenhados à mão), unDraw (licença própria, livre), Open Doodles (CC0).
- **Ícones**: Iconify/Tabler/Phosphor/Lucide (MIT). Importar o SVG no código para animar com `Stroke`.
- **Fontes**: `@remotion/google-fonts` (OFL), já instalado.
- **Efeitos sonoros**: já temos 467 sons gravados em `biblioteca/sfx/` (6 pacotes Kenney, CC0). Para ampliar: novo pacote numa
  subpasta com `LICENSE.txt` e rodar `python3 biblioteca/sfx/index.py`. **Rede corporativa**: um firewall corporativo bloqueia
  kenney.nl e opengameart.org; passam GitHub (espelhos dos pacotes Kenney), archive.org, BigSoundBank, Freesound, Mixkit.
- **Efeitos sonoros e trilha (outras fontes)**: Freesound (filtrar CC0), Pixabay Sound Effects/Music. A síntese do `sound.py` continua como base; asset baixado entra por cima quando soar mais real (ex.: risada, multidão, notificação de celular).

Baixar com `curl -L` e verificar o arquivo: abrir imagem com Read, `file` para áudio. Se a página exigir login/JS, procurar outra fonte.

## Tratamento para caber no estilo

- Foto em colagem: P&B + leve sépia (`filter: grayscale(1) sepia(.25) contrast(1.1)`) dentro de `Piece` com borda.
- Foto moderna em rabisco: recortar (PIL, ou `img.py` com `recorte` se houver cota) e contornar com `Sticker`.
- Ícone: redesenhar com traço (`Stroke`) em vez de colar pronto — parece feito à mão.
- Áudio baixado: converter para WAV 44,1 kHz com `npx remotion ffmpeg` e normalizar o volume pelos efeitos existentes.

## Registro obrigatório

`CREDITOS.md` na pasta do vídeo: arquivo → URL da página → autor → licença → modificação feita.
CC-BY exige crédito na tela final ou na descrição do post; anotar qual dos dois.
