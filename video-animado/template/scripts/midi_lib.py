"""Trilha em MIDI tocada com instrumentos gravados. Roda no ambiente ~/.venvs/musica (pretty_midi, soundfile, scipy).

A composição é de cada vídeo: o projeto tem um `musica.py` que usa esta biblioteca. O `sound.py` chama o `musica.py`
sozinho quando trilha.fonte = "midi" (o padrão quando não há arquivo de áudio).

    from scripts.midi_lib import Musica
    m = Musica(bpm=110)                       # lê public/timeline.json e roteiro.json
    t = m.frase('b3', 0)                      # instante (s) em que começa a 1ª frase do bloco b3
    m.nota('vc_spic', 'D3', m.b(0), m.B / 2, .6)        # instrumento, altura, início, duração, intensidade 0–1
    m.acorde('hn_sus', ['D4', 'F4', 'A4'], t, 2.0, .9)
    m.nota('gm:33', 'D2', 0, 4, .7)           # qualquer instrumento General MIDI (aqui, baixo elétrico)
    m.nota('gm:bateria', 36, m.b(4), .2, .9)  # bateria GM pela nota (36 bumbo, 38 caixa, 42 chimbal, 49 prato)
    m.virada = t                              # momento principal (vai para beats.json)
    m.render()                                # music_src.wav + musica.mid + beats.json

Instrumentos gravados (VSCO 2 Community Edition, CC0): ver INSTRUMENTOS abaixo (`python midi_lib.py` lista).
Alturas em notação científica (C4 = dó central). Tudo que não está na VSCO: General MIDI (GeneralUser GS).
"""
import glob, json, os, re, subprocess, sys
from pathlib import Path
import numpy as np, pretty_midi, soundfile as sf
from scipy.signal import fftconvolve

ROOT = Path(__file__).resolve().parent.parent
INST = Path(os.environ.get('VIDEO_INSTRUMENTOS', '~/.local/share/video-animado/instrumentos')).expanduser()
VSCO, GMSF = INST / 'VSCO-2-CE', INST / 'GeneralUser-GS' / 'GeneralUser-GS.sf2'
SR = 44100
NOTA = pretty_midi.note_name_to_number

