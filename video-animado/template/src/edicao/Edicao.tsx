/**
 * Modo edição: monta o vídeo gravado a partir de public/edit/edl.json (gerado pelo scripts/edicao/cortar.py).
 * Camadas (de baixo para cima): vídeo cortado + câmera (zoom com curva de velocidade, enquadramento 9:16)
 * → focos (máscara + seta, no espaço do vídeo) → congelamentos → textos → legenda palavra a palavra → som.
 * Estilo (cores, fontes) vem do src/tema.ts, como no resto do template.
 */
import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import EDL from '../../public/edit/edl.json';
import {FONTES, T} from '../tema';
import {sfxVar, Soundtrack} from '../stage';

type Seg = {tipo: 'trecho' | 'congela'; in?: number; out?: number; src?: number; at: number; dur: number; texto?: string};
type Zoom = {at: number; dur: number; x: number; y: number; escala: number; entrada?: number; saida?: number};
type Foco = {at: number; dur: number; x: number; y: number; w: number; h: number; seta?: 'auto' | 'esquerda' | 'direita' | 'cima' | 'baixo' | false};  // seta = para onde ela APONTA
type Texto = {at: number; dur: number; texto: string; x?: number; y?: number; tamanho?: number};
type Pal = {w: string; at: number; end: number};
const E = EDL as unknown as {
	video: string; fps: number; total: number; src: {w: number; h: number}; segs: Seg[]; palavras: Pal[];
	enquadramento: {x: number; y: number}; zooms: Zoom[]; focos: Foco[]; textos: Texto[];
	sfx: {at: number; familia: string; v?: number}[]; legendas: {ativo: boolean; palavras_por_grupo: number; pos_y: number; cor?: string; antecipa?: number}; volume_voz: number;
};
export const EDIT_TOTAL = Math.max(1, Math.round((E.total || 1) * (E.fps || 30)));
const F = (s: number) => Math.round(s * (E.fps || 30));
const ease = Easing.bezier(0.7, 0, 0.3, 1); // entra e sai devagar, acelera no meio: curva de editor

/** Peso 0..1 de um evento com entrada/saída suaves. */
const peso = (t: number, at: number, dur: number, ent = 0.35, sai = 0.35) => {
	if (t < at || t > at + dur) return 0;
	if (t < at + ent) return ease((t - at) / ent);
	if (t > at + dur - sai) return ease((at + dur - t) / sai);
	return 1;
};

/** Câmera: cobre o quadro (16:9 → 9:16 recorta), zoom e foco guiados pelos zooms do edl. */
const useCamera = () => {
	const frame = useCurrentFrame();
	const {width: W, height: H} = useVideoConfig();
	const t = frame / (E.fps || 30);
	const k = Math.max(W / E.src.w, H / E.src.h);
	const iw = E.src.w * k, ih = E.src.h * k;
	let s = 1, cx = E.enquadramento.x, cy = E.enquadramento.y;
	let best = 0;
	for (const z of E.zooms) {
		const p = peso(t, z.at, z.dur, z.entrada, z.saida);
		if (p > best) {
			best = p;
			s = 1 + (z.escala - 1) * p;
			cx = E.enquadramento.x + (z.x - E.enquadramento.x) * p;
			cy = E.enquadramento.y + (z.y - E.enquadramento.y) * p;
		}
	}
	// não deixar borda preta aparecer
	const hx = W / (2 * s * iw), hy = H / (2 * s * ih);
	cx = Math.min(1 - hx, Math.max(hx, cx));
	cy = Math.min(1 - hy, Math.max(hy, cy));
	return {W, H, iw, ih, transform: `translate(${W / 2}px, ${H / 2}px) scale(${s}) translate(${-cx * iw}px, ${-cy * ih}px)`};
};

