#!/usr/bin/env python3
"""Sobe vídeos para a pasta sincronizada do Drive no padrão vvs_<formato>_<palavras>.mp4 e documenta cada um.
Uso: python3 subir.py manifesto.json [--seco | --so-registro]
  --seco: só valida e mostra o que faria · --so-registro: não copia (já está no Drive), grava o registro e o .md
Manifesto: ver SKILL.md.

Nome:  <campanha>/<DUR>/vvs_<palavras>/vvs_<formato>_<palavras>.mp4   + como_foi_feito.md na pasta do vídeo
  formato: vertical (9:16) · square (1:1) · wide (16:9)
  palavras: 1 a 4, tiradas do título, minúsculas, sem acento, sem artigo, preposição, "e" e "que"
            ("A bala na coroa" -> bala_coroa). Título com mais de 4 palavras úteis: escolher em "palavras".
"""
import csv, datetime, json, os, re, shutil, subprocess, sys, unicodedata

FMT = {'vertical': (1080, 1920), 'wide': (1920, 1080), 'square': (1080, 1080)}
SINONIMO = {'horizontal': 'wide', 'quadrado': 'square', '9x16': 'vertical', '16x9': 'wide', '1x1': 'square'}
NOMINAL = {'6S': 6, '10S': 10, '15S': 15, '20S': 20, '30S': 30, '45S': 45, '60S': 60, '90S': 90}
FORA = set(('o a os as um uma uns umas de do da dos das d em no na nos nas num numa nuns numas dum duma duns dumas '
            'por pelo pela pelos pelas para pra pro pras pros com sem sob sobre ao aos ate entre contra '
            'desde apos perante ante tras e que').split())  # comparado já sem acento (à, até, após, trás)
REGISTRO = os.path.expanduser('~/videos/VVS_REGISTRO.csv')
CAMPOS = ['data', 'campanha', 'video', 'arquivo', 'formato', 'duracao_real_s', 'destino', 'drive_link', 'direcao',
          'processo', 'voz', 'trilha', 'projeto', 'origem', 'titulo', 'nome_antigo']  # nome_antigo: se o arquivo foi renomeado


def sem_acento(s):
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))


def palavras_do_titulo(titulo):
    return [w for w in re.findall(r'[a-z0-9]+', sem_acento(titulo).lower()) if w not in FORA]


def probe(p):
    o = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                            'stream=width,height:format=duration', '-of', 'json', p]))
    s = o['streams'][0]
    return s['width'], s['height'], float(o['format']['duration'])


def ler(p):
    try:
        return open(p, encoding='utf-8').read().strip()
    except OSError:
        return ''


def como_foi_feito(v, camp, dur_nom, arquivos):
    """Documento do processo, montado a partir do projeto de origem (roteiro.json, ANALISE.md, RELATORIO.md)."""
    at = v.get('atributos', {}); proj = os.path.expanduser(at.get('projeto', ''))
    L = [f"# {v['titulo']}", '', f"Campanha **{camp}** · duração nominal **{dur_nom}** · entregue em {datetime.date.today():%d/%m/%Y}", '',
         '## Arquivos', '', '| Arquivo | Formato | Dimensão | Duração real |', '|---|---|---|---|']
    L += [f'| `{nome}` | {fmt} | {w}×{h} | {f"{dur:.1f}".replace(".", ",")} s |' for nome, fmt, (w, h), dur in arquivos]
    ficha = [f'| {rot} | {at[k]} |' for k, rot in [('direcao', 'Direção criativa'), ('processo', 'Processo'), ('voz', 'Voz'), ('trilha', 'Trilha')] if at.get(k)]
    try:
        r = json.load(open(os.path.join(proj, 'roteiro.json'), encoding='utf-8')) if proj else {}
    except (OSError, ValueError):
        r = {}
    if r:
        tr = r.get('trilha') or {}
        extra = [('Formatos do projeto', ', '.join(r.get('formatos', []))), ('Estilo', r.get('estilo')),
                 ('Materiais do conceito', ', '.join((r.get('conceito') or {}).get('materiais', []))),
                 ('Voz (roteiro)', r.get('voz')), ('Trilha (fonte)', tr.get('fonte'))]
        ficha += [f'| {k} | {val} |' for k, val in extra if val]
    if ficha:
        L += ['', '## Como foi feito', '', '| | |', '|---|---|'] + ficha
    blocos = [b.get('texto', '').strip() for b in r.get('blocos', []) if b.get('texto', '').strip()]
    if blocos:
        L += ['', '## Roteiro (narração)', ''] + [f'{i}. {t}' for i, t in enumerate(blocos, 1)]
    achou = bool(r)
    for arq, tit in [('ANALISE.md', 'Análise do projeto (brief, conceitos, bíblia, crítica)'), ('RELATORIO.md', 'Relatório de produção')]:
        txt = next((ler(os.path.join(d, arq)) for d in (proj, os.path.dirname(proj.rstrip('/'))) if proj and ler(os.path.join(d, arq))), '')  # também na pasta de cima (projeto por duração)
        if txt:
            achou = True
            L += ['', f'## {tit}', '', re.sub(r'^(#+)', r'##\1', txt, flags=re.M)]  # títulos rebaixados para caber como seção
    if not achou:
        L += ['', '> Projeto de origem não informado ou sem roteiro.json/ANALISE.md: completar o processo à mão.']
    if proj:
        L += ['', f'Projeto de origem: `{at.get("projeto")}`']
    return '\n'.join(L) + '\n'


