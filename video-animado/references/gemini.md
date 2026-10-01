# Capacidades disponíveis

Atualizar a cada vídeo (fase 10). Status: ✅ funciona · ⚠️ funciona com limite · ❌ indisponível · 🔲 não testado.

| Capacidade | Status | Testado em | Nota |
|---|---|---|---|
| TTS `gemini-3.8-flash-tts` | ⚠️ | 2026-09-25 | 7 blocos de uma vez sem 429 no fim do dia (destro-canhoto); 10 req/dia no free tier; 429 "per day" intermitente (`STRICT=1`); cota compartilhada entre vídeos do mesmo dia |
| TTS `gemini-2.5-flash-preview-tts` | ⚠️ | 2026-09-25 | fallback, cota separada; 503 frequente e 429 por minuto (esperar ~70s); lê mais devagar → `tempo_voz` |
| Imagem Gemini (3-pro, 3.1-flash, 3.1-flash-lite, 2.5-flash) | ✅ | 2026-09-29 | **Com billing: 3.1-flash OK em 2K** (~10 imagens num vídeo, sem 429); imagem de referência inline mantém o tratamento entre gerações; às vezes duplica objeto. Free tier: 429 cota zero |
| Veo 3.1 / fast / lite (vídeo) | ⚠️ | 2026-09-25 | free tier: 429 cota zero. **Com chave com billing: lite OK** — image-to-video 4 s, 1280×720, 24 fps, vem com áudio AAC; ~40 s de geração. Download do `uri` exige o header da chave |
| Pollinations (imagem, sem chave) | ⚠️ | 2026-09-25 | responde, mas modelo fraco (Sana), marca d'água e anacronismos: não serve para realista |
| Trilha MIDI + VSCO 2 / GeneralUser GS (**padrão**) | ✅ | 2026-10-01 | composta no `musica.py`, tocada local com orquestra gravada (CC0) e General MIDI; batidas exatas no `beats.json`; ver `musica.md` |
| Lyria 3 Pro (trilha) | ✅ | 2026-09-25 | 64 s pedidos, estrutura [[A]]…[[E]]; saída baixa: volume 0,32 no Soundtrack |
| Alinhamento por palavra (faster-whisper `medium`, local) | ✅ | 2026-09-25 | `scripts/align.py`; transcrição PT-BR exata nos 7 blocos, ~1 min para 56 s de fala |
| TTS local Kokoro-82M (Apache 2.0) | ⚠️ rascunho | 2026-09-25 | ~1–3 s/frase; lê números certo, mas **soa estrangeiro em PT** ("parece gringo"): só rascunho de sincronia |
| TTS local Chatterbox Multilingual (MIT) | ✅ | 2026-09-28 | ~10–30 s/frase (MPS); números por extenso (automático); voz padrão puxa sotaque; clona voz com `referencia` (ex.: a sua voz) — errou "sacudiu" uma vez |
| TTS local Qwen3-TTS 1.7B (Apache 2.0) | ✅ testado | 2026-09-28 | env `~/.venvs/qwen-tts`; **VoiceDesign** cria voz por descrição (melhor em PT com descrição em português e região); **Base** clona com `ref_audio`+`ref_text`; ~11–15 s/frase; único que marcou a pergunta como pergunta. Ainda não ligado ao `tts.py` |
| TTS local **VoxCPM2** (Apache 2.0) — **padrão** | ✅ | 2026-09-28 | `voz: voxcpm` (env `~/.venvs/voxcpm`); clone com `referencia`+`referencia_texto` (referência em `biblioteca/vozes/`), **clone controlável** com `referencia`+`controle` (mesmo timbre, leitura dirigida: "narrador de documentário, grave, solene"; o clone fiel lia "Nove vezes" subindo, animado) ou `descricao`; 6 blocos em ~80 s; pronúncia melhor que o Chatterbox (acertou Goodyear, boia). Escolhido pelo usuário como o mais natural |
| Clonagem de voz (com autorização por escrito) | ✅ testado | 2026-09-28 | referência de 12–17 s de fala natural + transcrição exata (`referencia_texto`); guardar em `biblioteca/vozes/<nome>/` (fora do git) |
| Transcrição local faster-whisper `small` | ✅ | 2026-09-25 | `check_voz.py`, conferência de MP4 final; sem API |
| Modo edição de vídeo gravado | ✅ | 2026-09-28 | corte de silêncio/repetição/tomada errada, zoom, foco, congela, legenda, XML Premiere + SRT; testado com uma gravação real. **Import no Premiere não testado** |
| Remotion render + `npx remotion ffmpeg` | ✅ | 2026-09-24 | sem ffmpeg no sistema |
| Pacotes de motion (transitions, paths, lottie, three, motion-blur…) | ✅ instalados | 2026-09-25 | compila; uso real ainda não validado |
| Busca de assets na web (curl) | ✅ | 2026-09-24 | ver `assets.md` |

# Gemini — voz e imagem (estado de set/2026, free tier)

Chave: `GEMINI_API_KEY` em `~/.config/secrets.env` (`source` antes; nunca imprimir).

## TTS
| Modelo | Endpoint | Estilo | Cota free |
|---|---|---|---|
| `gemini-3.8-flash-tts` (principal) | `POST /v1beta/interactions` | `annotations: [{type: speech_metadata, style}]` | ~10 req/dia, reset ~04h BRT; 429 intermitente |
| `gemini-2.5-flash-preview-tts` (fallback) | `POST /v1beta/models/…:generateContent` | instrução no texto ("Leia como …:") | separada |

