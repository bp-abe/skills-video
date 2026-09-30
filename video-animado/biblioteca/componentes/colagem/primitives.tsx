/**
 * Peças de colagem/papel (origem: um vídeo biográfico anterior, set/2026) + catálogo de fontes que o template carregava por padrão.
 * OPCIONAL: copiar para src/biblioteca/ só se o conceito escolhido pedir papel recortado, carimbo, caneta etc.
 * Não é o ponto de partida de um vídeo novo — o template nasce sem estilo.
 */
import React from 'react';
import {interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadAbril} from '@remotion/google-fonts/AbrilFatface';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadOldStandard} from '@remotion/google-fonts/OldStandardTT';
import {loadFont as loadElite} from '@remotion/google-fonts/SpecialElite';
import {loadFont as loadMarker} from '@remotion/google-fonts/PermanentMarker';
import {loadFont as loadGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadFraunces} from '@remotion/google-fonts/Fraunces';
import {AbsoluteFill} from 'remotion';
import {clamp, step} from '../lib';
import {boil, Edges, land, pop, shadow, tornPolygons} from './movimento';
import {T} from '../tema';

/* Fontes por papel. Estilos (references/estilos.md) usam no máximo 1 display + 1 texto + 1 mão. */
export const FONT = {
	masthead: loadAbril().fontFamily, // colagem/editorial: título de jornal
	headline: loadAnton().fontFamily, // colagem: manchete condensada
	hand: loadCaveat('normal', {weights: ['500', '700']}).fontFamily, // anotação à caneta
	marker: loadMarker().fontFamily, // rabisco: marcador grosso
	serif: loadOldStandard('normal', {weights: ['400', '700']}).fontFamily,
	type: loadElite().fontFamily, // máquina de escrever
	sans: loadGrotesk('normal', {weights: ['500', '700']}).fontFamily, // flat/infográfico
	display: loadFraunces('normal', {weights: ['700', '900']}).fontFamily, // editorial
};

/* Cores vêm de src/tema.ts (definido por vídeo). Fontes acima são um catálogo, não uma escolha. */

/* Texturas geradas SOB DEMANDA por scripts/textures.py <nome> (quadradas 1920, exceto newsprint e cartolinas).
   Nenhuma vem pronta no projeto; textura nova do vídeo = acrescentar em textures.py e neste tipo. */
export type Tex = 'paper_bg' | 'paper_light' | 'paper_white' | 'kraft' | 'newsprint' | 'notebook' | 'card_yellow' | 'card_pink' | 'card_blue' | 'card_green';
const TEX_SIZE: Partial<Record<Tex, string>> = {newsprint: '1600px 1200px', card_yellow: '1200px 1200px', card_pink: '1200px 1200px', card_blue: '1200px 1200px', card_green: '1200px 1200px'};
export const texUrl = (t: Tex) => staticFile(`img/${t}.jpg`);

/** Folha de papel com borda rasgada (fibra clara exposta) ou cortada. */
export const Piece: React.FC<{
	w: number;
	h: number;
	tex?: Tex;
	seed: string;
	edges?: Edges;
	tint?: string;
	amp?: number;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({w, h, tex = 'paper_white', seed, edges = {top: true, right: true, bottom: true, left: true}, tint, amp, style, children}) => {
	const {outer, inner} = React.useMemo(() => tornPolygons(w, h, seed, edges, amp), [w, h, seed, amp, edges]);
	const bx = Math.floor(random(seed + 'bx') * 900);
	const by = Math.floor(random(seed + 'by') * 700);
	return (
		<div style={{position: 'absolute', width: w, height: h, ...style}}>
			<div style={{position: 'absolute', inset: 0, clipPath: outer, background: T.paper}} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					clipPath: inner,
					backgroundImage: `url(${texUrl(tex)})`,
					backgroundSize: TEX_SIZE[tex] ?? '1920px 1920px',
					backgroundPosition: `-${bx}px -${by}px`,
					overflow: 'hidden',
				}}
			>
				{tint ? <div style={{position: 'absolute', inset: 0, background: tint, mixBlendMode: 'multiply'}} /> : null}
				{children}
			</div>
		</div>
	);
};