# chave: (pasta na VSCO, curto?, família, pan, ganho, programa GM equivalente para o .mid)
INSTRUMENTOS = {
    'vln_spic': ('Strings/Violin Section/Spic', 1, 'cordas', -.35, .55, 48), 'vln_sus': ('Strings/Violin Section/susVib', 0, 'cordas', -.35, .45, 48),
    'vln_trem': ('Strings/Violin Section/Trem', 0, 'cordas', -.35, .45, 44), 'vln_pizz': ('Strings/Violin Section/Pizz', 1, 'cordas', -.35, .6, 45),
    'vla_spic': ('Strings/Viola Section/spic', 1, 'cordas', -.1, .45, 48), 'vla_sus': ('Strings/Viola Section/susvib', 0, 'cordas', -.1, .45, 48),
    'vla_trem': ('Strings/Viola Section/trem', 0, 'cordas', -.1, .45, 44), 'vla_pizz': ('Strings/Viola Section/pizz', 1, 'cordas', -.1, .6, 45),
    'vc_spic': ('Strings/Cello Section/spic', 1, 'cordas', .3, .7, 42), 'vc_sus': ('Strings/Cello Section/susvib', 0, 'cordas', .3, .5, 42),
    'vc_trem': ('Strings/Cello Section/trem', 0, 'cordas', .3, .5, 44), 'vc_pizz': ('Strings/Cello Section/pizzT', 1, 'cordas', .3, .6, 45),
    'cb_spic': ('Strings/Solo Contrabass/Spic', 1, 'cordas', .4, .6, 43), 'cb_sus': ('Strings/Solo Contrabass/SusVib', 0, 'cordas', .4, .55, 43),
    'cb_trem': ('Strings/Solo Contrabass/Trem', 0, 'cordas', .4, .5, 43), 'cb_pizz': ('Strings/Solo Contrabass/Pizz', 1, 'cordas', .4, .6, 43),
    'harpa': ('Strings/Harp', 1, 'cordas', -.2, .6, 46),
    'hn_sus': ('Brass/F Horn/sus', 0, 'metais', -.2, .5, 60), 'hn_stac': ('Brass/F Horn/stac', 1, 'metais', -.2, .5, 60),
    'tpt_sus': ('Brass/Trumpet/sus', 0, 'metais', -.05, .45, 56), 'tpt_stac': ('Brass/Trumpet/stac', 1, 'metais', -.05, .45, 56),
    'tbn_sus': ('Brass/Tenor Trombone/sus', 0, 'metais', .25, .45, 57), 'tbn_stac': ('Brass/Tenor Trombone/stac', 1, 'metais', .25, .45, 57),
    'tba_sus': ('Brass/Tuba/sus', 0, 'metais', .1, .55, 58), 'tba_stac': ('Brass/Tuba/stac', 1, 'metais', .1, .55, 58),
    'fl_sus': ('Woodwinds/Flute/susNV', 0, 'madeiras', -.15, .45, 73), 'fl_stac': ('Woodwinds/Flute/stac', 1, 'madeiras', -.15, .45, 73),
    'ob_sus': ('Woodwinds/Oboe/Sus', 0, 'madeiras', .05, .45, 68), 'ob_stac': ('Woodwinds/Oboe/Stacc', 1, 'madeiras', .05, .45, 68),
    'cl_sus': ('Woodwinds/Clarinet/susLong', 0, 'madeiras', .15, .45, 71), 'cl_stac': ('Woodwinds/Clarinet/stac', 1, 'madeiras', .15, .45, 71),
    'fg_sus': ('Woodwinds/Bassoon/sus', 0, 'madeiras', .25, .5, 70), 'fg_stac': ('Woodwinds/Bassoon/stac', 1, 'madeiras', .25, .5, 70),
    'picc_sus': ('Woodwinds/Piccolo/Sus', 0, 'madeiras', -.2, .4, 72), 'picc_stac': ('Woodwinds/Piccolo/Stac', 1, 'madeiras', -.2, .4, 72),
    'glock': ('Percussion/Glock', 1, 'perc', -.1, .45, 9), 'xilo': ('Percussion/Xylo', 1, 'perc', .1, .45, 13), 'marimba': ('Percussion/Marimba', 1, 'perc', 0, .5, 12),
}
# percussão sem altura: (padrão de arquivos, família, ganho, nota de bateria GM para o .mid); a intensidade escolhe a camada
PERCUSSAO = {
    'timp': ('Percussion/Timpani/Timpani[12]_Hit_*.wav', .9, 41), 'timp_rufo': ('Percussion/Timpani/Rolls/*.wav', .7, 41),
    'bumbo': ('Percussion/BDrumNewhit_*.wav', .9, 36), 'caixa': ('Percussion/Snare2-HitNS*', .5, 38), 'caixa_rufo': ('Percussion/Snare2-rollNS*', .35, 38),
    'prato': ('Percussion/cymbal-crash1_*', .5, 49), 'gongo': ('Percussion/gongHit_*.wav', .55, 52), 'prato_cresc': ('Percussion/susCymb1-cresc-Median*', .45, 55),
    'pandeiro': ('Percussion/Tamb1-Hit*', .4, 54), 'bigorna': ('Percussion/Anvil_Hit*', .45, 76),
}
SALA = {'cordas': .32, 'metais': .30, 'madeiras': .30, 'perc': .22, 'gm': .25}
DIN = {'ppp': 0, 'pp': 1, 'p': 2, 'mp': 3, 'mf': 4, 'f': 5, 'ff': 6, 'fff': 7, 'soft': 2, 'quiet': 2, 'med': 4, 'medium': 4, 'loud': 6}