def main():
    man = json.load(open(sys.argv[1])); seco = '--seco' in sys.argv; so_reg = '--so-registro' in sys.argv
    dest = os.path.expanduser(man['destino_local']); camp = man['campanha'].strip()
    pre = man.get('prefixo', 'vvs').strip().lower()
    erros, avisos, plano, docs, vistos, por_slug = [], [], [], [], set(), {}
    if not os.path.isdir(dest):
        erros.append(f'destino não existe no sync local: {dest}')
    for v in man['videos']:
        tit, d = v['titulo'].strip(), v['duracao'].strip().upper()
        ws = v.get('palavras') or palavras_do_titulo(tit)
        if isinstance(ws, str):
            ws = re.split(r'[\s_]+', ws.strip())
        ws = [sem_acento(w).lower() for w in ws if w]
        if not 1 <= len(ws) <= 4:
            erros.append(f'"{tit}": {len(ws)} palavras úteis ({" ".join(ws)}); escolher de 1 a 4 em "palavras"')
        if any(not re.fullmatch(r'[a-z0-9]+', w) or w in FORA for w in ws):
            erros.append(f'"{tit}": palavras inválidas {ws} (minúsculas, sem acento, sem artigo/preposição/"e"/"que")')
        slug = '_'.join(ws)
        if d not in NOMINAL:
            erros.append(f'"{tit}": duração nominal desconhecida {d} (use 15S, 30S, 60S…)')
        if (d, slug) in vistos:
            erros.append(f'vídeo repetido na campanha: {d}/{pre}_{slug}')
        vistos.add((d, slug)); por_slug.setdefault(slug, set()).add(d)
        pasta = os.path.join(dest, camp, d, f'{pre}_{slug}'); arqs = []
        for fmt, src in v['arquivos'].items():
            fmt = SINONIMO.get(fmt.lower(), fmt.lower()); src = os.path.expanduser(src)
            if fmt not in FMT:
                erros.append(f'"{tit}": formato inválido {fmt} (vertical, square, wide)'); continue
            if not os.path.isfile(src):
                erros.append(f'"{tit}": arquivo não encontrado {src}'); continue
            w, h, dur = probe(src)
            if (w, h) != FMT[fmt]:
                erros.append(f'"{tit}" {fmt}: {w}×{h}, esperado {FMT[fmt][0]}×{FMT[fmt][1]}')
            if d in NOMINAL and abs(dur - NOMINAL[d]) > 1.5:
                erros.append(f'"{tit}" {fmt}: {dur:.1f} s não bate com {d}')
            nome = f'{pre}_{fmt}_{slug}.mp4'
            plano.append((src, os.path.join(pasta, nome), f'{pre}_{slug}', fmt, dur, v.get('atributos', {}), tit))
            arqs.append((nome, fmt, (w, h), dur))
        docs.append((os.path.join(pasta, 'como_foi_feito.md'), v, d, arqs))
    for slug, ds in por_slug.items():
        if len(ds) > 1:
            avisos.append(f'{pre}_{slug} existe em {", ".join(sorted(ds))}: mesmo nome de arquivo em pastas de duração '
                          'diferentes; no gerenciador de anúncios, diferenciar pela duração no nome do anúncio')
    if erros:
        print('NÃO SUBI NADA. Corrigir:'); [print(' -', e) for e in erros]; sys.exit(1)
    for src, alvo, _, fmt, dur, _, _ in plano:
        print(f'{"(seco) " if seco else ""}{os.path.relpath(alvo, dest)}  ← {src}  [{dur:.2f} s]')
    for md, *_ in docs:
        print(f'{"(seco) " if seco else ""}{os.path.relpath(md, dest)}  (processo de criação)')
    for a in avisos:
        print('AVISO:', a)
    if seco:
        return
    if os.path.exists(REGISTRO):  # registro antigo: acrescenta a coluna "titulo" no cabeçalho
        rows = list(csv.reader(open(REGISTRO, newline='')))
        if rows and rows[0] != CAMPOS:
            with open(REGISTRO, 'w', newline='') as f:
                csv.writer(f).writerows([CAMPOS] + [r + [''] * (len(CAMPOS) - len(r)) for r in rows[1:]])
    novo = not os.path.exists(REGISTRO)
    with open(REGISTRO, 'a', newline='') as f:
        w = csv.writer(f)
        if novo:
            w.writerow(CAMPOS)
        for src, alvo, pasta, fmt, dur, at, tit in plano:
            if so_reg:
                if not os.path.isfile(alvo): print('AVISO: não está no destino:', alvo)
            else:
                os.makedirs(os.path.dirname(alvo), exist_ok=True)
                shutil.copy2(src, alvo)
            w.writerow([datetime.date.today().isoformat(), camp, pasta, os.path.basename(alvo), fmt, round(dur, 2),
                        os.path.relpath(alvo, dest), man.get('drive_link', ''), at.get('direcao', ''), at.get('processo', ''),
                        at.get('voz', ''), at.get('trilha', ''), at.get('projeto', ''), src, tit, ''])
    for md, v, d, arqs in docs:
        os.makedirs(os.path.dirname(md), exist_ok=True)
        open(md, 'w', encoding='utf-8').write(como_foi_feito(v, camp, d, arqs))
    print(f'\n{len(plano)} arquivos {"registrados" if so_reg else "copiados para a pasta sincronizada"} + {len(docs)} '
          f'como_foi_feito.md. Registro: {REGISTRO}')
    print('Conferir no Drive em alguns minutos (o sync sobe em segundo plano).')


if __name__ == '__main__':
    main()
