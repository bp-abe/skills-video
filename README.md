# Skills de vídeo para Claude Code

Quatro peças para fazer e entregar vídeo animado com o Claude Code, de ponta a ponta, escrevendo código:

| Pasta | O que é |
|---|---|
| [`video-animado/`](video-animado/) | **A skill de produção.** A partir de um tema, roteiro, anotações ou gravação, gera o vídeo pronto (MP4 16:9 e/ou 9:16): roteiro, conceito visual, narração, trilha, efeitos, animação em [Remotion](https://www.remotion.dev), revisão por um crítico independente com nota e render. Também edita vídeo gravado (corta silêncio e tomada errada, zoom, legenda palavra a palavra, XML para Premiere). |
| [`pedido-de-video/`](pedido-de-video/) | **A skill que monta o pedido.** Transforma uma ideia solta no pedido que a `video-animado` executa bem: o que precisa ser dito (objetivo, público, mensagem, verdade, limites) e o que pode ficar aberto (estilo, voz, trilha). |
| [`subir-videos/`](subir-videos/) | **A skill de entrega.** Sobe os MP4 prontos para uma pasta de nuvem sincronizada (Google Drive, Dropbox) num padrão de nomes fixo (`vvs_<formato>_<palavras do título>.mp4`), confere dimensão e duração, escreve um `como_foi_feito.md` com o processo de criação em cada pasta e registra cada vídeo num CSV para cruzar depois com o resultado dos anúncios. |
| [`mesa-de-estilos/`](mesa-de-estilos/) | **Página de referências.** 60 estilos de motion design, cada um com uma amostra animada feita em código, filtros e "copiar direção de estilo" para colar no pedido. **[Abrir a página](https://bp-abe.github.io/skills-video/mesa-de-estilos/mesa-de-estilos.html)** (ou abra o HTML local no navegador). |

## Princípio

A skill guarda **infraestrutura, não gosto**: ferramentas (voz, trilha, render, transcrição), regras de verdade,
técnica com números, revisão e lições técnicas. Ela não prescreve o visual: o conceito nasce do conteúdo a cada vídeo,
e um script de diversidade avisa quando o modelo repete o mundo visual de vídeos anteriores. Detalhes em
[`video-animado/SKILL.md`](video-animado/SKILL.md).

## Ferramentas

Testado em macOS 15, Apple Silicon (M-series), 24 GB de RAM.

| Ferramenta | Versão testada | Para quê | Obrigatório? |
|---|---|---|---|
| [Claude Code](https://docs.claude.com/en/docs/claude-code) | — | roda as skills | sim |
| Node.js + npm | 25.6 / 11.8 | Remotion (animação e render) | sim |
| [Remotion](https://www.remotion.dev) + `@remotion/*` | 4.0.528 | animação em React, render MP4 (versões fixas em `video-animado/template/package.json`) | sim |
| ffmpeg (do sistema, `brew install ffmpeg`) | 9.0 | loudness −14 LUFS em duas passadas, cortes, folhas de revisão (o ffmpeg que vem com o Remotion não tem os filtros) | sim |
| Python 3.10 + `numpy`, `pillow` | 3.10.0 | scripts do template (tempo, som, revisão, diversidade, imagem) | sim |
| Chave da API do Gemini (`GEMINI_API_KEY`) | — | voz Gemini TTS, trilha Lyria, imagem (`gemini-3.1-flash-image`), vídeo Veo | não: há modo offline |
| venv `tts-local`: `faster-whisper`, `librosa`, `num2words`, `soundfile`, `kokoro`, `chatterbox-tts` | 1.2.1 / 0.11 / 0.5.14 / 0.14 / 0.9.4 / 0.1.7 | transcrição local (conferir voz, alinhar palavra a palavra, modo edição), mapa de batidas, vozes locais de rascunho | sim (a transcrição) |
| venv `voxcpm`: [`voxcpm`](https://github.com/OpenBMB/VoxCPM) | 2.0.3 | **voz local padrão**: VoxCPM2 com clonagem de voz autorizada; roda sem API | recomendado |
| venv `qwen-tts` (opcional) | 0.1.1 | alternativa de voz local | não |
| `espeak-ng` (`brew install espeak-ng`) | — | fonemas em português para o Kokoro | só com Kokoro |
| Google Chrome | — | bancada de teste da Mesa de Estilos (screenshots headless) | não |
| `yt-dlp` | — | baixar vídeos de referência para estudar | não |

Efeitos sonoros: a biblioteca [Kenney](https://kenney.nl) (CC0, domínio público) já vem em
`video-animado/biblioteca/sfx/kenney/`, com as licenças.

## Instalação

```bash
# 1. ferramentas do sistema
brew install node ffmpeg python@3.10 espeak-ng

# 2. skills no Claude Code
git clone https://github.com/bp-abe/skills-video.git
mkdir -p ~/.claude/skills
cp -R skills-video/video-animado skills-video/pedido-de-video skills-video/subir-videos ~/.claude/skills/

# 3. dependências do Remotion (uma vez; cada projeto novo clona estas)
cd ~/.claude/skills/video-animado/template && npm install

# 4. Python do sistema
python3 -m pip install numpy pillow

# 5. ambientes de voz e transcrição (baixam modelos do Hugging Face no primeiro uso)
python3.10 -m venv ~/.venvs/tts-local && ~/.venvs/tts-local/bin/pip install faster-whisper librosa num2words soundfile kokoro misaki chatterbox-tts
python3.10 -m venv ~/.venvs/voxcpm && ~/.venvs/voxcpm/bin/pip install voxcpm soundfile

# 6. chave do Gemini (opcional) — num arquivo fora de qualquer repositório
mkdir -p ~/.config && echo 'export GEMINI_API_KEY=sua-chave' >> ~/.config/secrets.env && chmod 600 ~/.config/secrets.env
```

**Voz clonada (opcional):** coloque em `~/.claude/skills/video-animado/biblioteca/vozes/<nome>/` um `ref.wav`
(12–17 s de fala natural) e o `texto.txt` com a transcrição exata. Depois aponte `voz_params` no
`template/roteiro.json` para essa pasta. **Clonagem só com autorização por escrito de quem fala.** Sem voz clonada,
use uma voz do Gemini (`"voz": "Charon"`, por exemplo) ou uma voz desenhada do VoxCPM (`voz_params.descricao`).

## Primeiro vídeo

No Claude Code:

```
Faz um vídeo de teste de 20 s sobre a origem do café, sem usar as APIs.
```

Ou use `/pedido-de-video` para montar o pedido antes. Os projetos são criados em `~/videos/<slug>/`, e o MP4 final
sai em `out/`.

## Limites que vale saber

- **Remotion tem licença própria:** é gratuito para pessoas físicas e empresas com até 3 pessoas. Empresas maiores
  precisam de licença de empresa ([remotion.dev/license](https://www.remotion.dev/license)).
- **Gemini sem pagamento:** o TTS dá cerca de 10 requisições por dia, e imagem e vídeo (Veo) ficam sem cota. O modo
  offline (`"offline": true`) usa só voz local e trilha composta em código.
- **VoxCPM2 ocupa 10–13 GB de RAM.** O `tts_local.py` tem uma trava para que só uma voz local rode por vez na máquina.
- **Verdade:** a skill só põe na tela dado com fonte ou marcado como ilustração, e imagem gerada nunca representa
  pessoa real sem rótulo.

## Licenças de terceiros

| Componente | Licença |
|---|---|
| Kenney (efeitos) | CC0 |
| VoxCPM2 | Apache 2.0 |
| Kokoro | Apache 2.0 |
| Chatterbox | MIT |
| faster-whisper | MIT |
| Remotion | licença Remotion (ver acima) |

Os links de exemplos na Mesa de Estilos apontam para obras de terceiros, e as amostras da página são esboços originais
em código.

## Atualizar este repositório

O repositório é uma exportação das skills em uso. Quem mantém roda um script local (fora do repositório) que copia as
skills, tira o que é privado (vozes, vídeos de referência, histórico e portfólio internos) e falha se sobrar algum
termo interno. Contribuições por pull request são bem-vindas e entram na fonte à mão.