/** Recorte posicionado que pousa no frame `at`, com sombra que acompanha a altura. */
export const Cut: React.FC<{
	at: number;
	x: number;
	y: number;
	rot?: number;
	from?: {dx?: number; dy?: number; spin?: number; scale?: number};
	out?: {transform: string; lift: number};
	shadowScale?: number;
	children: React.ReactNode;
	z?: number;
}> = ({at, x, y, rot = 0, from = {}, out, shadowScale = 1, children, z}) => {
	const frame = useCurrentFrame();
	const l = land(frame, at, {rot, ...from});
	if (!l.visible) return null;
	const lift = Math.max(l.lift, out?.lift ?? 0);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				zIndex: z,
				transform: `${out?.transform ?? ''} ${l.transform}`,
				filter: shadow(lift, shadowScale),
				transformOrigin: 'center',
			}}
		>
			{children}
		</div>
	);
};

/** Caligrafia a caneta revelada da esquerda para a direita. */
export const Hand: React.FC<{
	at: number;
	dur: number;
	text: string;
	color?: string;
	size?: number;
	rot?: number;
	x: number;
	y: number;
	weight?: number;
	width?: number;
	seed: string;
}> = ({at, dur, text, color = T.accent2, size = 64, rot = 0, x, y, weight = 700, width, seed}) => {
	const frame = useCurrentFrame();
	const f = step(frame) - at;
	if (f < 0) return null;
	const p = clamp(f / dur);
	const b = boil(frame, seed, 0.5);
	return (
		<div
			style={{
				position: 'absolute',
				left: x + b.x,
				top: y + b.y,
				width,
				transform: `rotate(${rot + b.r}deg)`,
				fontFamily: FONT.hand,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1,
				color,
				whiteSpace: width ? 'normal' : 'nowrap',
				clipPath: `inset(-20% ${100 - p * 100}% -20% -5%)`,
				mixBlendMode: 'multiply',
				opacity: 0.92,
				filter: 'url(#ink-rough)',
			}}
		>
			{text}
		</div>
	);
};

/** Traço de caneta/nanquim desenhado ao longo do path. */
export const Stroke: React.FC<{
	at: number;
	dur: number;
	d: string;
	color?: string;
	width?: number;
	seed: string;
	box?: [number, number, number, number];
}> = ({at, dur, d, color = T.accent2, width = 5, seed, box}) => {
	const frame = useCurrentFrame();
	const {width: VW, height: VH} = useVideoConfig();
	box = box ?? [0, 0, VW, VH];
	const f = step(frame) - at;
	if (f < 0) return null;
	const p = clamp(f / dur);
	const b = boil(frame, seed, 0.6);
	return (
		<svg
			width={box[2]}
			height={box[3]}
			style={{position: 'absolute', left: box[0] + b.x, top: box[1] + b.y, overflow: 'visible', mixBlendMode: 'multiply'}}
		>
			<path
				d={d}
				fill="none"
				stroke={color}
				strokeWidth={width}
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - p}
				opacity={0.9}
				filter="url(#ink-rough)"
			/>
		</svg>
	);
};