Os dois devolvem PCM 24 kHz mono 16-bit (o `tts.py` embrulha em WAV). Num vídeo de teste, os dois deram a mesma
F0 e o mesmo ritmo; o 2.5 tem entonação um pouco mais contida. Misturar modelos num vídeo só com registro no ANALISE.

**Vozes** (30) — F = feminina, M = masculina:

| Voz | | Caráter | Voz | | Caráter |
|---|---|---|---|---|---|
| Zephyr | F | brilhante | Puck | M | animada |
| Charon | M | informativa, grave | Kore | F | firme |
| Fenrir | M | empolgada | Leda | F | jovem |
| Orus | M | firme | Aoede | F | leve |
| Callirrhoe | F | tranquila | Autonoe | F | brilhante |
| Enceladus | M | sussurrada | Iapetus | M | clara |
| Umbriel | M | tranquila | Algieba | M | suave |
| Despina | F | suave | Erinome | F | clara |
| Algenib | M | rouca | Rasalgethi | M | informativa |
| Laomedeia | F | animada | Achernar | F | macia |
| Alnilam | M | firme | Schedar | M | uniforme |
| Gacrux | F | madura | Pulcherrima | F | direta |
| Achird | M | amigável | Zubenelgenubi | M | casual |
| Vindemiatrix | F | gentil | Sadachbia | F | vivaz |
| Sadaltager | M | conhecedora | Sulafat | F | calorosa |

(Gênero conforme a documentação do Google; conferir ouvindo a amostra se for decisivo.)

Escolher a voz pelo conceito do vídeo, lendo o caráter na tabela — não por hábito nem pelo que o último vídeo usou.
Testar a voz com 1 frase curta antes de gravar tudo (gasta 1 requisição).

**Amostras para escolher** (quando o usuário pedir "quero ouvir opções", ou quando a escolha for decisiva e ele estiver
disponível): gravar a mesma frase do roteiro em 2 ou 3 vozes candidatas, salvar em `amostras/<voz>.wav`, abrir a pasta
(`open amostras/`) e esperar a escolha. Custa 1 requisição por voz: com cota curta, usar o 2.5 (`TTS_MODEL=2.5`)
nas amostras e gravar o final no 3.8.

`estilo_voz`: descrever pessoa, tom e ritmo, em PT ("locutora jovem e sorridente, ritmo animado, articulando bem").
Evitar pedir "lento": o TTS arrasta. O `tighten` já cuida das pausas.

## Imagem
`gemini-3-pro-image`, `gemini-3.1-flash-image`, `gemini-2.5-flash-image` (`generateContent`, `responseModalities: ["IMAGE"]`,
`imageConfig.aspectRatio`, `imageConfig.imageSize: "2K"` nos 3.x). **A chave atual tem billing: `3.1-flash` funciona**
(29/09/2026); no free tier os três devolvem 429 com cota zero. O `img.py` tenta em ordem e sai com código 2; aí o
fallback é desenhar em código. Tratamento único: `tratamento_imagem` vai em todo prompt e a 1ª imagem aprovada entra
como `ref` das outras. `recorte` pede fundo verde chapado e recorta com despill (o branco comia objetos claros).

## Vídeo (Veo)
Não testado nesta chave; provavelmente sem cota no free tier. A skill não depende dele: a animação é código, e é isso
que garante sincronia exata com a narração.

## Música (Lyria)
`POST /v1beta/models/<modelo>:generateContent`, corpo `{"contents":[{"parts":[{"text": prompt}]}],"generationConfig":{"responseModalities":["AUDIO"]}}`.
Retorna uma parte `text` (estrutura, ex. `[[A0]] [[B1]]…` ou `<instrumental>`) e uma `inlineData` `audio/mpeg`.
A duração vai no texto do prompt ("75-second instrumental track…"); o Pro respeita. Saída com marca d'água SynthID;
uso sob os termos da API do Gemini — peça externa/paga: conferir com o jurídico.

## TTS local (sem API)

Ambiente `~/.venvs/tts-local` (Python 3.10, torch com MPS): `chatterbox-tts`, `kokoro`, `faster-whisper`, `num2words`,
`soundfile` + `brew install espeak-ng` (fonemas do Kokoro). Modelos no cache do Hugging Face (~3 GB; huggingface.co
passa pelo firewall). Comando avulso fora da skill: `~/.local/bin/chatterbox-pt "texto" -o fala.wav`.

| `voz` | Caráter | Velocidade | Observações |
|---|---|---|---|
| `kokoro:pf_dora` | feminina, clara | ~3s/bloco | **só rascunho**: em português soa estrangeira ("parece gringo", teste de 25/09); neutra; fala rápido (~3,3 palavras/s) → orçar ~3 palavras/s ou `voz_params.velocidade: 0.9` |
| `kokoro:pm_alex` | masculina | idem | idem |
| `kokoro:pm_santa` | masculina | idem | tende a emendar frases (pontuar bem) |
| `chatterbox` | voz padrão do modelo, expressiva | ~20–40s/bloco | `emocao` 0.25–1.0 (padrão 0.5), `ritmo` 0.3 lento/marcado … 0.7 rápido; `referencia` = WAV ~10s limpo para clonar (com autorização); marca d'água inaudível (Perth) |

Teste comparativo (25/09, mesmo texto de um vídeo de teste): Gemini e Kokoro transcreveram 100% certo; Chatterbox errou os
anos em algarismos ("1914" → "1994") até os números irem por extenso — o `tts_local.py` já converte.
Os picos do Kokoro são fortes: o `tighten` tem limitador suave desde 25/09.