const Seta: React.FC<{x: number; y: number; dir: string; p: number}> = ({x, y, dir, p}) => {
	const L = 150;
	const rot = {direita: 0, esquerda: 180, baixo: 90, cima: -90}[dir] ?? 0; // desenho base aponta para a direita e termina na origem
	return (
		<svg style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `rotate(${rot}deg)`, transformOrigin: '0 0'}} width={1} height={1}>
			<path d={`M ${-L - 20} 0 L -20 0 M -48 -26 L -20 0 L -48 26`} fill="none" stroke={T.accent} strokeWidth={12} strokeLinecap="round"
				strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))'}} />
		</svg>
	);
};

/** Foco: escurece o resto e desenha a seta até o alvo (coordenadas normalizadas do vídeo original). */
const Focos: React.FC<{iw: number; ih: number}> = ({iw, ih}) => {
	const t = useCurrentFrame() / (E.fps || 30);
	return (
		<>
			{E.focos.map((f, i) => {
				const p = peso(t, f.at, f.dur, 0.25, 0.3);
				if (!p) return null;
				const x = (f.x - f.w / 2) * iw, y = (f.y - f.h / 2) * ih, w = f.w * iw, h = f.h * ih;
				// 'auto': a seta vem do lado do centro da tela (nunca fica fora do quadro no recorte 9:16)
				const dir = f.seta === undefined || f.seta === 'auto' ? (f.x > E.enquadramento.x ? 'direita' : 'esquerda') : f.seta;
				const ax = {esquerda: x + w + 10, direita: x - 10, cima: x + w / 2, baixo: x + w / 2}[dir || 'direita'] ?? x;
				const ay = {esquerda: y + h / 2, direita: y + h / 2, cima: y + h + 10, baixo: y - 10}[dir || 'direita'] ?? y;
				return (
					<React.Fragment key={i}>
						<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 18,
							boxShadow: `0 0 0 ${Math.max(iw, ih) * 2}px rgba(0,0,0,${0.62 * p}), 0 0 0 4px rgba(255,255,255,${0.5 * p})`}} />
						{dir ? <Seta x={ax} y={ay} dir={dir} p={p} /> : null}
					</React.Fragment>
				);
			})}
		</>
	);
};

const Camada: React.FC = () => {
	const cam = useCamera();
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: cam.iw, height: cam.ih, transformOrigin: '0 0', transform: cam.transform}}>
				{E.segs.map((s, i) => {
					const from = F(s.at), dur = Math.max(1, F(s.dur));
					if (frame < from - 2 || frame > from + dur + 2) return null;
					if (s.tipo === 'trecho') {
						return (
							<Sequence key={i} from={from} durationInFrames={dur} layout="none">
								<OffthreadVideo src={staticFile(E.video)} trimBefore={F(s.in!)} trimAfter={F(s.out!)} volume={E.volume_voz}
									style={{width: cam.iw, height: cam.ih}} />
							</Sequence>
						);
					}
					// congelamento: quadro parado, P&B, encolhe dentro de moldura; o texto vem na camada de cima
					const p = interpolate(frame - from, [0, 6], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
					return (
						<Sequence key={i} from={from} durationInFrames={dur} layout="none">
							<div style={{width: cam.iw, height: cam.ih, transform: `scale(${1 - 0.22 * p})`, filter: `grayscale(${p}) contrast(${1 + 0.15 * p})`,
								boxShadow: `0 0 0 ${3 * p}px #fff`}}>
								<Freeze frame={F(s.src!)}>
									<OffthreadVideo src={staticFile(E.video)} muted style={{width: cam.iw, height: cam.ih}} />
								</Freeze>
							</div>
						</Sequence>
					);
				})}
				<Focos iw={cam.iw} ih={cam.ih} />
			</div>
		</AbsoluteFill>
	);
};