def _midi_nome(s):  # 'A#2' -> MIDI, na notação do nome (a oitava real é corrigida medindo)
    m = re.match(r'([A-G]#?)(-?\d)$', s)
    return NOTA(m.group(1) + '0') + 12 * int(m.group(2)) if m else None


def _f0(arq):  # frequência fundamental por produto harmônico do espectro
    a, sr = sf.read(arq, always_2d=True, dtype='float32'); x = a.mean(1)
    i0 = int(.06 * sr); x = x[i0:i0 + int(.5 * sr)]
    if len(x) < 2048: return None
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)), 8 * len(x))); fr = np.fft.rfftfreq(8 * len(x), 1 / sr)
    hps = X.copy()
    for h in (2, 3, 4): hps[:len(X[::h])] *= X[::h]
    ok = (fr > 25) & (fr < 2500)
    return float(fr[ok][np.argmax(hps[ok])])


def _catalogo():
    """Índice nota → camada → arquivos de cada instrumento, com a oitava corrigida medindo a altura real (cacheado)."""
    cache = INST / 'catalogo_vsco.json'
    if cache.exists():
        return {k: {int(n): {int(c): fs for c, fs in cs.items()} for n, cs in v.items()} for k, v in json.load(open(cache)).items()}
    cat, offs = {}, {}
    # sustentados primeiro: a articulação curta herda a oitava medida no sustentado do mesmo instrumento
    # (nota curta engana o detector, e o clarinete, com harmônicos ímpares, também)
    for k, (pasta, *_) in sorted(INSTRUMENTOS.items(), key=lambda kv: not kv[0].endswith('_sus')):
        b = {}
        for f in glob.glob(str(VSCO / pasta / '*.wav')):
            nome = os.path.splitext(os.path.basename(f))[0]
            alt = next((_midi_nome(t) for t in re.split(r'[_\-]', nome) if _midi_nome(t) is not None), None)
            if alt is None: continue
            cam = re.search(r'_v(\d)', nome) or re.search(r'dyn(\d)', nome)
            cam = int(cam.group(1)) if cam else next((DIN[t.lower()] for t in re.split(r'[_\-.]', nome) if t.lower() in DIN), 1)
            b.setdefault(alt, {}).setdefault(cam, []).append(f)
        if not b: continue
        medidas = []
        for alt in sorted(b)[len(b) // 3: len(b) // 3 + 3]:  # mede 3 notas do meio da tessitura
            f0 = _f0(sorted(b[alt][min(b[alt])])[0])
            if f0: medidas.append(round((69 + 12 * np.log2(f0 / 440) - alt) / 12) * 12)
        off = max(set(medidas), key=medidas.count) if medidas else 12
        base = k.split('_')[0]
        if not k.endswith('_sus') and f'{base}_sus' in offs: off = offs[f'{base}_sus']
        offs[k] = off
        cat[k] = {alt + off: {c: sorted(fs) for c, fs in cs.items()} for alt, cs in b.items()}
    INST.mkdir(parents=True, exist_ok=True); json.dump(cat, open(cache, 'w'))
    return cat


class Musica:
    def __init__(self, bpm=100, compasso=4, inicio=0.0):
        self.bpm, self.compasso, self.inicio = bpm, compasso, inicio
        self.B = 60 / bpm; self.BAR = self.B * compasso
        tl = json.load(open(ROOT / 'public' / 'timeline.json'))
        self.total, self.blocos = tl['total'], {b['id']: b for b in tl['blocks']}
        self.notas, self.virada = [], None

    # ---- tempo
    def b(self, i): return self.inicio + i * self.B                       # batida i (s)
    def c(self, i): return self.inicio + i * self.BAR                     # compasso i (s)
    def na_batida(self, t, antes=0.0): return self.inicio + round((t - self.inicio) / self.B) * self.B - antes
    def bloco(self, bid): return self.blocos[bid]
    def frase(self, bid, i=0): b = self.blocos[bid]; return b['start'] + b['phrases'][min(i, len(b['phrases']) - 1)][0]

    # ---- notas
    def nota(self, instr, altura, t, dur, vel=.7):
        alt = NOTA(altura) if isinstance(altura, str) else altura
        self.notas.append((instr, alt, float(t), float(dur), float(min(max(vel, 0), 1))))
    def acorde(self, instr, alturas, t, dur, vel=.7):
        for a in alturas: self.nota(instr, a, t, dur, vel)

    # ---- render
    def _midi(self, so_gm=False):
        pm = pretty_midi.PrettyMIDI(initial_tempo=self.bpm); faixas = {}
        def faixa(nome, prog, drum=False):
            if nome not in faixas:
                faixas[nome] = pretty_midi.Instrument(program=prog, is_drum=drum, name=nome); pm.instruments.append(faixas[nome])
            return faixas[nome]
        for instr, alt, t, dur, vel in self.notas:
            v = int(20 + 107 * vel)
            if instr.startswith('gm:'):
                prog = instr[3:]
                f = faixa(instr, 0, True) if prog == 'bateria' else faixa(instr, int(prog))
            elif so_gm:
                continue
            elif instr in PERCUSSAO:
                f = faixa('percussao', 0, True); alt = PERCUSSAO[instr][2]
            else:
                f = faixa(instr, INSTRUMENTOS[instr][5])
            f.notes.append(pretty_midi.Note(v, int(alt), t, t + max(dur, .02)))
        return pm

    def render(self):
        A = ROOT / 'public' / 'audio'; A.mkdir(parents=True, exist_ok=True)
        self._midi().write(str(A / 'musica.mid'))  # partitura completa, editável em qualquer programa de música
        tem_vsco = VSCO.exists()
        if not tem_vsco:
            print('AVISO: VSCO não instalada — tocando tudo em General MIDI (ver README: instrumentos)', file=sys.stderr)
        n = int((self.total + 4) * SR); bus = {k: np.zeros((n, 2), np.float32) for k in SALA}
        if tem_vsco:
            self._vsco(bus, n)
        gm = self if not tem_vsco else self._so('gm:')
        if gm.notas:
            mid = A / '_gm.mid'; wav = A / '_gm.wav'
            (gm._midi() if tem_vsco else self._midi()).write(str(mid))
            subprocess.run(['fluidsynth', '-ni', '-g', '0.8', '-r', str(SR), '-F', str(wav), str(GMSF), str(mid)], check=True, capture_output=True)
            x, _ = sf.read(wav, always_2d=True, dtype='float32'); bus['gm'][:min(n, len(x))] += x[:n]
            mid.unlink(); wav.unlink()
        ir = self._sala(); mix = np.zeros((n, 2), np.float32)
        for k, molhado in SALA.items():
            if not bus[k].any(): continue
            w = np.stack([fftconvolve(bus[k][:, c], ir[:, c])[:n] for c in (0, 1)], 1)
            mix += bus[k] * (1 - molhado) + w * molhado
        mix = mix[:int(self.total * SR)]
        mix = mix / (np.abs(mix).max() + 1e-9) * .89  # só normaliza o pico: a dinâmica (o arco) fica intacta
        sf.write(str(A / 'music_src.wav'), mix, SR, subtype='PCM_16')
        batidas = [round(self.b(i), 3) for i in range(int((self.total - self.inicio) / self.B) + 1)]
        json.dump({'fonte': 'midi', 'bpm': self.bpm, 'batidas': batidas, 'compassos': batidas[::self.compasso],
                   'virada': None if self.virada is None else round(self.virada, 3)}, open(ROOT / 'public' / 'beats.json', 'w'))
        print(f'trilha midi: {len(self.notas)} notas, {self.bpm} bpm, {self.total:.1f} s'
              f'{"" if tem_vsco else " (só General MIDI)"} -> public/audio/music_src.wav + musica.mid')

    def _so(self, prefixo):
        m = object.__new__(Musica); m.__dict__ = dict(self.__dict__); m.notas = [x for x in self.notas if x[0].startswith(prefixo)]; return m

    def _vsco(self, bus, n):
        cat, cache, rr = _catalogo(), {}, {}
        def ler(f):
            if f not in cache:
                a, _ = sf.read(f, always_2d=True, dtype='float32'); cache[f] = a[:, :2] if a.shape[1] > 1 else np.repeat(a, 2, 1)
            return cache[f]
        def roda(lista, chave):
            i = rr.get(chave, 0); rr[chave] = i + 1; return lista[i % len(lista)]
        for instr, alt, t, dur, vel in self.notas:
            if instr.startswith('gm:'): continue
            if instr in PERCUSSAO:
                pad, ganho, _ = PERCUSSAO[instr]; fs = sorted(glob.glob(str(VSCO / pad)))
                if not fs: continue
                a = ler(fs[min(len(fs) - 1, int(vel * len(fs) - 1e-9))] if instr in ('prato', 'gongo', 'bumbo') else roda(fs, instr)).copy()
                if instr == 'prato_cresc' and len(a) > dur * SR: a = a[-int(dur * SR):]  # o crescendo termina no fim da nota
                fam, pan = 'perc', 0.0
            else:
                if instr not in cat: raise SystemExit(f'instrumento desconhecido: {instr} (ver INSTRUMENTOS em scripts/midi_lib.py)')
                pasta, curto, fam, pan, ganho, _ = INSTRUMENTOS[instr]; b = cat[instr]
                perto = min(b, key=lambda m: abs(m - alt)); camadas = sorted(b[perto])
                # curtas: sempre a gravação mais forte (a camada fraca é baixa demais); longas: camada pela intensidade
                cam = camadas[-1] if curto else camadas[min(len(camadas) - 1, int(max(0, vel - .15) / .85 * len(camadas)))]
                a = ler(roda(b[perto][cam], (instr, perto, cam)))
                r = 2 ** ((alt - perto) / 12)
                if abs(r - 1) > 1e-3:
                    idx = np.arange(0, len(a) - 1, r); a = np.stack([np.interp(idx, np.arange(len(a)), a[:, c]) for c in (0, 1)], 1).astype(np.float32)
                a = a.copy() if curto else a[:min(len(a), int((dur + .35) * SR))].copy()
                if not curto:
                    rel = min(len(a), int(.35 * SR)); a[-rel:] *= np.linspace(1, 0, rel)[:, None]
            a[:, 0] *= np.sqrt((1 - pan) / 2) * 1.41; a[:, 1] *= np.sqrt((1 + pan) / 2) * 1.41
            a *= ganho * (.25 + .75 * vel ** 1.3)  # dinâmica: p mais baixo que ff, sem sumir
            s = int(t * SR); e = min(n, s + len(a))
            if e > s: bus[fam][s:e] += a[:e - s]

    @staticmethod
    def _sala(seg=2.6, seed=3):  # resposta de sala sintética, estéreo descorrelacionado
        r = np.random.default_rng(seed); k = int(seg * SR); tt = np.arange(k) / SR
        ir = r.standard_normal((k, 2)).astype(np.float32) * np.exp(-tt / (seg / 6.9))[:, None]
        ir[:int(.012 * SR)] = 0; return ir / np.abs(ir).sum(0).max() * 6


if __name__ == '__main__':  # lista os instrumentos disponíveis e a tessitura de cada um
    cat = _catalogo() if VSCO.exists() else {}
    for k in INSTRUMENTOS:
        if k in cat:
            ns = sorted(cat[k]); print(f'{k:10s} {pretty_midi.note_number_to_name(ns[0]):>4s}–{pretty_midi.note_number_to_name(ns[-1]):<4s} {INSTRUMENTOS[k][0]}')
    print('percussão:', ', '.join(PERCUSSAO), '· General MIDI: gm:<programa 0–127>, gm:bateria')
