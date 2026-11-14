/**
 * Kit "pintado à mão" para Canvas 2D (origem: teste de estilo noite de 1907, nov/2026).
 * OPCIONAL: copiar para src/biblioteca/ só se o conceito escolhido pedir ilustração pintada (guache, tinta, papel).
 * É técnica, não look: paleta, composição e cena saem do conceito de cada vídeo.
 * Uso típico: pintar camadas estáticas uma vez com `layer()` (cache no módulo), compor por frame num <canvas>
 * com parallax, e desenhar por frame só o que se mexe. Exemplo completo: ~/videos/tallysticks-estilo-teste/src/Cena.tsx
 */
import {noise2D} from '@remotion/noise';

export type P = [number, number];
export type Ctx = CanvasRenderingContext2D;

/** RNG determinístico (mesma semente = mesmo desenho em todo frame/aba de render). */
export const rng = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/* ---------- cor ---------- */
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const rgba = (c: string, a = 1) => {
	const [r, g, b] = hex(c);
	return `rgba(${r},${g},${b},${a})`;
};
/** Varia luminosidade e um pouco a matiz (o "erro humano" da tinta). */
export const jitter = (c: string, amt: number, r: () => number, a = 1) => {
	const [R, G, B] = hex(c);
	const l = (r() - 0.5) * 2 * amt;
	const h = (r() - 0.5) * amt * 0.6;
	const f = (v: number, k: number) => Math.max(0, Math.min(255, Math.round(v + l * 255 + k * 255)));
	return `rgba(${f(R, h)},${f(G, 0)},${f(B, -h)},${a})`;
};
export const mix = (a: string, b: string, t: number) => {
	const A = hex(a);
	const B = hex(b);
	return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

/* ---------- geometria orgânica ---------- */
/** Subdivide um polígono e empurra cada ponto pelo ruído: borda de recorte de papel/guache. */
export const wob = (pts: P[], amp: number, seed: string, step = 14, closed = true): P[] => {
	const out: P[] = [];
	const n = closed ? pts.length : pts.length - 1;
	for (let i = 0; i < n; i++) {
		const [x0, y0] = pts[i];
		const [x1, y1] = pts[(i + 1) % pts.length];
		const len = Math.hypot(x1 - x0, y1 - y0);
		const k = Math.max(1, Math.round(len / step));
		for (let j = 0; j < k; j++) {
			const t = j / k;
			const x = x0 + (x1 - x0) * t;
			const y = y0 + (y1 - y0) * t;
			out.push([x + noise2D(seed + 'x', x * 0.02, y * 0.02) * amp, y + noise2D(seed + 'y', x * 0.02, y * 0.02) * amp]);
		}
	}
	if (!closed) out.push(pts[pts.length - 1]);
	return out;
};

export const path = (ctx: Ctx, pts: P[], closed = true) => {
	ctx.beginPath();
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
	if (closed) ctx.closePath();
};

/** Mancha irregular (a unidade básica do pincel). */
export const blob = (ctx: Ctx, x: number, y: number, rx: number, ry: number, r: () => number) => {
	const n = 9 + Math.floor(r() * 5);
	const rot = r() * Math.PI;
	ctx.beginPath();
	for (let i = 0; i <= n; i++) {
		const a = (i / n) * Math.PI * 2;
		const k = 0.7 + r() * 0.45;
		const px = Math.cos(a) * rx * k;
		const py = Math.sin(a) * ry * k;
		const X = x + px * Math.cos(rot) - py * Math.sin(rot);
		const Y = y + px * Math.sin(rot) + py * Math.cos(rot);
		if (i === 0) ctx.moveTo(X, Y);
		else ctx.lineTo(X, Y);
	}
	ctx.closePath();
	ctx.fill();
};

type Box = [number, number, number, number]; // x, y, w, h
const bboxOf = (pts: P[]): Box => {
	const xs = pts.map((p) => p[0]);
	const ys = pts.map((p) => p[1]);
	const x = Math.min(...xs);
	const y = Math.min(...ys);
	return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
};

/**
 * Preenchimento em guache: cor base + centenas de pinceladas com variação de tom, recortadas pela forma.
 * `light` (opcional) clareia as pinceladas perto de um ponto: luz pintada, não gradiente de computador.
 */
export const gouache = (
	ctx: Ctx,
	pts: P[],
	color: string,
	o: {seed: number; density?: number; size?: number; jit?: number; stretch?: number; light?: {x: number; y: number; r: number; c: string; k?: number}} = {seed: 1},
) => {
	const r = rng(o.seed);
	const [bx, by, bw, bh] = bboxOf(pts);
	ctx.save();
	path(ctx, pts);
	ctx.clip();
	ctx.fillStyle = color;
	ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
	const size = o.size ?? 10;
	const n = Math.round(((bw * bh) / (size * size)) * (o.density ?? 0.9));
	for (let i = 0; i < n; i++) {
		const x = bx + r() * bw;
		const y = by + r() * bh;
		let c = color;
		if (o.light) {
			const d = Math.hypot(x - o.light.x, y - o.light.y) / o.light.r;
			if (d < 1) c = mix(color, o.light.c, (1 - d) * (1 - d) * (o.light.k ?? 0.8));
		}
		ctx.fillStyle = jitter(c, o.jit ?? 0.05, r, 0.35 + r() * 0.45);
		const s = size * (0.45 + r() * 0.9);
		blob(ctx, x, y, s * (o.stretch ?? 1.4), s, r);
	}
	ctx.restore();
};

/** Traço a tinta com espessura variável (pena), segmento a segmento. */
export const ink = (ctx: Ctx, pts: P[], w: number, color: string, seed: string, closed = false) => {
	ctx.strokeStyle = color;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	const all = closed ? [...pts, pts[0]] : pts;
	for (let i = 0; i < all.length - 1; i++) {
		const [x0, y0] = all[i];
		const [x1, y1] = all[i + 1];
		ctx.lineWidth = Math.max(0.4, w * (0.55 + 0.6 * (noise2D(seed, i * 0.18, 0) * 0.5 + 0.5)));
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
	}
};

/** Faixas de pincel seco (céu, névoa, reflexo): traços horizontais longos com falhas. */
export const dryBrush = (ctx: Ctx, box: Box, color: string, o: {seed: number; count: number; thick?: number; alpha?: number; jit?: number}) => {
	const r = rng(o.seed);
	const [bx, by, bw, bh] = box;
	for (let i = 0; i < o.count; i++) {
		const y = by + r() * bh;
		const x = bx - 60 + r() * bw;
		const len = 80 + r() * 420;
		const th = (o.thick ?? 6) * (0.4 + r());
		ctx.fillStyle = jitter(color, o.jit ?? 0.04, r, (o.alpha ?? 0.35) * (0.4 + r() * 0.8));
		/* o traço é uma fita com bordas tremidas e "pelos" que falham no fim */
		let px = x;
		while (px < x + len) {
			const seg = 6 + r() * 26;
			if (r() > 0.12) {
				const taper = 1 - Math.pow((px - x) / len, 3);
				ctx.fillRect(px, y + (r() - 0.5) * 1.5, seg, th * taper * (0.6 + r() * 0.5));
			}
			px += seg + (r() < 0.2 ? r() * 10 : 0);
		}
	}
};

/** Halo em anéis concêntricos (luz "ilustrada"). */
export const halo = (ctx: Ctx, x: number, y: number, r0: number, color: string, rings = 5, a = 0.09) => {
	for (let i = rings; i >= 1; i--) {
		ctx.fillStyle = rgba(color, a);
		ctx.beginPath();
		ctx.arc(x, y, r0 * (0.4 + i * 0.55), 0, Math.PI * 2);
		ctx.fill();
	}
	const g = ctx.createRadialGradient(x, y, 0, x, y, r0 * 1.2);
	g.addColorStop(0, rgba(color, 0.55));
	g.addColorStop(1, rgba(color, 0));
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.arc(x, y, r0 * 1.2, 0, Math.PI * 2);
	ctx.fill();
};

/** Textura de papel: ruído fino + fibras. Gerada uma vez, deslocada por frame. */
export const paper = (w: number, h: number, seed = 7) => {
	const c = new OffscreenCanvas(w, h);
	const x = c.getContext('2d')!;
	const r = rng(seed);
	const img = x.createImageData(w, h);
	for (let i = 0; i < img.data.length; i += 4) {
		const v = 128 + (r() - 0.5) * 70;
		img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
		img.data[i + 3] = 255;
	}
	x.putImageData(img, 0, 0);
	/* manchas grandes de absorção (o papel não é uniforme) */
	for (let i = 0; i < 260; i++) {
		x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.025 + r() * 0.03})`;
		blob(x as unknown as Ctx, r() * w, r() * h, 40 + r() * 160, 30 + r() * 120, r);
	}
	/* fibras */
	for (let i = 0; i < 1800; i++) {
		x.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.06 + r() * 0.08})`;
		x.lineWidth = 0.6 + r() * 0.8;
		const px = r() * w;
		const py = r() * h;
		const a = r() * Math.PI;
		const l = 4 + r() * 18;
		x.beginPath();
		x.moveTo(px, py);
		x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l);
		x.stroke();
	}
	return c;
};

export const layer = (w: number, h: number, draw: (ctx: Ctx) => void) => {
	const c = new OffscreenCanvas(w, h);
	draw(c.getContext('2d') as unknown as Ctx);
	return c;
};
