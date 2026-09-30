#!/usr/bin/env python3
"""Sobe vídeos para a pasta sincronizada do Drive no padrão <PREFIXO>_<TITULO>_<DUR>_<FORMATO> (prefixo padrão VVS).
Uso: python3 subir.py manifesto.json [--seco | --so-registro]
  --seco: só valida e mostra o que faria · --so-registro: não copia (já está no Drive), só grava o registro
Manifesto: ver SKILL.md."""
import csv, json, os, re, shutil, subprocess, sys, datetime

DIM = {'VERTICAL': (1080, 1920), 'WIDE': (1920, 1080), 'SQUARE': (1080, 1080)}
NOMINAL = {'15S': 15, '30S': 30, '60S': 60, '6S': 6, '10S': 10, '20S': 20, '45S': 45, '90S': 90}
REGISTRO = os.path.expanduser('~/videos/VVS_REGISTRO.csv')


def probe(p):
    o = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                            'stream=width,height:format=duration', '-of', 'json', p]))
    s = o['streams'][0]
    return s['width'], s['height'], float(o['format']['duration'])


def main():
    man = json.load(open(sys.argv[1])); seco = '--seco' in sys.argv; so_reg = '--so-registro' in sys.argv
    dest = os.path.expanduser(man['destino_local']); camp = man['campanha'].strip()
    pre = man.get('prefixo', 'VVS').strip().upper()  # prefixo do nome (padrão VVS)
    erros, plano, vistos = [], [], set()
    if not os.path.isdir(dest):
        erros.append(f'destino não existe no sync local: {dest}')
    for v in man['videos']:
        t, d = v['titulo'].strip().upper(), v['duracao'].strip().upper()
        if not re.fullmatch(r'[A-Z0-9]+(_[A-Z0-9]+){2}', t):
            erros.append(f'título fora do padrão (3 palavras, CAIXA ALTA, sem acento, "_"): {t}')
        if d not in NOMINAL:
            erros.append(f'duração nominal desconhecida: {d} (use 15S, 30S, 60S…)')
        nome = f'{pre}_{t}_{d}'
        if nome in vistos:
            erros.append(f'vídeo repetido na campanha: {nome}')
        vistos.add(nome)
        for fmt, src in v['arquivos'].items():
            src = os.path.expanduser(src)
            if fmt not in DIM:
                erros.append(f'{nome}: formato inválido {fmt}'); continue
            if not os.path.isfile(src):
                erros.append(f'{nome}: arquivo não encontrado {src}'); continue
            w, h, dur = probe(src)
            if (w, h) != DIM[fmt]:
                erros.append(f'{nome} {fmt}: {w}×{h}, esperado {DIM[fmt][0]}×{DIM[fmt][1]}')
            if d in NOMINAL and abs(dur - NOMINAL[d]) > 1.5:
                erros.append(f'{nome} {fmt}: {dur:.1f} s não bate com {d}')
            alvo = os.path.join(dest, camp, d, nome, f'{nome}_{fmt}.mp4')
            plano.append((src, alvo, nome, fmt, dur, v.get('atributos', {})))
    if erros:
        print('NÃO SUBI NADA. Corrigir:'); [print(' -', e) for e in erros]; sys.exit(1)
    for src, alvo, nome, fmt, dur, _ in plano:
        print(f'{"(seco) " if seco else ""}{os.path.relpath(alvo, dest)}  ← {src}  [{dur:.2f} s]')
    if seco:
        return
    novo = not os.path.exists(REGISTRO)
    with open(REGISTRO, 'a', newline='') as f:
        w = csv.writer(f)
        if novo:
            w.writerow(['data', 'campanha', 'video', 'arquivo', 'formato', 'duracao_real_s', 'destino', 'drive_link',
                        'direcao', 'processo', 'voz', 'trilha', 'projeto', 'origem'])
        for src, alvo, nome, fmt, dur, at in plano:
            if so_reg:
                if not os.path.isfile(alvo): print('AVISO: não está no destino:', alvo)
            else:
                os.makedirs(os.path.dirname(alvo), exist_ok=True)
                shutil.copy2(src, alvo)
            w.writerow([datetime.date.today().isoformat(), camp, nome, os.path.basename(alvo), fmt, round(dur, 2),
                        os.path.relpath(alvo, dest), man.get('drive_link', ''), at.get('direcao', ''),
                        at.get('processo', ''), at.get('voz', ''), at.get('trilha', ''), at.get('projeto', ''), src])
    print(f'\n{len(plano)} arquivos {"registrados" if so_reg else "copiados para a pasta sincronizada"}. Registro: {REGISTRO}')
    print('Conferir no Drive em alguns minutos (o sync sobe em segundo plano).')


if __name__ == '__main__':
    main()
