"""Trilha DESTE vídeo, composta em MIDI e tocada com instrumentos gravados.

Este exemplo mostra SINCRONIA, não estilo: substituir pela música que o conceito pedir (instrumentação, andamento,
harmonia, arco). Regras e instrumentos: references/musica.md · lista com tessituras: ~/.venvs/musica/bin/python scripts/midi_lib.py

Roda sozinho pelo `python3 scripts/sound.py` (trilha.fonte vazio ou "midi"), depois da voz medida: a timeline já
existe e cada nota pode cair num bloco, numa frase ou numa batida. Teste isolado: ~/.venvs/musica/bin/python musica.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from scripts.midi_lib import Musica

m = Musica(bpm=96)
ids = list(m.blocos)

# 1. chão harmônico: uma nota longa por bloco, trocando na batida mais próxima do início de cada bloco
for i, bid in enumerate(ids):
    b = m.bloco(bid)
    ini, fim = m.na_batida(b['start']), m.na_batida(b['start'] + b['dur'] + .4)
    m.nota('vc_sus', 'D3' if i % 2 == 0 else 'A2', ini, fim - ini, .45)

# 2. pulso: uma nota curta por batida, mais forte no começo do compasso
for i in range(int(m.total / m.B)):
    m.nota('vc_spic', 'D2', m.b(i), m.B / 2, .55 if i % m.compasso == 0 else .35)

# 3. acento no momento principal (aqui, a 1ª frase do último bloco), que vai como "virada" para o beats.json
m.virada = m.na_batida(m.frase(ids[-1], 0))
m.nota('timp', None, m.virada, 1.5, .9)

m.render()
