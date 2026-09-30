/**
 * Transições de papel/colagem (origem: um vídeo biográfico anterior e "Destro ou canhoto"). OPCIONAIS: copiar para src/biblioteca/
 * com movimento.ts se o conceito pedir. Uso: {out: rasgo} num Scene do SceneStack (são TransFn).
 */
import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {clamp} from '../lib';
import {T} from '../tema';
import {tearLine} from './movimento';
import type {TransFn} from '../stage';

export const virada: TransFn = ({children, p, W}) => (
	<AbsoluteFill style={{transformOrigin: 'left center', transform: `perspective(${W * 1.25}px) rotateY(${-p * 100}deg)`, filter: `drop-shadow(${30 * p}px 0 ${40 * p}px rgba(${T.shadow},${0.5 * p}))`}}>
		{children}
		<AbsoluteFill style={{background: `rgba(${T.shadow},${p * 0.55})`}} />
	</AbsoluteFill>
);

export const puxada: TransFn = ({children, p, W}) => (
	<AbsoluteFill style={{transform: `translate(${-p * W * 1.2}px, ${-p * 260}px) rotate(${-p * 11}deg)`, filter: `drop-shadow(20px 30px 30px rgba(${T.shadow},${0.55 * clamp(p * 4)}))`}}>
		{children}
	</AbsoluteFill>
);

/** Painel split-flap: lâminas horizontais virando em cascata. */
export const laminas: TransFn = ({children, f, W, H, vertical}) => {
	const n = vertical ? 14 : 9, hh = H / n;
	return (
		<>
			{Array.from({length: n}).map((_, k) => {
				const q = Easing.in(Easing.quad)(clamp((f - k * 1.1) / 12));
				if (q >= 1) return null;
				return (
					<AbsoluteFill key={k} style={{clipPath: `inset(${k * hh}px 0 ${H - (k + 1) * hh - 0.5}px 0)`}}>
						<AbsoluteFill style={{transformOrigin: `50% ${(k + 1) * hh}px`, transform: `perspective(${W * 2}px) rotateX(${-q * 90}deg)`}}>
							{children}
							<AbsoluteFill style={{background: `rgba(${T.shadow},${q * 0.5})`}} />
						</AbsoluteFill>
					</AbsoluteFill>
				);
			})}
		</>
	);
};

/** Rasgo ao meio (vertical na paisagem, horizontal no retrato). */
export const rasgo: TransFn = ({children, p, W, H, vertical, seed}) => {
	const L = vertical ? W : H;
	const pts = tearLine(seed, (vertical ? H : W) / 2, L).map(([a, b]) => (vertical ? [b, a] : [a, b]) as [number, number]);
	const poly = (off: number, side: 1 | -1) => {
		const line = pts.map(([x, y]) => (vertical ? `${x}px ${y + off}px` : `${x + off}px ${y}px`)).join(',');
		if (vertical) return side < 0 ? `polygon(-60px -60px, ${line}, ${W + 60}px -60px)` : `polygon(${line}, ${W + 60}px ${H + 60}px, -60px ${H + 60}px)`;
		return side < 0 ? `polygon(-60px -60px, ${line}, -60px ${H + 60}px)` : `polygon(${line}, ${W + 60}px ${H + 60}px, ${W + 60}px -60px)`;
	};
	const sh = `drop-shadow(0 20px 30px rgba(${T.shadow},${0.5 * clamp(p * 5)}))`;
	const move = (side: 1 | -1) => vertical
		? `translate(${side * p * 70}px, ${side * p * H * 0.6}px) rotate(${side * p * 7}deg)`
		: `translate(${side * p * W * 0.6}px, ${-side * p * 80}px) rotate(${side * p * 8}deg)`;
	return (
		<>
			{([-1, 1] as const).map((side) => (
				<AbsoluteFill key={side} style={{transform: move(side), transformOrigin: side < 0 ? '0% 100%' : '100% 0%', filter: sh}}>
					<AbsoluteFill style={{clipPath: poly(-side * 6, side), background: T.paper}} />
					<AbsoluteFill style={{clipPath: poly(0, side)}}>{children}</AbsoluteFill>
				</AbsoluteFill>
			))}
		</>
	);
};
