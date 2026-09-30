import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, F, TL, TOTAL, useFmt} from './lib';
import {T} from './tema';
import SFX_INDEX from '../public/audio/sfx/index.json';
import PICOS from '../public/audio/sfx/picos.json';

/** Textura gerada por scripts/textures.py (public/img/<nome>.jpg). */
export type Tex = string;
export const texUrl = (t: Tex) => staticFile(`img/${t}.jpg`);

/* ---------- transições ---------- */
export const TDUR = 16;
/** Transição escrita pelo vídeo: recebe a cena que sai e o progresso (p 0→1, f = frames desde o início). */
export type TransFn = (a: {children: React.ReactNode; p: number; f: number; W: number; H: number; vertical: boolean; seed: string}) => React.ReactNode;
/** Núcleo neutro: corte seco, varredura, zoom — ou uma função própria do conceito (o normal é escrever a sua). */
export type Trans = 'corte' | 'wipe' | 'zoom' | TransFn;

const Outgoing: React.FC<{type: Trans; at: number; dur: number; seed: string; children: React.ReactNode}> = ({type, at, dur, seed, children}) => {
	const frame = useCurrentFrame();
	const {W, H, vertical} = useFmt();
	const f = frame - at;
	if (f < 0) return <AbsoluteFill>{children}</AbsoluteFill>;
	if (type === 'corte') return null;
	const p = Easing.inOut(Easing.cubic)(clamp(f / dur));
	if (typeof type === 'function') return <>{type({children, p, f, W, H, vertical, seed})}</>;
	if (type === 'wipe') return <AbsoluteFill style={{clipPath: `inset(0 0 0 ${p * 100}%)`}}>{children}</AbsoluteFill>;
	return <AbsoluteFill style={{transform: `scale(${1 + p * 0.6})`, opacity: 1 - p}}>{children}</AbsoluteFill>;
};

export type Scene = {el: (from: number, to: number) => React.ReactNode; out?: Trans; outDur?: number; next?: number};

/** Empilha as cenas; cada uma vive de `from` (fim da anterior) até `next` + a duração da transição de saída. */
export const SceneStack: React.FC<{scenes: Scene[]}> = ({scenes}) => {
	const frame = useCurrentFrame();
	return (
		<>
			{scenes.map((sc, i) => {
				const from = i === 0 ? 0 : scenes[i - 1].next!;
				const to = sc.next ?? TOTAL;
				// sem `out` (ou 'corte'): corte seco em `to`; com transição, a cena sobrevive `dur` quadros por baixo da próxima
				const dur = sc.out && sc.out !== 'corte' ? sc.outDur ?? TDUR : 0;
				if (frame < from - 1 || (dur ? frame > to + dur + 1 : frame >= to)) return null;
				return (
					<AbsoluteFill key={i} style={{zIndex: 20 - i}}>
						{sc.out ? <Outgoing type={sc.out} at={to} dur={dur} seed={`t${i}`}>{sc.el(from, to)}</Outgoing> : sc.el(from, to)}
					</AbsoluteFill>
				);
			})}
		</>
	);
};

/** Fundo de cena: textura + push-in lento de câmera + tremor opcional (carimbo, impacto). */
export const Sheet: React.FC<{tex?: Tex; color?: string; tint?: string; from: number; to: number; shakes?: number[]; push?: number; children: React.ReactNode}> = ({
	tex,
	color = T.surface,
	tint,
	from,
	to,
	shakes = [],
	push = 0.035,
	children,
}) => {
	const frame = useCurrentFrame();
	const p = clamp((frame - from) / Math.max(1, to - from));
	let sx = 0, sy = 0;
	for (const at of shakes) {
		const f = frame - at;
		if (f >= 0 && f < 7) {
			sx += (random(`sx${at}${f}`) - 0.5) * (7 - f) * 2.2;
			sy += (random(`sy${at}${f}`) - 0.5) * (7 - f) * 2.2;
		}
	}
	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: color}}>
			<AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + push * p})`, transformOrigin: '52% 46%'}}>
				{tex ? <AbsoluteFill style={{backgroundImage: `url(${texUrl(tex)})`, backgroundSize: 'cover', backgroundPosition: 'center'}} /> : null}
				{tint ? <AbsoluteFill style={{background: tint, mixBlendMode: 'multiply'}} /> : null}
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ---------- som ---------- */
const FAM = SFX_INDEX as Record<string, string[]>;
const FPS_SFX = TL.fps || 30;

export type Sfx = {at: number; src: string; v: number; rate: number; dur?: number}; // dur em s (padrão 1,6)
const state: Record<string, {n: number; last: number}> = {};

/**
 * Efeito por FAMÍLIA (catálogo em biblioteca/sfx/INDEX.md, ou 'synth/<nome>'): a cada toque escolhe uma variação
 * diferente da anterior e varia altura (±pitch) e volume (±12%), de forma determinística. Nada soa repetido.
 */
export const sfxVar = (at: number, family: string, v = 0.4, o: {pitch?: number; fixed?: number; dur?: number} = {}): Sfx => {
	const files = FAM[family];
	if (!files?.length) throw new Error(`família de efeito inexistente: ${family} (ver public/audio/sfx/index.json)`);
	const st = (state[family] ??= {n: 0, last: -1});
	let i = o.fixed ?? Math.floor(random(`${family}#${st.n}`) * files.length);
	if (o.fixed === undefined && files.length > 1 && i === st.last) i = (i + 1) % files.length;
	st.last = i;
	const pitch = o.pitch ?? 0.06;
	const rate = 1 + (random(`${family}@${st.n}`) - 0.5) * 2 * pitch;
	const gain = v * (0.88 + random(`${family}$${st.n}`) * 0.24);
	st.n++;
	// o PICO do som cai no frame da ação (não o início do arquivo); pico em s, corrigido pela velocidade
	const pico = Math.round((((PICOS as Record<string, number>)[files[i]] ?? 0) / rate) * FPS_SFX);
	return {at: at - pico, src: files[i], v: gain, rate, dur: o.dur};
};
/** Atalhos para os sintetizados (5 variações cada, gerados por vídeo). */
export const sfx = (at: number, name: string, v = 0.4): Sfx => sfxVar(at, `synth/${name}`, v);

/** 0..1: quanto a narração está ativa no frame (para ducking da trilha). */
const speech = (f: number) =>
	Math.max(
		0,
		...TL.blocks.map((b) =>
			interpolate(f, [F(b.start) - 10, F(b.start), F(b.start + b.dur), F(b.start + b.dur) + 12], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		),
	);

/** Narração (um <Audio> por bloco, no início medido) + trilha com ducking + efeitos. */
export const Soundtrack: React.FC<{sfx: Sfx[]; music?: number; duck?: number; narracao?: boolean}> = ({sfx: list, music = 0.24, duck = 0.13, narracao = true}) => (
	<>
		{narracao && TL.blocks.map((b) => (
			<Sequence key={b.id} from={F(b.start)}>
				<Audio src={staticFile(`audio/${b.id}.wav`)} />
			</Sequence>
		))}
		{music > 0 ? <Audio src={staticFile('audio/music.wav')} volume={(f) => music - duck * speech(f)} /> : null}
		{list.map((x, i) => (
			<Sequence key={i} from={Math.max(0, x.at)} durationInFrames={F(x.dur ?? 1.6)}>
				<Audio src={staticFile(x.src)} volume={x.v} playbackRate={x.rate} />
			</Sequence>
		))}
	</>
);
