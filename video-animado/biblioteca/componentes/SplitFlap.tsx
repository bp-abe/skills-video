/**
 * Painel split-flap (origem: destro-canhoto, 25/09/2026). Legenda que vira plaquinhas em cascata até assentar.
 * Uso: <FlapBoard msgs={[{at, text, strike?}]} n={15} cw={56} ch={80} x y />  · som: flapSchedule() dá os tempos.
 * Cores do tema: T.ink (plaquinha), T.paper (letra), T.accent2 (risco). Fonte Space Mono (trocar se o conceito pedir).
 */
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/SpaceMono';
import {clamp} from '../lib';
import {T} from '../tema';

export const MONO = loadFont('normal', {weights: ['700']}).fontFamily;
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%/';
export const FLIP = 3; // frames por virada de plaquinha
export type Msg = {at: number; text: string; strike?: boolean; color?: string};

const pad = (s: string, n: number) => {
	const l = Math.max(0, Math.floor((n - s.length) / 2));
	return (' '.repeat(l) + s).padEnd(n, ' ').slice(0, n);
};

/** Quantas viradas a plaquinha k faz na mensagem m (determinístico: usado também pelo som). */
export const flipsFor = (m: number, k: number, changed: boolean) => (changed ? 1 + Math.floor(random(`fl${m}-${k}`) * 3) : 0);

export const flapSchedule = (msgs: Msg[], n: number) =>
	msgs.map((m, i) => {
		const prev = i ? pad(msgs[i - 1].text, n) : ' '.repeat(n);
		const cur = pad(m.text, n);
		const cells = Array.from({length: n}).map((_, k) => {
			const changed = prev[k] !== cur[k];
			return {start: m.at + Math.round(k * 0.6), flips: flipsFor(i, k, changed), from: prev[k], to: cur[k]};
		});
		return {cells, cur};
	});

const Half: React.FC<{ch: string; top: boolean; w: number; h: number; color: string}> = ({ch, top, w, h, color}) => (
	<div style={{position: 'absolute', left: 0, top: top ? 0 : h / 2, width: w, height: h / 2, overflow: 'hidden', background: T.ink, borderRadius: top ? '7px 7px 0 0' : '0 0 7px 7px'}}>
		<div style={{position: 'absolute', left: 0, top: top ? 0 : -h / 2, width: w, height: h, display: 'grid', placeItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: h * 0.66, color, lineHeight: 1}}>
			{ch === ' ' ? '' : ch}
		</div>
	</div>
);

export const FlapBoard: React.FC<{msgs: Msg[]; n: number; cw: number; ch: number; gap?: number; x: number; y: number; appear?: number}> = ({
	msgs,
	n,
	cw,
	ch,
	gap = 6,
	x,
	y,
	appear = 0,
}) => {
	const frame = useCurrentFrame();
	const sched = React.useMemo(() => flapSchedule(msgs, n), [msgs, n]);
	let mi = -1;
	for (let i = 0; i < msgs.length; i++) if (frame >= msgs[i].at) mi = i;
	const vis = clamp((frame - appear) / 8);
	return (
		<div style={{position: 'absolute', left: x, top: y, display: 'flex', gap, opacity: vis, transform: `translateY(${(1 - vis) * 20}px)`}}>
			{Array.from({length: n}).map((_, k) => {
				let a = ' ', b = ' ', p = 1;
				let color = T.paper;
				if (mi >= 0) {
					const c = sched[mi].cells[k];
					color = msgs[mi].color ?? T.paper;
					const f = frame - c.start;
					const total = c.flips + 1;
					if (c.flips === 0 || f >= total * FLIP) {
						a = b = c.to;
					} else if (f < 0) {
						a = b = c.from;
					} else {
						const s = Math.floor(f / FLIP);
						const seq = [c.from, ...Array.from({length: c.flips}).map((__, j) => CHARS[Math.floor(random(`c${mi}${k}${j}`) * CHARS.length)]), c.to];
						a = seq[s];
						b = seq[s + 1];
						p = (f % FLIP) / FLIP;
					}
				}
				// a = letra que sai, b = que entra. Metade de cima já mostra b; a de baixo mostra a até a aba cair.
				return (
					<div key={k} style={{position: 'relative', width: cw, height: ch}}>
						<Half ch={p >= 1 ? b : b} top w={cw} h={ch} color={color} />
						<Half ch={p >= 1 ? b : p < 0.5 ? a : b} top={false} w={cw} h={ch} color={color} />
						{p < 1 && p < 0.5 ? (
							<div style={{position: 'absolute', inset: 0, transformOrigin: `50% ${ch / 2}px`, transform: `perspective(400px) rotateX(${p * 180}deg)`}}>
								<Half ch={a} top w={cw} h={ch} color={color} />
								<div style={{position: 'absolute', left: 0, top: 0, width: cw, height: ch / 2, background: `rgba(0,0,0,${p * 0.8})`}} />
							</div>
						) : null}
						{p < 1 && p >= 0.5 ? (
							<div style={{position: 'absolute', inset: 0, transformOrigin: `50% ${ch / 2}px`, transform: `perspective(400px) rotateX(${(p - 1) * 180}deg)`}}>
								<Half ch={b} top={false} w={cw} h={ch} color={color} />
							</div>
						) : null}
						{/* fenda do meio */}
						<div style={{position: 'absolute', left: 0, right: 0, top: ch / 2 - 1, height: 2, background: '#000', opacity: 0.55}} />
					</div>
				);
			})}
			{mi >= 0 && msgs[mi].strike ? <Strike at={msgs[mi].at + n + 10} w={n * (cw + gap) - gap} h={ch} text={msgs[mi].text} n={n} cw={cw} gap={gap} /> : null}
		</div>
	);
};

/** Risco na cor accent2 atravessando só as letras da palavra. */
const Strike: React.FC<{at: number; w: number; h: number; text: string; n: number; cw: number; gap: number}> = ({at, h, text, n, cw, gap}) => {
	const frame = useCurrentFrame();
	const p = clamp((frame - at) / 6);
	if (p <= 0) return null;
	const l = Math.floor((n - text.length) / 2);
	const x0 = l * (cw + gap) - 12;
	const len = text.length * (cw + gap) + 18;
	return <div style={{position: 'absolute', left: x0, top: h / 2 - 9, width: len * p, height: 18, background: T.accent2, borderRadius: 9, transform: 'rotate(-4deg)', transformOrigin: 'left center'}} />;
};
