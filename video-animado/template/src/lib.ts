import {Easing, interpolate, random, spring, useVideoConfig} from 'remotion';
import timeline from '../public/timeline.json';
import BEATS from '../public/beats.json';
import WORDS from '../public/words.json';
import {T} from './tema';

export const TL = timeline;
export const FPS = timeline.fps;
export const F = (s: number) => Math.round(s * FPS);
export const TOTAL = F(timeline.total);

const block = (id: string) => {
	const b = timeline.blocks.find((x) => x.id === id);
	if (!b) throw new Error(`bloco ${id} não está em timeline.json`);
	return b;
};
export const blockStart = (id: string) => F(block(id).start);
export const blockEnd = (id: string) => F(block(id).start + block(id).dur);

/** Frame em que começa a frase `i` do bloco (medido no WAV), antecipado de `lead` frames: o visual chega um pouco antes da palavra. */
export const cue = (id: string, i: number, lead = 3, plus = 0) => {
	const b = block(id);
	const ph = b.phrases[Math.min(i, b.phrases.length - 1)];
	return F(b.start + ph[0] + plus) - lead;
};
export const cueEnd = (id: string, i: number) => {
	const b = block(id);
	return F(b.start + b.phrases[Math.min(i, b.phrases.length - 1)][1]);
};

/** Formato atual. `pick(paisagem, retrato)` escolhe valor de layout por formato. */
export const useFmt = () => {
	const {width: W, height: H} = useVideoConfig();
	const vertical = H > W;
	return {W, H, vertical, pick: <T,>(landscape: T, portrait: T) => (vertical ? portrait : landscape)};
};

/** Stop-motion: move "em dois" (15 fps). Usar nos estilos feitos à mão; no flat usar o frame cru. */
export const step = (frame: number, n = 2) => Math.floor(frame / n) * n;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** Mola com parâmetros por papel (ver references/direcao.md §Movimento): 0 → 1 a partir do frame `at`.
 *  ui (ágil) · padrao (cartões, câmera) · pesada (tipografia grande, logo) · viva (objeto com graça, overshoot visível). */
export const MOLAS = {ui: {stiffness: 320, damping: 30}, padrao: {stiffness: 170, damping: 26}, pesada: {stiffness: 120, damping: 24}, viva: {stiffness: 180, damping: 12}};
export const mola = (frame: number, at: number, papel: keyof typeof MOLAS = 'padrao') =>
	frame < at ? 0 : spring({frame: frame - at, fps: FPS, config: {mass: 1, ...MOLAS[papel]}});

export const cueW = (id: string, w: string, lead = 3, n = 0) => {
	const list = (WORDS as Record<string, [string, number, number][]>)[id];
	const clean = (x: string) => x.toLowerCase().replace(/[^a-zà-ú0-9]/g, '');
	const hits = list.filter((x) => clean(x[0]) === clean(w));
	if (!hits.length) throw new Error(`palavra ${w} não está no bloco ${id}`);
	return F(block(id).start + hits[Math.min(n, hits.length - 1)][1]) - lead;
};

/* ---------- batidas (public/beats.json: partitura grava sozinha; trilha pronta → scripts/beatmap.py) ---------- */
const BT = (BEATS as {batidas: number[]; compassos: number[]; virada: number | null}) ?? {batidas: [], compassos: [], virada: null};
/** Frame da batida i (ou do compasso i, se `compasso`). */
export const batida = (i: number, compasso = false) => {
	const g = compasso ? BT.compassos : BT.batidas;
	return g.length ? F(g[Math.max(0, Math.min(i, g.length - 1))]) : 0;
};
/** Encaixa um frame na batida mais próxima (cortes e viradas caem na batida ou `antes` frames antes). Sem mapa: devolve o frame. */
export const naBatida = (frame: number, antes = 2, compasso = false) => {
	const g = compasso ? BT.compassos : BT.batidas;
	if (!g.length) return frame;
	let best = F(g[0]);
	for (const t of g) { const b = F(t); if (Math.abs(b - frame) < Math.abs(best - frame)) best = b; }
	return best - antes;
};
/** Frame da virada da música (maior entrada de graves), ou null. */
export const virada = () => (BT.virada == null ? null : F(BT.virada));
