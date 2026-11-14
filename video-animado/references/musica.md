# Trilha em MIDI (padrão quando não há arquivo de áudio)

A trilha é escrita como partitura MIDI **no tempo do vídeo** (blocos, frases e batidas da timeline) e tocada com
instrumentos gravados. O `musica.py` do projeto compõe; `scripts/midi_lib.py` toca, mixa e grava. É como o
`Video.tsx`: a música nasce do conceito a cada vídeo. O exemplo do template é só sincronia.

## Quando usar cada fonte (`trilha.fonte` no `roteiro.json`)

| Fonte | Quando |
|---|---|
| vazio ou `midi` | **padrão**: orquestral ou de câmara com acentos exatos nos cortes, offline, licenças livres |
| `arquivo` | o pedido trouxe uma música licenciada (`trilha.arquivo` preenchido já escolhe esta) |
| `lyria` | gênero que a orquestra não faz bem (pop, eletrônico, lo-fi), ou pedido explícito |
| `partitura` | sons sintetizados de propósito (o conceito pede som de máquina) |

## Fluxo

1. A voz é gravada e medida (`tts.py`, `tighten.py`).
2. Escrever o `musica.py` do projeto.
3. Rodar `python3 scripts/sound.py`, que grava a timeline e roda o `musica.py` sozinho. Ele gera:
   - `public/audio/music_src.wav`;
   - `public/audio/musica.mid`, a partitura editável em Logic, Ableton ou qualquer programa de música;
   - `public/beats.json`, com as batidas e a virada **exatas**. Não precisa de `beatmap.py`.
4. O `sound.py` segue como com qualquer trilha: eventos da cena, efeitos, `music.wav`.

Para ouvir só a trilha: `~/.venvs/musica/bin/python musica.py`.

## API (`from scripts.midi_lib import Musica`)

```python
m = Musica(bpm=110, compasso=4)        # lê public/timeline.json
m.B, m.BAR, m.total                     # batida e compasso em s; duração do vídeo
m.b(i), m.c(i)                          # instante da batida i / do compasso i
m.na_batida(t, antes=0)                 # leva t para a batida mais próxima (antes=0.05 para antecipar)
m.bloco('b3'), m.frase('b3', 1)         # dados do bloco / instante em que a frase 1 do bloco b3 começa
m.nota('vc_spic', 'D3', t, dur, vel)    # instrumento, altura (notação científica, C4 = dó central), início, duração, 0–1
m.acorde('hn_sus', ['D4', 'F4', 'A4'], t, dur, vel)
m.nota('timp', None, t, 1.5, .9)        # percussão sem altura: None
m.nota('gm:33', 'D2', t, dur, .7)       # qualquer General MIDI (programa 0–127); 'gm:bateria' com nota 36/38/42/49…
m.virada = t                            # momento principal → beats.json (o visual principal cai aqui)
m.render()
```

**Instrumentos gravados** (VSCO 2 Community Edition): `~/.venvs/musica/bin/python scripts/midi_lib.py` lista cada um com
a tessitura.
- **Cordas:** `vln/vla/vc/cb` + `_spic` (curto), `_sus` (longo com vibrato), `_trem`, `_pizz`; mais `harpa`.
- **Metais:** `hn`, `tpt`, `tbn`, `tba` + `_sus`, `_stac`.
- **Madeiras:** `fl`, `ob`, `cl`, `fg`, `picc` + `_sus`, `_stac`.
- **Teclas de percussão:** `glock`, `xilo`, `marimba`.
- **Percussão:** `timp`, `timp_rufo`, `bumbo`, `caixa`, `caixa_rufo`, `prato`, `gongo`, `prato_cresc` (o crescendo
  termina no fim da nota), `pandeiro`, `bigorna`.

Bateria moderna, baixo elétrico, guitarra, piano e sintetizador: `gm:<programa>`, tocados pelo GeneralUser GS.

## Ofício (o que faz a trilha soar composta, não colada)

- **Andamento escolhido pela edição:** cortes e viradas na batida (`na_batida`). A virada da música é o momento visual
  principal (`m.virada`).
- **Arco de intensidade:** começa contido, cresce até a virada ou a oferta, resolve. Intensidade de 0 a 1 por nota.
  Curtas usam sempre a gravação forte, e a dinâmica vem do ganho; longas escolhem a camada pela intensidade.
- **Respiro para a voz:** sob a fala, menos notas e registro fora do da voz (o médio-grave masculino). Nas pausas, a
  música aparece. O ducking do `Soundtrack` ajuda, mas não substitui o arranjo.
- **Acentos com motivo:** golpe (`timp`, `bumbo`, `prato`, `gongo`) só nos cortes que importam. A regra de efeitos (3 a
  5 por minuto) vale também para a trilha.
- **Melodia curta e reconhecível** (4 a 8 notas) num instrumento só. Harmonia simples e clara.
- **Fim desenhado:** golpe final ou acorde que resolve no último bloco, não no fim do arquivo.
- **Anúncio (feedback de uso, 30/09/2026):**
  - a trilha precisa ser animada e dinâmica: pulso claro, percussão presente, energia crescendo até a virada e a oferta;
  - nada de pad contemplativo, piano lento ou cara de documentário sob o anúncio inteiro;
  - sem cara de dance/EDM/balada: bumbo em todo tempo + palmas no 2 e 4 + chimbal corrido soou "baladinha";
  - o que pede: percussão cinematográfica, ostinato de cordas, baixo pulsando, acentos nos cortes.

## Instalação (uma vez)

```bash
brew install fluid-synth
python3.10 -m venv ~/.venvs/musica && ~/.venvs/musica/bin/pip install pretty_midi mido numpy soundfile scipy
mkdir -p ~/.local/share/video-animado/instrumentos && cd ~/.local/share/video-animado/instrumentos
git clone --depth 1 https://github.com/sgossner/VSCO-2-CE.git          # 5 GB, CC0
git clone --depth 1 https://github.com/mrbumpy409/GeneralUser-GS.git   # 31 MB, uso livre inclusive comercial
```

Outro lugar: `VIDEO_INSTRUMENTOS=<pasta>`. Sem a VSCO, tudo toca em General MIDI, com aviso. O catálogo
(`catalogo_vsco.json`) é montado na primeira vez: ele **mede a altura real** de cada pasta, porque a VSCO não usa uma
convenção só de oitava. As articulações curtas herdam a oitava do sustentado do mesmo instrumento.