const Textos: React.FC = () => {
	const {width: W, height: H} = useVideoConfig();
	const t = useCurrentFrame() / (E.fps || 30);
	const all: Texto[] = [...E.textos, ...E.segs.filter((s) => s.tipo === 'congela' && s.texto).map((s) => ({at: s.at + 0.15, dur: s.dur - 0.2, texto: s.texto!, y: 0.84}))];
	return (
		<>
			{all.map((x, i) => {
				const p = peso(t, x.at, x.dur, 0.18, 0.25);
				if (!p) return null;
				const pop = 0.7 + 0.3 * Easing.out(Easing.back(2))(Math.min(1, (t - x.at) / 0.25));
				return (
					<div key={i} style={{position: 'absolute', left: (x.x ?? 0.5) * W, top: (x.y ?? 0.3) * H, transform: `translate(-50%, -50%) scale(${pop})`,
						opacity: p, fontFamily: FONTES.titulo, fontWeight: 900, fontSize: (x.tamanho ?? 0.11) * Math.min(W, H) * 1.6, color: T.highlight,
						textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 0.95,
						textShadow: `0 0 28px ${T.accent}, 0 6px 0 rgba(0,0,0,.55)`, WebkitTextStroke: `3px rgba(0,0,0,.35)`}}>
						{x.texto}
					</div>
				);
			})}
		</>
	);
};

/** Legenda palavra a palavra: grupos de até N palavras. A palavra ACENDE quando começa a ser falada (antecipada
 *  `antecipa` s, padrão 0,1 — o tempo do Whisper chega um pouco atrasado e o olho percebe atraso) e fica acesa até a
 *  próxima começar (não pisca entre palavras). Já faladas ficam claras; as que vêm, apagadas. */
const Legenda: React.FC = () => {
	const {width: W, height: H} = useVideoConfig();
	const t = useCurrentFrame() / (E.fps || 30);
	if (!E.legendas.ativo || !E.palavras.length) return null;
	const N = E.legendas.palavras_por_grupo;
	const lead = E.legendas.antecipa ?? 0.1;
	const P = E.palavras;
	const grupos: number[][] = [];
	let cur: number[] = [];
	P.forEach((p, i) => {
		const prev = cur.length ? P[cur[cur.length - 1]] : null;
		if (prev && (cur.length >= N || p.at - prev.end > 0.35 || /[.!?,;:…]$/.test(prev.w))) { grupos.push(cur); cur = []; }
		cur.push(i);
	});
	if (cur.length) grupos.push(cur);
	const ini = (i: number) => P[i].at - lead;
	// palavra ativa: a última que já começou; some se houver pausa longa depois dela
	let ativa = -1;
	for (let i = 0; i < P.length && ini(i) <= t; i++) ativa = i;
	if (ativa < 0 || t > P[ativa].end + 0.6) return null;
	const g = grupos.find((x) => x.includes(ativa));
	if (!g) return null;
	const size = Math.min(W, H) * 0.075;
	const cor = E.legendas.cor ?? T.accent;
	return (
		<div style={{position: 'absolute', left: W * 0.06, right: W * 0.06, top: E.legendas.pos_y * H, textAlign: 'center',
			fontFamily: FONTES.titulo, fontWeight: 800, fontSize: size, lineHeight: 1.1, textTransform: 'uppercase'}}>
			{g.map((i) => {
				const on = i === ativa, dita = i < ativa;
				const pop = on ? 1.12 - 0.12 * Math.min(1, (t - ini(i)) / 0.12) : 1; // entra um pouco maior e assenta
				return (
					<span key={i} style={{display: 'inline-block', margin: `0 ${size * 0.14}px`, transform: `scale(${on ? Math.max(1.06, pop) : 1})`,
						color: on ? cor : '#fff', opacity: on ? 1 : dita ? 0.85 : 0.4,
						paintOrder: 'stroke', WebkitTextStroke: `${size * 0.12}px #000`, textShadow: '0 4px 10px rgba(0,0,0,.6)'}}>
						{P[i].w.replace(/[.,;:]$/, '')}
					</span>
				);
			})}
		</div>
	);
};

const SFX = E.sfx.map((s) => sfxVar(F(s.at), s.familia, s.v ?? 0.4));

export const Edicao: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: T.bg}}>
		<Camada />
		<Textos />
		<Legenda />
		<Soundtrack sfx={SFX} narracao={false} />
	</AbsoluteFill>
);
