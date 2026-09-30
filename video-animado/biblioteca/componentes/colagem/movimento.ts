/**
 * Movimento de papel/colagem (origem: um vídeo biográfico anterior). OPCIONAL: copiar para src/biblioteca/ junto com primitives.tsx
 * só se o conceito pedir papel recortado. Não é o movimento padrão da skill.
 */
import {Easing, interpolate, random, spring} from 'remotion';
import {clamp, FPS, step} from '../lib';
import {T} from '../tema';

/** Elemento pousando: vem de cima (maior, girado, sombra difusa) e assenta com mola. */
export function land(
	frame: number,
	at: number,
	o: {dx?: number; dy?: number; rot?: number; spin?: number; scale?: number; dur?: number; stepped?: boolean} = {},
) {
	const {dx = 0, dy = -70, rot = 0, spin = 5, scale = 1.14, dur = 12, stepped = true} = o;
	const f = (stepped ? step(frame) : frame) - at;
	if (f < 0) return {visible: false, transform: '', lift: 1, p: 0};
	const p = spring({frame: f, fps: FPS, config: {damping: 16, stiffness: 190, mass: 0.7}, durationInFrames: dur});
	const lift = 1 - clamp(f / dur);
	return {
		visible: true,
		p,
		lift,
		transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) rotate(${rot + spin * (1 - p)}deg) scale(${1 + (scale - 1) * (1 - p)})`,
	};
}

/** Pop elástico (flat/rabisco): escala 0 → 1 com overshoot. */
export function pop(frame: number, at: number, o: {dur?: number; stepped?: boolean} = {}) {
	const {dur = 14, stepped = false} = o;
	const f = (stepped ? step(frame) : frame) - at;
	if (f < 0) return {visible: false, s: 0};
	return {visible: true, s: spring({frame: f, fps: FPS, config: {damping: 9, stiffness: 180, mass: 0.6}, durationInFrames: dur})};
}

/** Sombra projetada coerente com a altura do papel. */
export const shadow = (lift: number, base = 1) =>
	`drop-shadow(${(3 + 16 * lift) * base}px ${(5 + 26 * lift) * base}px ${(4 + 22 * lift) * base}px rgba(${T.shadow},${0.42 - 0.14 * lift}))`;

/** Saída: puxado para fora do quadro. */
export function pull(frame: number, at: number, o: {dx?: number; dy?: number; spin?: number; dur?: number} = {}) {
	const {dx = -1400, dy = -200, spin = -14, dur = 14} = o;
	const f = step(frame) - at;
	if (f < 0) return {transform: '', lift: 0, gone: false};
	const p = interpolate(f, [0, dur], [0, 1], {extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	return {transform: `translate(${dx * p}px, ${dy * p}px) rotate(${spin * p}deg)`, lift: clamp(p * 3), gone: p >= 1};
}

/** Tremor de traço desenhado à mão ("boil"): muda a cada 4 frames. */
export const boil = (frame: number, seed: string, amp = 0.6) => {
	const s = step(frame, 4);
	return {
		x: (random(`${seed}x${s}`) - 0.5) * 2 * amp,
		y: (random(`${seed}y${s}`) - 0.5) * 2 * amp,
		r: (random(`${seed}r${s}`) - 0.5) * 0.3 * amp,
	};
};

/** Borda de papel rasgada: polígono externo (fibra clara) e interno (papel). */
export type Edges = {top?: boolean; right?: boolean; bottom?: boolean; left?: boolean};
export function tornPolygons(w: number, h: number, seed: string, edges: Edges, amp = 9) {
	const outer: string[] = [];
	const inner: string[] = [];
	let k = 0;
	const r = () => random(`${seed}-${k++}`);
	const edge = (len: number, torn: boolean, map: (t: number, off: number) => [number, number]) => {
		const n = torn ? Math.max(8, Math.round(len / 7)) : 2;
		const ph1 = r() * 6.28, ph2 = r() * 6.28, f1 = 1 + r() * 2, f2 = 3 + r() * 4;
		for (let i = 0; i < n; i++) {
			const t = i / n;
			if (!torn) {
				const [x, y] = map(t, 0);
				outer.push(`${x}px ${y}px`);
				inner.push(`${x}px ${y}px`);
				continue;
			}
			const wave = 0.5 + 0.3 * Math.sin(t * 6.28 * f1 + ph1) + 0.2 * Math.sin(t * 6.28 * f2 + ph2);
			const o = amp * (wave * 0.8 + r() * 0.45);
			const fiber = 1.5 + r() * 3.5;
			const [ox, oy] = map(t, o);
			const [ix, iy] = map(t, o + fiber);
			outer.push(`${ox.toFixed(1)}px ${oy.toFixed(1)}px`);
			inner.push(`${ix.toFixed(1)}px ${iy.toFixed(1)}px`);
		}
	};
	edge(w, !!edges.top, (t, o) => [t * w, o]);
	edge(h, !!edges.right, (t, o) => [w - o, t * h]);
	edge(w, !!edges.bottom, (t, o) => [w - t * w, h - o]);
	edge(h, !!edges.left, (t, o) => [o, h - t * h]);
	return {outer: `polygon(${outer.join(',')})`, inner: `polygon(${inner.join(',')})`};
}

/** Linha de rasgo vertical (transição) em x0, ao longo da altura h. */
export function tearLine(seed: string, x0: number, h: number) {
	const pts: [number, number][] = [];
	let x = x0;
	for (let y = -20; y <= h + 20; y += 9) {
		x += (random(`${seed}${y}`) - 0.5) * 16 + Math.sin(y / 140) * 2.5;
		pts.push([x, y]);
	}
	return pts;
}

/** Frame da palavra `w` do bloco (medida pelo Whisper em scripts/align.py). `n` = qual ocorrência (0 = primeira). */
