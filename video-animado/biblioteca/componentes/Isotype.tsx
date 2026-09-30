/**
 * Pictogramas ISOTYPE (origem: destro-canhoto, 25/09/2026). Flat, sem traço, cores por prop.
 * - Figure: pessoa 100×200 vista de costas, braços lUp/rUp 0..1 (160° erguido), caneta opcional, respiração.
 * - Hand: mão grande pelo dorso (side 'l'|'r', wave).  - Wire: fio desenhado ao longo de um path com pulso viajando.
 */
import React from 'react';
import {getLength, getPointAtLength} from '@remotion/paths';
import {clamp} from '../lib';
import {T} from '../tema';

/* ---------------- figura humana ---------------- */
/**
 * Pessoa em caixa 100×200. `lUp`/`rUp` 0..1 levantam o braço esquerdo/direito (0 = caído, 1 = erguido).
 * `pen` desenha a caneta na mão erguida ('l' | 'r').
 */
export const Figure: React.FC<{
	color: string;
	h?: number;
	lUp?: number;
	rUp?: number;
	pen?: 'l' | 'r';
	breath?: number; // frame para respiração ambiente
	seed?: number;
	style?: React.CSSProperties;
}> = ({color, h = 200, lUp = 0, rUp = 0, pen, breath = 0, seed = 0, style}) => {
	const b = Math.sin((breath + seed * 17) / 22) * 0.8;
	const arm = (side: -1 | 1, up: number) => {
		const sx = 50 + side * 36; // ombro
		const sy = 52;
		const ang = -side * (10 + up * 150); // graus: 10° caído → 160° erguido (quase vertical, para fora: não encosta na vizinha)
		return (
			<g transform={`rotate(${ang} ${sx} ${sy})`}>
				<rect x={sx - 8} y={sy - 4} width={16} height={74} rx={8} fill={color} />
				{pen && ((pen === 'l' && side === -1) || (pen === 'r' && side === 1)) ? (
					<g transform={`translate(${sx} ${sy + 72}) rotate(${-side * 20})`}>
						<rect x={-4} y={-6} width={8} height={40} rx={2} fill={T.ink} />
						<path d="M -4 34 L 4 34 L 0 44 Z" fill={T.ink} />
					</g>
				) : null}
			</g>
		);
	};
	return (
		<svg width={(h / 200) * 100} height={h} viewBox="-10 -20 120 225" style={{overflow: 'visible', ...style}}>
			<g transform={`translate(0 ${b})`}>
				{arm(-1, lUp)}
				{arm(1, rUp)}
				<circle cx={50} cy={20} r={18} fill={color} />
				<path d="M 22 44 Q 17 44 17 50 L 26 118 L 74 118 L 83 50 Q 83 44 78 44 Z" fill={color} />
			</g>
			<rect x={28} y={114} width={20} height={84} rx={9} fill={color} />
			<rect x={52} y={114} width={20} height={84} rx={9} fill={color} />
		</svg>
	);
};

/* ---------------- mão grande (dorso, dedos para cima) ---------------- */
/** Mão direita vista pelo dorso: polegar à esquerda. `side='l'` espelha. Caixa 220×300. */
export const Hand: React.FC<{color: string; side: 'l' | 'r'; w?: number; wave?: number; style?: React.CSSProperties}> = ({color, side, w = 220, wave = 0, style}) => (
	<svg width={w} height={(w / 220) * 300} viewBox="0 0 220 300" style={{overflow: 'visible', transform: side === 'l' ? 'scaleX(-1)' : undefined, ...style}}>
		<g transform={`rotate(${wave * 8} 110 280)`}>
			<rect x={78} y={236} width={82} height={80} rx={10} fill={T.ink} />
			<rect x={62} y={120} width={118} height={132} rx={40} fill={color} />
			{[
				[66, 46, 27],
				[97, 26, 28],
				[128, 38, 27],
				[157, 66, 24],
			].map(([x, y, fw], i) => (
				<rect key={i} x={x} y={y} width={fw} height={140 - y + 10} rx={fw / 2} fill={color} />
			))}
			<path d="M 86 214 L 34 150" stroke={color} strokeWidth={30} strokeLinecap="round" />
		</g>
	</svg>
);

/* ---------------- fio com pulso ---------------- */
/** Traço desenhado ao longo de `d` (0..1 = draw) e um ponto que percorre de 0..1 (`dot`, -1 = sem ponto). */
export const Wire: React.FC<{d: string; draw: number; dot?: number; color?: string; dotColor?: string; width?: number; box: [number, number]}> = ({
	d,
	draw,
	dot = -1,
	color = T.ink,
	dotColor = T.ink,
	width = 12,
	box,
}) => {
	const len = React.useMemo(() => getLength(d), [d]);
	const pt = dot >= 0 && dot <= 1 ? getPointAtLength(d, len * dot) : null;
	return (
		<svg width={box[0]} height={box[1]} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - clamp(draw))} />
			{pt ? (
				<>
					<circle cx={pt.x} cy={pt.y} r={width * 2.4} fill={dotColor} opacity={0.25} />
					<circle cx={pt.x} cy={pt.y} r={width * 1.3} fill={dotColor} />
				</>
			) : null}
		</svg>
	);
};
