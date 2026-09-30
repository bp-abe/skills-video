# Prompt para testar sem a skill

Cole numa sessão nova do Claude Code, numa pasta vazia. Troque o que está entre [colchetes].
A chave do Gemini precisa estar em `GEMINI_API_KEY` (no ambiente ou num `.env` na pasta).

---

Crie um vídeo animado de [30–60s] sobre **[TEMA]**, para [PÚBLICO / CANAL], em 16:9 e 9:16.
Trabalhe de forma autônoma até o MP4 final. Qualidade profissional é o critério.

**Liberdade criativa.** Não use nenhum estilo pré-definido. A partir só do conteúdo, proponha para você mesmo
3 conceitos bem diferentes entre si, cada um com dispositivo narrativo, mundo visual, paleta, material/textura,
tipografia, movimento e som. Pelo menos um deve ser algo incomum. Escolha o melhor para o conteúdo e registre os 3
e o porquê num `ANALISE.md`. Dispositivos que funcionam: dois mundos em contraste, um meio único que se transforma,
um objeto que evolui em estágios, um motivo condutor que abre e fecha o vídeo, um personagem que vive cada ideia.
Cada ideia do roteiro ganha uma metáfora visual concreta; mostrar o texto na tela não conta.

**Bíblia visual antes do código**: resolução/grade, paleta com número fechado de cores, espessura de traço,
"fps de sensação", luz, tipografia (no máximo 2 + 1) e uma frase de padrão de qualidade ("deve parecer X, não Y").
Faça 2 ou 3 quadros-chave como imagem estática, abra, critique contra a bíblia e refaça antes de animar tudo.

**Barra de qualidade**: vídeos feitos 100% em código, como os da thread https://x.com/EricBuess/status/2103226548413182366 :
cena densa com movimento ambiente, movimento secundário, escalada visual até o clímax, câmera e luz com intenção,
fim que retoma a abertura. Um vídeo desses tem milhares de linhas de código; não economize em cena.

**Pipeline técnico:**
1. **Roteiro** em blocos de 4–8s, 1 ideia por bloco, ~2,4 palavras/s. Gancho nos 2 primeiros segundos.
   Se for factual, cheque com fonte antes de gravar a voz.
2. **Voz** com Gemini TTS, bloco a bloco. Principal: `POST https://generativelanguage.googleapis.com/v1beta/interactions`,
   header `x-goog-api-key`, corpo
   `{"model":"gemini-3.8-flash-tts","input":[{"type":"user_input","content":[{"type":"text","text":"…","annotations":[{"type":"speech_metadata","style":"…"}]}]}],"response_format":{"type":"audio"},"generation_config":{"speech_config":[{"voice":"…"}]}}`.
   Fallback quando der 429 de cota: `gemini-2.5-flash-preview-tts` via `:generateContent`. Retorno: PCM 24 kHz mono 16-bit
   em base64. O free tier tem ~10 requisições/dia: faça cache por bloco e não regrave o que não mudou.
   Escolha a voz pelo conceito (há 30: Kore, Charon, Puck, Sulafat, Achird…).
3. **Meça** cada WAV (duração real e início de cada frase por detecção de pausa) e cronometre a animação por isso,
   nunca por estimativa. O visual entra 2–4 frames antes da palavra.
4. **Som**: trilha e efeitos sintetizados em Python (numpy/scipy) ou assets de licença livre. Trilha com ducking de
   ~7 dB sob a voz; todo elemento que entra tem um efeito sonoro; voz normalizada e sem clipping.
5. **Animação** em Remotion (React/TypeScript), 30 fps, 1920×1080 e 1080×1920 com o mesmo código, layout adaptado ao
   formato e zona segura no 9:16. Desenhe em SVG/Canvas/WebGL; construa os componentes que o conceito pedir.
   Pacotes `@remotion/*` úteis: transitions, paths, shapes, noise, motion-blur, lottie, three.
   Se não houver ffmpeg no sistema, use `npx remotion ffmpeg`.
6. **Assets** da internet só com licença clara (domínio público, CC0, CC-BY com crédito), registrados em `CREDITOS.md`.
   Nunca foto de pessoa real sem direito, música comercial ou logo de terceiros.
7. **Render** dos dois formatos + 8 quadros de cada para revisão visual. Abra os quadros e corrija o que estiver cortado,
   ilegível ou fora da bíblia.
8. **ANALISE.md** final: conceitos considerados, decisões, fontes, o que precisa de escuta humana.

---

*Para comparar com a skill: rode o mesmo [TEMA] aqui e com a skill `video-animado`, e compare conceito, variedade visual e acabamento.*