/** Carimbo: bate (escala 1.5→1 em 3 frames) com tinta falhada. */
export const Stamp: React.FC<{
	at: number;
	x: number;
	y: number;
	rot?: number;
	lines: string[];
	sub?: string;
	color?: string;
	size?: number;
	seed: string;
	w: number;
}> = ({at, x, y, rot = -8, lines, sub, color = T.accent, size = 70, seed, w}) => {
	const frame = useCurrentFrame();
	const f = frame - at;
	if (f < 0) return null;
	const s = interpolate(f, [0, 3], [1.45, 1], {extrapolateRight: 'clamp'});
	const o = interpolate(f, [0, 1, 3], [0, 0.6, 0.9], {extrapolateRight: 'clamp'});
	const lh = size * 1.05;
	const h = lines.length * lh + (sub ? size * 0.55 : 0) + 56;
	return (
		<svg
			width={w}
			height={h}
			style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${s})`, opacity: o, overflow: 'visible'}}
		>
			<g filter={`url(#stamp-erode-${seed})`}>
				<rect x={6} y={6} width={w - 12} height={h - 12} rx={10} fill="none" stroke={color} strokeWidth={7} />
				<rect x={18} y={18} width={w - 36} height={h - 36} rx={5} fill="none" stroke={color} strokeWidth={2.5} />
				{lines.map((t, i) => (
					<text
						key={t}
						x={w / 2}
						y={34 + lh * (i + 0.82)}
						textAnchor="middle"
						fontFamily={FONT.headline}
						fontSize={size}
						letterSpacing={size * 0.06}
						fill={color}
					>
						{t}
					</text>
				))}
				{sub ? (
					<text x={w / 2} y={h - 30} textAnchor="middle" fontFamily={FONT.type} fontSize={size * 0.42} letterSpacing={3} fill={color}>
						{sub}
					</text>
				) : null}
			</g>
			<defs>
				<filter id={`stamp-erode-${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={3} seed={Math.floor(random(seed) * 100)} result="n" />
					<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.9 1.85" result="m" />
					<feComposite in="SourceGraphic" in2="m" operator="in" />
				</filter>
			</defs>
		</svg>
	);
};

/** Datilografado: caracteres aparecem em ritmo de máquina, com tinta irregular. */
export const Typed: React.FC<{
	at: number;
	text: string;
	cps?: number;
	size?: number;
	color?: string;
	style?: React.CSSProperties;
	seed: string;
}> = ({at, text, cps = 22, size = 30, color = T.ink, style, seed}) => {
	const frame = useCurrentFrame();
	const f = frame - at;
	if (f < 0) return null;
	const n = Math.floor((f / 30) * cps);
	return (
		<div style={{fontFamily: FONT.type, fontSize: size, color, whiteSpace: 'pre-wrap', lineHeight: 1.35, ...style}}>
			{text.split('').map((c, i) => (
				<span key={i} style={{opacity: i < n ? 0.72 + random(`${seed}${i}`) * 0.28 : 0, position: 'relative', top: (random(`${seed}t${i}`) - 0.5) * 1.6}}>
					{c}
				</span>
			))}
		</div>
	);
};

/** Palavra que "bate" na tela (tipografia cinética): escala 1.6 → 1 em poucos frames, leve giro. */
export const Slam: React.FC<{at: number; text: string; size?: number; color?: string; font?: string; rot?: number; style?: React.CSSProperties}> = ({
	at,
	text,
	size = 140,
	color = T.ink,
	font = FONT.headline,
	rot = -2,
	style,
}) => {
	const frame = useCurrentFrame();
	const f = frame - at;
	if (f < 0) return null;
	const s = interpolate(f, [0, 4, 7], [1.6, 0.96, 1], {extrapolateRight: 'clamp'});
	const o = interpolate(f, [0, 2], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<div style={{fontFamily: font, fontSize: size, lineHeight: 1, color, transform: `rotate(${rot}deg) scale(${s})`, opacity: o, whiteSpace: 'nowrap', ...style}}>
			{text}
		</div>
	);
};

/** Adesivo/ícone que aparece com pop elástico e borda branca (rabisco, flat). Filho = SVG ou texto. */
export const Sticker: React.FC<{at: number; x: number; y: number; rot?: number; border?: number; children: React.ReactNode; stepped?: boolean}> = ({
	at,
	x,
	y,
	rot = 0,
	border = 10,
	children,
	stepped = true,
}) => {
	const frame = useCurrentFrame();
	const p = pop(frame, at, {stepped});
	if (!p.visible) return null;
	const b = boil(frame, `st${at}${x}`, 0.8);
	const ring = [0, 45, 90, 135, 180, 225, 270, 315]
		.map((a) => `drop-shadow(${(Math.cos((a * Math.PI) / 180) * border) / 2}px ${(Math.sin((a * Math.PI) / 180) * border) / 2}px 0 #fff)`)
		.join(' ');
	return (
		<div style={{position: 'absolute', left: x + b.x, top: y + b.y, transform: `rotate(${rot + b.r}deg) scale(${p.s})`, filter: `${ring} drop-shadow(4px 8px 8px rgba(${T.shadow},.25))`}}>
			{children}
		</div>
	);
};

/** Marca-texto passando sob uma palavra: faixa translúcida que cresce da esquerda. */
export const Highlight: React.FC<{at: number; dur?: number; color?: string; children: React.ReactNode}> = ({at, dur = 8, color = T.highlight, children}) => {
	const frame = useCurrentFrame();
	const p = clamp((step(frame) - at) / dur);
	return (
		<span style={{position: 'relative', display: 'inline-block'}}>
			<span style={{position: 'absolute', left: '-4%', right: `${104 - p * 108}%`, top: '38%', bottom: '2%', background: color, opacity: 0.75, transform: 'skew(-6deg) rotate(-1deg)', borderRadius: 6, mixBlendMode: 'multiply'}} />
			<span style={{position: 'relative'}}>{children}</span>
		</span>
	);
};

/** Acabamento final (fica por cima de tudo): grão animado, vinheta, flicker de luz, fade-in do início. */
export const Finish: React.FC<{grain?: number; vignette?: number; flicker?: boolean}> = ({grain = 0, vignette = 0, flicker = false}) => {
	/* Tudo desligado por padrão: grão, vinheta e flicker são escolha de estilo, não acabamento universal. */
	const frame = useCurrentFrame();
	const s = step(frame);
	return (
		<>
			{grain ? <AbsoluteFill
				style={{
					zIndex: 50,
					backgroundImage: `url(${staticFile('img/grain.png')})`,
					backgroundSize: '960px 960px',
					backgroundPosition: `${Math.floor(random(`gx${s}`) * 960)}px ${Math.floor(random(`gy${s}`) * 960)}px`,
					mixBlendMode: 'overlay',
					opacity: grain,
					pointerEvents: 'none',
				}}
			/> : null}
			{vignette ? <AbsoluteFill style={{zIndex: 51, background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(${T.shadow},${vignette}) 100%)`}} /> : null}
			{flicker ? <AbsoluteFill style={{zIndex: 52, background: `rgba(${T.shadow},${0.012 + random(`fl${s}`) * 0.025})`}} /> : null}
			<AbsoluteFill style={{zIndex: 53, background: T.fadeIn, opacity: interpolate(frame, [0, 8], [1, 0], {extrapolateRight: 'clamp'})}} />
		</>
	);
};

/** Filtros SVG globais (traço de nanquim levemente irregular). */
export const GlobalDefs: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={0} height={0} style={{position: 'absolute'}}>
			<defs>
				<filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
					<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={Math.floor(step(frame, 4) / 4) % 7} result="t" />
					<feDisplacementMap in="SourceGraphic" in2="t" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</defs>
		</svg>
	);
};

/** Trecho de coluna de jornal (texto real pequeno, sem conteúdo inventado relevante). */
export const Columns: React.FC<{cols?: number; lines?: number; seed: string; size?: number; style?: React.CSSProperties}> = ({
	cols = 3,
	lines = 14,
	seed,
	size = 15,
	style,
}) => (
	<div style={{display: 'flex', gap: 18, ...style}}>
		{Array.from({length: cols}).map((_, c) => (
			<div key={c} style={{flex: 1, borderLeft: c ? `1px solid ${T.ink}55` : undefined, paddingLeft: c ? 14 : 0}}>
				{Array.from({length: lines}).map((__, i) => {
					const w = i % 6 === 5 ? 40 + random(`${seed}${c}${i}`) * 40 : 100;
					return <div key={i} style={{height: size * 0.5, margin: `${size * 0.42}px 0`, width: `${w}%`, background: T.ink, opacity: 0.16 + random(`${seed}o${c}${i}`) * 0.1, borderRadius: 1}} />;
				})}
			</div>
		))}
	</div>
);
